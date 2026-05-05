package com.atlas.backend.payment;

import com.atlas.backend.invoice.Invoice;
import com.atlas.backend.invoice.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaydunyaService {

    private final PaymentRepository paymentRepository;
    private final InvoiceService    invoiceService;

    @Value("${payment.paydunya.master-key}")
    private String masterKey;

    @Value("${payment.paydunya.public-key}")
    private String publicKey;

    @Value("${payment.paydunya.private-key}")
    private String privateKey;

    @Value("${payment.paydunya.token}")
    private String token;

    @Value("${payment.paydunya.mode}")
    private String mode;

    // ─── Initier un paiement ─────────────────────────────────────────────────

    @Transactional
    public Payment initiatePayment(Invoice invoice) {
        log.info("[PAYDUNYA] TODO Upload S3 a implementer");
        log.info("[PAYDUNYA] Initiation paiement invoice='{}' montant={}{}",
                invoice.getInvoiceNumber(), invoice.getTotalAmount(), invoice.getCurrency());

        Payment payment = Payment.builder()
                .agency(invoice.getAgency())
                .invoice(invoice)
                .provider(Payment.PaymentProvider.PAYDUNYA)
                .amount(invoice.getRemainingAmount())
                .currency(invoice.getCurrency())
                .status(Payment.PaymentStatus.PENDING)
                .build();

        Payment saved = paymentRepository.save(payment);

        log.info("[PAYDUNYA] Paiement cree id={} mode='{}' — appel API PayDunya a implementer",
                saved.getId(), mode);

        return saved;
    }

    // ─── Verifier la signature HMAC-SHA256 d'un webhook ─────────────────────

    public boolean verifyWebhookSignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            String expected = hex.toString();

            boolean valid = expected.equalsIgnoreCase(signature);
            if (!valid) {
                log.warn("[PAYDUNYA] Signature webhook invalide — signature recue={}", signature);
            }
            return valid;
        } catch (Exception e) {
            log.error("[PAYDUNYA] Erreur verification signature: {}", e.getMessage());
            return false;
        }
    }

    // ─── Traiter un evenement webhook ────────────────────────────────────────

    @Transactional
    public void handleWebhookEvent(String payload) {
        log.info("[PAYDUNYA] Webhook recu payload={}o", payload.length());

        try {
            String invoiceToken = extractInvoiceToken(payload);
            String status       = extractStatus(payload);

            paymentRepository.findByTransactionId(invoiceToken).ifPresentOrElse(
                    payment -> updatePaymentFromEvent(payment, status, payload),
                    () -> log.warn("[PAYDUNYA] Paiement introuvable token='{}'", invoiceToken)
            );
        } catch (Exception e) {
            log.error("[PAYDUNYA] Erreur traitement webhook: {}", e.getMessage());
        }
    }

    private void updatePaymentFromEvent(Payment payment, String status, String payload) {
        payment.setWebhookPayload(payload);

        switch (status) {
            case "completed" -> {
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                try {
                    invoiceService.markAsPaid(payment.getInvoice().getId());
                } catch (Exception e) {
                    log.error("[PAYDUNYA] Erreur mise a jour facture: {}", e.getMessage());
                }
                log.info("[PAYDUNYA] Paiement complete transactionId='{}'",
                        payment.getTransactionId());
            }
            case "cancelled", "failed" -> {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason(status);
                paymentRepository.save(payment);
                log.info("[PAYDUNYA] Paiement echoue transactionId='{}' statut='{}'",
                        payment.getTransactionId(), status);
            }
            default -> log.info("[PAYDUNYA] Statut non gere status='{}'", status);
        }
    }

    private String extractInvoiceToken(String payload) {
        int start = payload.indexOf("\"invoice_token\":\"");
        if (start == -1) return "unknown";
        start += 17;
        int end = payload.indexOf("\"", start);
        return end == -1 ? "unknown" : payload.substring(start, end);
    }

    private String extractStatus(String payload) {
        int start = payload.indexOf("\"status\":\"");
        if (start == -1) return "unknown";
        start += 10;
        int end = payload.indexOf("\"", start);
        return end == -1 ? "unknown" : payload.substring(start, end);
    }
}
