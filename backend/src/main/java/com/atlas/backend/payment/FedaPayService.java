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
public class FedaPayService {

    private final PaymentRepository paymentRepository;
    private final InvoiceService    invoiceService;

    @Value("${payment.fedapay.api-key}")
    private String apiKey;

    @Value("${payment.fedapay.environment}")
    private String environment;

    @Value("${payment.fedapay.webhook-secret}")
    private String webhookSecret;

    // ─── Initier un paiement ─────────────────────────────────────────────────

    @Transactional
    public Payment initiatePayment(Invoice invoice) {
        log.info("[FEDAPAY] TODO Upload S3 a implementer");
        log.info("[FEDAPAY] Initiation paiement invoice='{}' montant={}{}",
                invoice.getInvoiceNumber(), invoice.getTotalAmount(), invoice.getCurrency());

        Payment payment = Payment.builder()
                .agency(invoice.getAgency())
                .invoice(invoice)
                .provider(Payment.PaymentProvider.FEDAPAY)
                .amount(invoice.getRemainingAmount())
                .currency(invoice.getCurrency())
                .status(Payment.PaymentStatus.PENDING)
                .build();

        Payment saved = paymentRepository.save(payment);

        log.info("[FEDAPAY] Paiement cree id={} — appel API FedaPay a implementer avec apiKey",
                saved.getId());

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
                log.warn("[FEDAPAY] Signature webhook invalide — signature recue={}", signature);
            }
            return valid;
        } catch (Exception e) {
            log.error("[FEDAPAY] Erreur verification signature: {}", e.getMessage());
            return false;
        }
    }

    // ─── Traiter un evenement webhook ────────────────────────────────────────

    @Transactional
    public void handleWebhookEvent(String payload) {
        log.info("[FEDAPAY] Webhook recu payload={}o", payload.length());

        try {
            String transactionId = extractTransactionId(payload);
            String eventType     = extractEventType(payload);

            paymentRepository.findByTransactionId(transactionId).ifPresentOrElse(
                    payment -> updatePaymentFromEvent(payment, eventType, payload),
                    () -> log.warn("[FEDAPAY] Paiement introuvable transactionId='{}'", transactionId)
            );
        } catch (Exception e) {
            log.error("[FEDAPAY] Erreur traitement webhook: {}", e.getMessage());
        }
    }

    private void updatePaymentFromEvent(Payment payment, String eventType, String payload) {
        payment.setWebhookPayload(payload);

        switch (eventType) {
            case "transaction.approved" -> {
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                try {
                    invoiceService.markAsPaid(payment.getInvoice().getId());
                } catch (Exception e) {
                    log.error("[FEDAPAY] Erreur mise a jour facture: {}", e.getMessage());
                }
                log.info("[FEDAPAY] Paiement approuve transactionId='{}'",
                        payment.getTransactionId());
            }
            case "transaction.declined", "transaction.canceled" -> {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason(eventType);
                paymentRepository.save(payment);
                log.info("[FEDAPAY] Paiement echoue transactionId='{}' raison='{}'",
                        payment.getTransactionId(), eventType);
            }
            default -> log.info("[FEDAPAY] Evenement non gere type='{}'", eventType);
        }
    }

    private String extractTransactionId(String payload) {
        int start = payload.indexOf("\"transaction_id\":\"");
        if (start == -1) return "unknown";
        start += 18;
        int end = payload.indexOf("\"", start);
        return end == -1 ? "unknown" : payload.substring(start, end);
    }

    private String extractEventType(String payload) {
        int start = payload.indexOf("\"event\":\"");
        if (start == -1) return "unknown";
        start += 9;
        int end = payload.indexOf("\"", start);
        return end == -1 ? "unknown" : payload.substring(start, end);
    }
}
