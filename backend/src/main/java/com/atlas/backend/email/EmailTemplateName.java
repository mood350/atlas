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
    DEAL_INACTIVITY_REMINDER("deal_inactivity_reminder"),
    DEAL_ESCALATION_ALERT("deal_escalation_alert"),

    // Variables : clientName, agencyName, quoteNumber, quoteTitle,
    //             totalAmount, currency, validUntil, portalUrl
    QUOTE_SENT("quote_sent"),

    // Variables : agencyMemberName, clientName, quoteNumber, quoteTitle,
    //             totalAmount, currency, accepted (boolean), rejectionReason, quoteUrl
    QUOTE_RESPONSE("quote_response");

    private final String name;

    EmailTemplateName(String name) {
        this.name = name;
    }
}