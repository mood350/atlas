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
public class SmsService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String fromNumber;

    /**
     * Envoie un SMS via l'API REST Twilio.
     *
     * @return SID Twilio du message, ou null si non configuré
     */
    public String send(String to, String body) {
        if (accountSid.isBlank() || authToken.isBlank()) {
            log.warn("[SMS] Twilio non configuré — SMS ignoré vers {}", to);
            return null;
        }
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("To",   to);
            params.add("From", fromNumber);
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
            log.info("[SMS] Envoyé à {} — SID={}", to, sid);
            return sid;
        } catch (Exception e) {
            log.error("[SMS] Échec envoi à {}: {}", to, e.getMessage());
            throw new RuntimeException("Erreur envoi SMS: " + e.getMessage(), e);
        }
    }
}
