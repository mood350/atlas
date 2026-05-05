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
    QUOTE_RESPONSE("quote_response"),

    // Variables : clientName, agencyName, contractNumber, contractTitle, validUntil, portalUrl
    CONTRACT_SENT("contract_sent"),

    // Variables : agencyMemberName, clientName, contractNumber, signerName, signedAt, signatureHash
    CONTRACT_SIGNED("contract_signed"),

    // Variables : clientName, agencyName, invoiceNumber, totalAmount, currency, dueDate, portalUrl
    INVOICE_SENT("invoice_sent"),

    // Variables : clientName, invoiceNumber, totalAmount, dueDate, daysOverdue, portalUrl
    INVOICE_REMINDER("invoice_reminder"),

    // Variables : clientName, invoiceNumber, paidAmount, currency, remainingAmount, paidAt
    PAYMENT_CONFIRMED("payment_confirmed");

    private final String name;

    EmailTemplateName(String name) {
        this.name = name;
    }
}