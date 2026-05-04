package com.atlas.backend.email;

import lombok.Getter;

@Getter
public enum EmailTemplateName {

    ACTIVATE_ACCOUNT("activate_account"),
    WELCOME("welcome"),
    RESET_PASSWORD("reset_password"),
    NEW_DEVICE_LOGIN("new_device_login"),
    INVITATION("invitation"),
    EMAIL_CHANGE_CONFIRM("email_change_confirm"),

    /**
     * Rappel envoyé au responsable d'un deal inactif.
     * Variables : ownerName, dealTitle, clientName, stageName,
     *             amount, currency, inactiveDays, dealUrl
     */
    DEAL_INACTIVITY_REMINDER("deal_inactivity_reminder"),

    /**
     * Escalade envoyée au propriétaire de l'agence après N relances sans réponse.
     * Variables : ownerName, dealTitle, clientName, responsibleName,
     *             remindersSent, inactiveDays, dealUrl
     */
    DEAL_ESCALATION_ALERT("deal_escalation_alert");

    private final String name;

    EmailTemplateName(String name) {
        this.name = name;
    }
}