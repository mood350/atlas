package com.atlas.backend.user;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.role.Role;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "_user")
@EntityListeners(AuditingEntityListener.class)
public class User extends Listeners implements Principal, UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Informations personnelles ────────────────────────────────────────────
    private String firstName;
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    /** Numéro de téléphone — requis pour SMS (Twilio) et WhatsApp Business */
    @Column(unique = true)
    private String phoneNumber;

    /** URL de la photo de profil (stockée sur S3/Cloudinary) */
    private String avatarUrl;

    // ─── Localisation & préférences ──────────────────────────────────────────
    /**
     * Fuseau horaire IANA (ex: "Africa/Abidjan", "Africa/Dakar", "Africa/Lagos")
     * CRITIQUE pour les rendez-vous — un meeting à 10h Dakar ≠ 10h Paris
     */
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    @Builder.Default
    private String timezone = "Africa/Abidjan";

    /**
     * Langue préférée (ex: "fr", "en")
     * Pour les emails transactionnels et l'interface
     */
    @Column(nullable = false, columnDefinition = "VARCHAR(5)")
    @Builder.Default
    private String preferredLanguage = "fr";

    // ─── Multi-tenant : appartenance à l'agence ───────────────────────────────
    /**
     * CRITIQUE — Chaque utilisateur appartient à une agence.
     * C'est le pilier de l'isolation multi-tenant.
     * nullable = true : un SUPER_ADMIN plateforme n'appartient à aucune agence.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = true)
    private Agency agency;

    // ─── Sécurité du compte ───────────────────────────────────────────────────
    private boolean enabled;
    private boolean accountLocked;

    /**
     * Nombre de tentatives de connexion échouées.
     * Au-delà de 5 → verrouillage automatique du compte.
     */
    @Builder.Default
    private int failedLoginAttempts = 0;

    /** Date du dernier verrouillage (pour déverrouillage automatique après 30 min) */
    private LocalDateTime lockedAt;

    /** Date de la dernière connexion réussie */
    private LocalDateTime lastLoginAt;

    // ─── Détection nouvel appareil/IP (comme Google) ─────────────────────────
    private String lastKnownIp;
    private String lastKnownUserAgent;

    // ─── Préférences de notifications ────────────────────────────────────────
    @Builder.Default
    private boolean emailNotificationsEnabled = true;

    @Builder.Default
    private boolean smsNotificationsEnabled = true;

    @Builder.Default
    private boolean whatsappNotificationsEnabled = false;

    // ─── Rôles ───────────────────────────────────────────────────────────────
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> roles;

    // ─── Méthodes utilitaires ─────────────────────────────────────────────────

    public String fullName() {
        return firstName + " " + lastName;
    }

    /**
     * Vérifie si le compte est verrouillé temporairement.
     * Déverrouillage automatique après 30 minutes.
     */
    public boolean isTemporarilyLocked() {
        if (!accountLocked || lockedAt == null) return false;
        return LocalDateTime.now().isBefore(lockedAt.plusMinutes(30));
    }

    // ─── Implémentation UserDetails (Spring Security) ─────────────────────────

    @Override
    public String getName() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.roles
                .stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName()))
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !isTemporarilyLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}