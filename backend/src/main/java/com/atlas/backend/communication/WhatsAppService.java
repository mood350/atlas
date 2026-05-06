package com.atlas.backend.communication;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class WhatsAppService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.whatsapp-number:}")
    private String fromNumber;

    /**
     * Envoie un message WhatsApp via l'API Twilio (sandbox ou production).
     * Le numéro {@code to} doit être au format E.164 (+2250XXXXXXXXX).
     *
     * @return SID Twilio, ou null si non configuré
     */
    public String send(String to, String body) {
        if (accountSid.isBlank() || authToken.isBlank()) {
            log.warn("[WHATSAPP] Twilio non configuré — message ignoré vers {}", to);
            return null;
        }
        try {
            String whatsappTo   = to.startsWith("whatsapp:") ? to : "whatsapp:" + to;
            String whatsappFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : "whatsapp:" + fromNumber;

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("To",   whatsappTo);
            params.add("From", whatsappFrom);
            params.add("Body", body);

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(accountSid, authToken);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = new RestTemplate().exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    Map.class
            ).getBody();

            String sid = resp != null ? (String) resp.get("sid") : null;
            log.info("[WHATSAPP] Envoyé à {} — SID={}", to, sid);
            return sid;
        } catch (Exception e) {
            log.error("[WHATSAPP] Échec envoi à {}: {}", to, e.getMessage());
            throw new RuntimeException("Erreur envoi WhatsApp: " + e.getMessage(), e);
        }
    }
}
