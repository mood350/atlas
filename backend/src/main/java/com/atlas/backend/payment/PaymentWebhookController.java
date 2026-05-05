package com.atlas.backend.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final FedaPayService  fedaPayService;
    private final PaydunyaService paydunyaService;

    @Value("${payment.fedapay.webhook-secret}")
    private String fedaPaySecret;

    @Value("${payment.paydunya.master-key}")
    private String paydunyaSecret;

    // POST /api/webhooks/payment/fedapay
    @PostMapping("/api/webhooks/payment/fedapay")
    public ResponseEntity<Void> fedapayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-FEDAPAY-SIGNATURE", required = false) String signature
    ) {
        log.info("[WEBHOOK] FedaPay recu signature='{}'", signature);

        if (signature != null && !fedaPayService.verifyWebhookSignature(payload, signature, fedaPaySecret)) {
            log.warn("[WEBHOOK] FedaPay signature invalide — requete ignoree");
            return ResponseEntity.status(401).build();
        }

        fedaPayService.handleWebhookEvent(payload);
        return ResponseEntity.ok().build();
    }

    // POST /api/webhooks/payment/paydunya
    @PostMapping("/api/webhooks/payment/paydunya")
    public ResponseEntity<Void> paydunyaWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-PAYDUNYA-SIGNATURE", required = false) String signature
    ) {
        log.info("[WEBHOOK] PayDunya recu signature='{}'", signature);

        if (signature != null && !paydunyaService.verifyWebhookSignature(payload, signature, paydunyaSecret)) {
            log.warn("[WEBHOOK] PayDunya signature invalide — requete ignoree");
            return ResponseEntity.status(401).build();
        }

        paydunyaService.handleWebhookEvent(payload);
        return ResponseEntity.ok().build();
    }
}
