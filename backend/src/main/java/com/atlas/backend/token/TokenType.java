package com.atlas.backend.token;

/**
 * Types de tokens OTP gérés par la plateforme.
 *
 * Chaque type a une durée de vie différente configurée dans AuthenticationService :
 *  - ACTIVATION      → 15 minutes  (confirmation email à l'inscription)
 *  - PASSWORD_RESET  → 15 minutes  (réinitialisation du mot de passe)
 *  - INVITATION      → 72 heures   (invitation d'un membre dans une agence)
 *  - EMAIL_CHANGE    → 30 minutes  (validation du nouvel email lors d'un changement)
 */
public enum TokenType {

    /** Activation du compte après inscription */
    ACTIVATION,

    /** Réinitialisation du mot de passe */
    PASSWORD_RESET,

    /**
     * Invitation d'un collaborateur à rejoindre une agence.
     * Token à durée longue (72h) pour laisser le temps à la personne de répondre.
     * Stocke également le rôle proposé dans le champ metadata du Token.
     */
    INVITATION,

    /**
     * Confirmation du changement d'email.
     * Envoyé à la NOUVELLE adresse email.
     * L'ancien email reste actif jusqu'à validation.
     */
    EMAIL_CHANGE
}