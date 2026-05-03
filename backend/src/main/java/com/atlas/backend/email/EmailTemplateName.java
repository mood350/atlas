package com.atlas.backend.email;

import lombok.Getter;

/**
 * Noms des templates Thymeleaf pour les emails transactionnels.
 *
 * Chaque valeur correspond à un fichier dans :
 *   src/main/resources/templates/emails/<name>.html
 */
@Getter
public enum EmailTemplateName {

    /** Email envoyé à l'inscription pour activer le compte */
    ACTIVATE_ACCOUNT("activate_account"),

    /** Email de bienvenue après activation du compte */
    WELCOME("welcome"),

    /** Email de réinitialisation du mot de passe */
    RESET_PASSWORD("reset_password"),

    /** Email de notification de connexion depuis un nouvel appareil */
    NEW_DEVICE_LOGIN("new_device_login"),

    /**
     * Email d'invitation à rejoindre une agence.
     * Variables : agencyName, inviteUrl, role
     */
    INVITATION("invitation"),

    /**
     * Email de confirmation de changement d'adresse email.
     * Envoyé à la NOUVELLE adresse.
     */
    EMAIL_CHANGE_CONFIRM("email_change_confirm");

    private final String name;

    EmailTemplateName(String name) {
        this.name = name;
    }
}