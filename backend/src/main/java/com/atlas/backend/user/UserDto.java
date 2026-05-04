package com.atlas.backend.user;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class UserDto {

    // ──────────────────────────────────────────────────────────────────────────
    //  RESPONSE — profil complet retourné à l'API
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long         id;
        private String       firstName;
        private String       lastName;
        private String       email;
        private String       phoneNumber;
        private String       avatarUrl;
        private String       timezone;
        private String       preferredLanguage;

        // Agence
        private Long         agencyId;
        private String       agencyName;

        // Rôles
        private List<String> roles;

        // Préférences notifications
        private boolean      emailNotificationsEnabled;
        private boolean      smsNotificationsEnabled;
        private boolean      whatsappNotificationsEnabled;

        // Sécurité (lecture seule)
        private boolean      enabled;
        private boolean      accountLocked;
        private LocalDateTime lastLoginAt;
        private LocalDateTime createdAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  SUMMARY — version compacte pour listes et sélecteurs
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long         id;
        private String       firstName;
        private String       lastName;
        private String       email;
        private String       avatarUrl;
        private List<String> roles;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  UPDATE PROFILE — modifier ses propres infos
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateProfileRequest {

        @NotBlank(message = "Le prénom est obligatoire")
        private String firstName;

        @NotBlank(message = "Le nom est obligatoire")
        private String lastName;

        @Pattern(
                regexp = "^\\+[1-9]\\d{7,14}$",
                message = "Format international requis : +22890000000"
        )
        private String phoneNumber;

        private String timezone;
        private String preferredLanguage;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  CHANGE PASSWORD
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {

        @NotBlank(message = "Le mot de passe actuel est requis")
        private String currentPassword;

        @NotBlank(message = "Le nouveau mot de passe est requis")
        @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
        private String newPassword;

        @NotBlank(message = "La confirmation est requise")
        private String confirmPassword;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  CHANGE EMAIL
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChangeEmailRequest {

        @Email(message = "Email invalide")
        @NotBlank(message = "Le nouvel email est requis")
        private String newEmail;

        @NotBlank(message = "Le mot de passe est requis pour confirmer")
        private String password;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  NOTIFICATION PREFERENCES
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NotificationPrefsRequest {
        private boolean emailNotificationsEnabled;
        private boolean smsNotificationsEnabled;
        private boolean whatsappNotificationsEnabled;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  ADMIN — modifier le rôle d'un membre (OWNER/ADMIN seulement)
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRoleRequest {

        @NotBlank(message = "Le rôle est obligatoire")
        private String role; // "OWNER" | "ADMIN" | "MEMBER"
    }
}