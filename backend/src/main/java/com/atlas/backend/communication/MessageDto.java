package com.atlas.backend.communication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class MessageDto {

    // ─── Requêtes d'envoi ────────────────────────────────────────────────────

    public record SmsRequest(
            @NotBlank @Pattern(regexp = "\\+?[0-9]{8,15}") String to,
            @NotBlank String body,
            Long clientId,
            Long dealId
    ) {}

    public record WhatsAppRequest(
            @NotBlank @Pattern(regexp = "\\+?[0-9]{8,15}") String to,
            @NotBlank String body,
            Long clientId,
            Long dealId
    ) {}

    public record InternalRequest(
            @NotBlank String body,
            Long projectId,
            Long dealId,
            Long clientId,
            List<Long> mentionedUserIds
    ) {}

    // ─── Réponse ─────────────────────────────────────────────────────────────

    public record Response(
            Long                     id,
            Message.MessageChannel   channel,
            Message.MessageDirection direction,
            Message.MessageStatus    status,
            String                   fromAddress,
            String                   toAddress,
            String                   subject,
            String                   body,
            Long                     clientId,
            String                   clientName,
            Long                     projectId,
            Long                     dealId,
            String                   sentByName,
            String                   externalId,
            String                   errorMessage,
            LocalDateTime            createdAt
    ) {}

    // ─── Statistiques ────────────────────────────────────────────────────────

    public record Stats(
            long              totalOutbound,
            long              totalInbound,
            Map<String, Long> byChannel,
            long              failed
    ) {}
}
