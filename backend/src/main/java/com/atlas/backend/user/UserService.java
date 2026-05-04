package com.atlas.backend.user;

import com.atlas.backend.agency.AgencyService;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.common.exception.UnauthorizedAccessException;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.role.Role;
import com.atlas.backend.role.RoleRepository;
import com.atlas.backend.token.Token;
import com.atlas.backend.token.TokenRepository;
import com.atlas.backend.token.TokenType;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository    userRepository;
    private final UserMapper        userMapper;
    private final RoleRepository    roleRepository;
    private final TokenRepository   tokenRepository;
    private final PasswordEncoder   passwordEncoder;
    private final EmailService      emailService;
    private final AgencyService     agencyService;

    @Value("${application.mail.from}")
    private String from;

    // ─── Récupérer son propre profil ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDto.Response getProfile(Long userId) {
        return userMapper.toResponse(getUser(userId));
    }

    // ─── Modifier son propre profil ───────────────────────────────────────────

    @Transactional
    public UserDto.Response updateProfile(Long userId, UserDto.UpdateProfileRequest dto) {
        User user = getUser(userId);

        // Vérifier unicité du numéro de téléphone si modifié
        if (dto.getPhoneNumber() != null
                && !dto.getPhoneNumber().equals(user.getPhoneNumber())
                && userRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new IllegalStateException("Ce numéro de téléphone est déjà utilisé");
        }

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());

        if (dto.getTimezone() != null)         user.setTimezone(dto.getTimezone());
        if (dto.getPreferredLanguage() != null) user.setPreferredLanguage(dto.getPreferredLanguage());

        log.info("[USER] Profil mis à jour — userId={}", userId);
        return userMapper.toResponse(userRepository.save(user));
    }

    // ─── Changer le mot de passe ──────────────────────────────────────────────

    @Transactional
    public void changePassword(Long userId, UserDto.ChangePasswordRequest dto) {
        User user = getUser(userId);

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalStateException("Mot de passe actuel incorrect");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalStateException("Les mots de passe ne correspondent pas");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        log.info("[USER] Mot de passe changé — userId={}", userId);
    }

    // ─── Demander un changement d'email ───────────────────────────────────────

    @Transactional
    public void requestEmailChange(Long userId, UserDto.ChangeEmailRequest dto) throws MessagingException {
        User user = getUser(userId);

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalStateException("Mot de passe incorrect");
        }

        if (userRepository.existsByEmail(dto.getNewEmail())) {
            throw new IllegalStateException("Cet email est déjà utilisé");
        }

        // Générer un OTP et stocker le nouvel email dans metadata
        String otp = generateOtp();
        Token token = Token.builder()
                .token(otp)
                .tokenType(TokenType.EMAIL_CHANGE)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .metadata(dto.getNewEmail()) // nouvel email stocké ici
                .user(user)
                .build();
        tokenRepository.save(token);

        Map<String, Object> props = new HashMap<>();
        props.put("username", user.fullName());
        props.put("newEmail", dto.getNewEmail());
        props.put("otp", otp);

        // Envoyé à la NOUVELLE adresse
        emailService.sendEmail(
                dto.getNewEmail(),
                "Confirmation de votre nouvelle adresse email",
                EmailTemplateName.EMAIL_CHANGE_CONFIRM,
                props,
                from
        );

        log.info("[USER] Changement email demandé — userId={} newEmail={}", userId, dto.getNewEmail());
    }

    // ─── Confirmer le changement d'email ──────────────────────────────────────

    @Transactional
    public void confirmEmailChange(Long userId, String otp) {
        User user = getUser(userId);

        Token token = tokenRepository.findByToken(otp)
                .orElseThrow(() -> new IllegalStateException("Code invalide"));

        if (token.getTokenType() != TokenType.EMAIL_CHANGE) {
            throw new IllegalStateException("Type de token invalide");
        }
        if (!token.isValid()) {
            throw new IllegalStateException("Code expiré");
        }
        if (!token.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Token non autorisé");
        }

        String newEmail = token.getMetadata();
        if (userRepository.existsByEmail(newEmail)) {
            throw new IllegalStateException("Cet email est déjà utilisé");
        }

        user.setEmail(newEmail);
        userRepository.save(user);

        token.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("[USER] Email confirmé — userId={} newEmail={}", userId, newEmail);
    }

    // ─── Mettre à jour l'avatar ───────────────────────────────────────────────

    @Transactional
    public UserDto.Response updateAvatar(Long userId, String avatarUrl) {
        User user = getUser(userId);
        user.setAvatarUrl(avatarUrl);
        return userMapper.toResponse(userRepository.save(user));
    }

    // ─── Préférences de notifications ─────────────────────────────────────────

    @Transactional
    public UserDto.Response updateNotificationPrefs(Long userId, UserDto.NotificationPrefsRequest dto) {
        User user = getUser(userId);
        user.setEmailNotificationsEnabled(dto.isEmailNotificationsEnabled());
        user.setSmsNotificationsEnabled(dto.isSmsNotificationsEnabled());
        user.setWhatsappNotificationsEnabled(dto.isWhatsappNotificationsEnabled());
        return userMapper.toResponse(userRepository.save(user));
    }

    // ─── Lister les membres d'une agence ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserDto.Response> getAgencyMembers(Long agencyId, Pageable pageable) {
        return userRepository.findByAgencyId(agencyId, pageable)
                .map(userMapper::toResponse);
    }

    // ─── Rechercher des membres ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserDto.Summary> searchMembers(Long agencyId, String query) {
        return userRepository.searchByAgency(agencyId, query)
                .stream()
                .map(userMapper::toSummary)
                .collect(Collectors.toList());
    }

    // ─── Changer le rôle d'un membre (OWNER/ADMIN seulement) ─────────────────

    @Transactional
    public UserDto.Response updateMemberRole(Long agencyId, Long targetUserId,
                                             String roleName, User requester) {
        agencyService.assertMembership(agencyId, requester);

        User target = userRepository.findByIdAndAgencyId(targetUserId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        // Un OWNER ne peut pas se rétrograder lui-même
        if (target.getId().equals(requester.getId())) {
            throw new IllegalStateException("Vous ne pouvez pas modifier votre propre rôle");
        }

        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle introuvable : " + roleName));

        target.setRoles(List.of(role));
        log.info("[USER] Rôle modifié — targetUserId={} role={} par userId={}",
                targetUserId, roleName, requester.getId());

        return userMapper.toResponse(userRepository.save(target));
    }

    // ─── Retirer un membre de l'agence ────────────────────────────────────────

    @Transactional
    public void removeMember(Long agencyId, Long targetUserId, User requester) {
        agencyService.assertMembership(agencyId, requester);

        User target = userRepository.findByIdAndAgencyId(targetUserId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        if (target.getId().equals(requester.getId())) {
            throw new IllegalStateException("Vous ne pouvez pas vous retirer vous-même");
        }

        target.setAgency(null);
        userRepository.save(target);
        log.info("[USER] Membre retiré — targetUserId={} agenceId={}", targetUserId, agencyId);
    }

    // ─── ADMIN PLATEFORME — verrouiller / déverrouiller un compte ────────────

    @Transactional
    public void lockAccount(Long userId) {
        User user = getUser(userId);
        user.setAccountLocked(true);
        user.setLockedAt(LocalDateTime.now());
        userRepository.save(user);
        log.warn("[ADMIN] Compte verrouillé manuellement — userId={}", userId);
    }

    @Transactional
    public void unlockAccount(Long userId) {
        User user = getUser(userId);
        user.setAccountLocked(false);
        user.setLockedAt(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        log.info("[ADMIN] Compte déverrouillé — userId={}", userId);
    }

    // ─── Job : déverrouillage automatique après 30 min ────────────────────────

    @Transactional
    public void autoUnlockExpiredAccounts() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);
        List<User> locked = userRepository.findLockedAccountsOlderThan(threshold);
        locked.forEach(u -> {
            u.setAccountLocked(false);
            u.setLockedAt(null);
            u.setFailedLoginAttempts(0);
        });
        if (!locked.isEmpty()) {
            userRepository.saveAll(locked);
            log.info("[SCHEDULER] {} compte(s) déverrouillé(s) automatiquement", locked.size());
        }
    }

    // ─── Utilitaires privés ───────────────────────────────────────────────────

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + email));
    }

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(999999));
    }
}