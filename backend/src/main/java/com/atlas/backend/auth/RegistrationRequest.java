package com.atlas.backend.auth;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO reçu lors de l'inscription.
 *
 * DEUX CAS D'USAGE :
 *  1. Création d'une nouvelle agence (agencyName renseigné, inviteToken null)
 *  2. Invitation à rejoindre une agence existante (inviteToken renseigné, agencyName null)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {

    // ─── Informations personnelles ────────────────────────────────────────────

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstname;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastname;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    /**
     * Numéro de téléphone — REQUIS pour :
     *  - SMS de confirmation via Twilio
     *  - WhatsApp Business API
     *  - Rappels de rendez-vous
     *
     * Format E.164 : +22890000000 (Togo), +2250000000000 (CI), etc.
     */
    @Pattern(
            regexp = "^\\+[1-9]\\d{7,14}$",
            message = "Le numéro doit être au format international : +22890000000"
    )
    private String phoneNumber;

    // ─── Contexte d'inscription ────────────────────────────────────────────────

    /**
     * Nom de l'agence — renseigné si l'utilisateur crée UNE NOUVELLE agence.
     * Mutuellement exclusif avec inviteToken.
     */
    private String agencyName;

    /**
     * Token d'invitation — renseigné si l'utilisateur rejoint une agence existante.
     * Généré par AuthenticationService.inviteMember() et envoyé par email.
     * Mutuellement exclusif avec agencyName.
     */
    private String inviteToken;

    /**
     * Fuseau horaire de l'utilisateur.
     * Envoyé depuis le frontend (détecté via Intl.DateTimeFormat().resolvedOptions().timeZone)
     * Par défaut : "Africa/Abidjan"
     */
    private String timezone;

    /** Langue préférée ("fr" par défaut) */
    private String preferredLanguage;
}