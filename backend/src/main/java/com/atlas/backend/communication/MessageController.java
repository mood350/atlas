package com.atlas.backend.communication;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.atlas.backend.user.User;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // ════════════════════════════════════════════════════════════════
    //  ENVOI
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/messages/sms")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<MessageDto.Response> sendSms(
            @PathVariable Long agencyId,
            @Valid @RequestBody MessageDto.SmsRequest dto,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendSms(agencyId, dto, currentUser));
    }

    @PostMapping("/api/agencies/{agencyId}/messages/whatsapp")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<MessageDto.Response> sendWhatsApp(
            @PathVariable Long agencyId,
            @Valid @RequestBody MessageDto.WhatsAppRequest dto,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendWhatsApp(agencyId, dto, currentUser));
    }

    @PostMapping("/api/agencies/{agencyId}/messages/internal")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<MessageDto.Response> sendInternal(
            @PathVariable Long agencyId,
            @Valid @RequestBody MessageDto.InternalRequest dto,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendInternal(agencyId, dto, currentUser));
    }

    // ════════════════════════════════════════════════════════════════
    //  LECTURE — Historique global
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/agencies/{agencyId}/messages")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<MessageDto.Response>> getAll(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(messageService.getAll(agencyId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/messages/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<MessageDto.Stats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(messageService.getStats(agencyId));
    }

    // ════════════════════════════════════════════════════════════════
    //  LECTURE — Historique par contexte
    // ════════════════════════════════════════════════════════════════

    /** Timeline complète des communications d'un client (tous canaux) */
    @GetMapping("/api/agencies/{agencyId}/clients/{clientId}/messages")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<MessageDto.Response>> getClientHistory(
            @PathVariable Long agencyId,
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(messageService.getClientHistory(agencyId, clientId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/projects/{projectId}/messages")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<MessageDto.Response>> getProjectMessages(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ResponseEntity.ok(messageService.getProjectMessages(agencyId, projectId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/deals/{dealId}/messages")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<MessageDto.Response>> getDealMessages(
            @PathVariable Long agencyId,
            @PathVariable Long dealId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(messageService.getDealMessages(agencyId, dealId, pageable));
    }

    // ════════════════════════════════════════════════════════════════
    //  WEBHOOK TWILIO — Messages entrants (public, sécurisé par signature Twilio)
    // ════════════════════════════════════════════════════════════════

    /**
     * Point d'entrée pour les SMS et WhatsApp entrants via Twilio.
     * À configurer dans la console Twilio :
     *   Webhook URL : POST https://your-domain.com/api/webhooks/twilio/inbound
     */
    @PostMapping("/api/webhooks/twilio/inbound")
    public ResponseEntity<Void> twilioInbound(
            @RequestParam("From")       String from,
            @RequestParam("To")         String to,
            @RequestParam("Body")       String body,
            @RequestParam("MessageSid") String sid) {
        messageService.handleInbound(from, to, body, sid);
        return ResponseEntity.ok().build();
    }
}
