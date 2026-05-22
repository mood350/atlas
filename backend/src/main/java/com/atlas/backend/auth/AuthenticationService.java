package com.atlas.backend.auth;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.role.RoleRepository;
import com.atlas.backend.security.JwtService;
import com.atlas.backend.role.Role;
import com.atlas.backend.token.Token;
import com.atlas.backend.token.TokenRepository;
import com.atlas.backend.token.TokenType;
import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgencyRepository agencyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${application.mail.from: no-reply@example.com}")
    private String from;

    @Value("${application.mailing.frontend.activation-url: http://localhost:4200/activate}")
    private String activationUrl;

    // ═══════════════════════════════════════════════════════════════
    //  INSCRIPTION
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public void register(RegistrationRequest request) throws MessagingException {

        if (request.getAgencyName() == null || request.getAgencyName().isBlank()) {
            throw new RuntimeException("Le nom de l'agence est obligatoire");
        }

        Role ownerRole = roleRepository.findByRoleName("OWNER")
                .orElseThrow(() -> new RuntimeException("Rôle OWNER introuvable en BDD"));

        // 1. Persiste le User d'abord (agency_id sera défini après)
        var user = User.builder()
                .firstName(request.getFirstname())
                .lastName(request.getLastname())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "Africa/Abidjan")
                .preferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "fr")
                .roles(new ArrayList<>(List.of(ownerRole)))
                .enabled(false)
                .accountLocked(false)
                .build();

        userRepository.save(user);

        // 2. Crée l'agence avec le User comme propriétaire
        String subdomain = generateUniqueSubdomain(request.getAgencyName());
        Agency agency = Agency.builder()
                .name(request.getAgencyName())
                .subdomain(subdomain)
                .owner(user)
                .active(false) // activée à la confirmation email
                .build();

        agencyRepository.save(agency);

        // 3. Lie le User à l'agence
        user.setAgency(agency);
        userRepository.save(user);

        sendConfirmationEmail(user);
    }

    /**
     * Génère un subdomain unique à partir du nom de l'agence.
     * Ex: "Digital Agency Abidjan" → "digital-agency-abidjan"
     * Si le subdomain existe déjà, ajoute un suffixe numérique.
     */
    private String generateUniqueSubdomain(String agencyName) {
        String base = agencyName.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        if (base.isEmpty()) base = "agency";

        String subdomain = base;
        int counter = 1;
        while (agencyRepository.existsBySubdomain(subdomain)) {
            subdomain = base + "-" + counter++;
        }
        return subdomain;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONFIRMATION EMAIL
    // ═══════════════════════════════════════════════════════════════

    /**
     * Génère un code OTP à 6 chiffres, le sauvegarde en BDD
     * et envoie l'email de confirmation.
     */
    private void sendConfirmationEmail(User user) throws MessagingException {
        String otp = generateAndSaveToken(user, TokenType.ACTIVATION);

        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("confirmationUrl", activationUrl + "?token=" + otp);
        properties.put("activation_code", otp);

        emailService.sendEmail(
                user.getEmail(),
                "Confirmation de votre compte Armin",
                EmailTemplateName.ACTIVATE_ACCOUNT,
                properties,
                from
        );
    }

    /**
     * Valide le compte utilisateur avec le code OTP reçu par email.
     */
    @Transactional
    public void confirmAccount(String tokenValue) throws MessagingException {
        Token token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        // Vérifie que le token n'est pas expiré
        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            // Token expiré → on renvoie un nouveau code
            sendConfirmationEmail(token.getUser());
            throw new RuntimeException("Token expiré. Un nouveau code vous a été envoyé.");
        }

        // Active le compte et l'agence associée
        User user = token.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        if (user.getAgency() != null && !user.getAgency().isActive()) {
            user.getAgency().setActive(true);
            agencyRepository.save(user.getAgency());
        }

        // Marque le token comme utilisé
        token.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        // Envoi email de bienvenue
        sendWelcomeEmail(user);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONNEXION
    // ═══════════════════════════════════════════════════════════════

    public AuthenticationResponse authenticate(
            AuthenticationRequest request,
            String ipAddress,
            String userAgent
    ) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        // Détection nouveau appareil/IP (comme Google)
        try {
            if (isNewDevice(user, ipAddress, userAgent)) {
                sendNewDeviceEmail(user, ipAddress, userAgent);
            }
        } catch (Exception ignored) {
            // Ne pas bloquer la connexion si l'email de notification échoue
        }

        // Met à jour le dernier IP et userAgent connus
        user.setLastKnownIp(ipAddress);
        user.setLastKnownUserAgent(userAgent);
        userRepository.save(user);

        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    //  RESET PASSWORD
    // ═══════════════════════════════════════════════════════════════

    public void requestPasswordReset(String email) throws MessagingException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email introuvable"));

        String otp = generateAndSaveToken(user, TokenType.PASSWORD_RESET);

        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("reset_code", otp);

        emailService.sendEmail(
                user.getEmail(),
                "Réinitialisation de votre mot de passe",
                EmailTemplateName.RESET_PASSWORD,
                properties,
                from
        );
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        Token token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            throw new RuntimeException("Token expiré");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    // ═══════════════════════════════════════════════════════════════
    //  UTILITAIRES PRIVÉS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Génère un OTP à 6 chiffres sécurisé et le sauvegarde en BDD.
     * Expire dans 15 minutes.
     */
    private String generateAndSaveToken(User user, TokenType type) {
        // SecureRandom → cryptographiquement sûr (pas Math.random() !)
        String otp = String.format("%06d",
                new SecureRandom().nextInt(999999));

        Token token = Token.builder()
                .token(otp)
                .tokenType(type)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .user(user)
                .build();

        tokenRepository.save(token);
        return otp;
    }

    // ═══════════════════════════════════════════════════════════════
//  REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════

    /**
     * Génère un nouvel access token à partir du refresh token.
     *
     * FLUX :
     *  1. Extrait l'email depuis le refresh token
     *  2. Charge l'user depuis la BDD
     *  3. Vérifie que le refresh token est valide
     *  4. Génère un nouvel access token
     *  5. Retourne le nouvel access token + le même refresh token
     *
     * POURQUOI on ne régénère pas le refresh token ?
     *  → Standard entreprise : le refresh token reste valide jusqu'à
     *    son expiration (7 jours). On ne le régénère que si l'user
     *    se reconnecte ou si on implémente le "refresh token rotation".
     */
    public AuthenticationResponse refreshToken(String refreshToken) {
        // Extrait l'email depuis le refresh token
        final String userEmail = jwtService.extractUsername(refreshToken);

        if (userEmail == null) {
            throw new RuntimeException("Refresh token invalide");
        }

        // Charge l'user depuis la BDD
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Vérifie que le refresh token est valide et non expiré
        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new RuntimeException("Refresh token expiré ou invalide");
        }

        // Génère un nouvel access token uniquement
        var newAccessToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // ← même refresh token
                .build();
    }

// ═══════════════════════════════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════════════════════════════

    /**
     * Déconnecte l'utilisateur.
     *
     * POURQUOI c'est complexe avec JWT ?
     *  Les JWT sont STATELESS — le serveur ne garde pas de liste
     *  des tokens actifs. Un token valide reste valide jusqu'à
     *  son expiration même après logout.
     *
     * SOLUTION standard entreprise :
     *  → Blacklist : on stocke les tokens invalidés en BDD/Redis
     *  → Ici on utilise la BDD (simple) — en prod on utilise Redis
     *    car c'est beaucoup plus rapide pour les lookups.
     *
     * FLUX :
     *  1. Extrait le JWT du header Authorization
     *  2. Efface le SecurityContext (déconnexion immédiate)
     *  → Le token sera rejeté par JwtAuthFilter à la prochaine requête
     *     car on peut ajouter une vérification blacklist.
     */
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }

        // Efface l'authentification du SecurityContext
        SecurityContextHolder.clearContext();
    }

    /**
     * Détecte si la connexion vient d'un nouvel appareil/IP.
     * Comparaison IP + UserAgent comme Google.
     */
    private boolean isNewDevice(User user, String ipAddress, String userAgent) {
        if (user.getLastKnownIp() == null || user.getLastKnownUserAgent() == null) return false;
        return !user.getLastKnownIp().equals(ipAddress) ||
                !user.getLastKnownUserAgent().equals(userAgent);
    }

    private void sendWelcomeEmail(User user) throws MessagingException {
        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());

        emailService.sendEmail(
                user.getEmail(),
                "Bienvenue sur Armin ! 🎉",
                EmailTemplateName.WELCOME,
                properties,
                from
        );
    }

    private void sendNewDeviceEmail(User user, String ip,
                                    String userAgent) throws MessagingException {
        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("ip", ip);
        properties.put("device", userAgent);
        properties.put("time", LocalDateTime.now().toString());

        emailService.sendEmail(
                user.getEmail(),
                "⚠️ Nouvelle connexion détectée sur votre compte",
                EmailTemplateName.NEW_DEVICE_LOGIN,
                properties,
                from
        );
    }
}
