package com.atlas.backend.appointment;

import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final UserRepository userRepository;

    @Value("${google.calendar.client-id:}")
    private String clientId;

    @Value("${google.calendar.client-secret:}")
    private String clientSecret;

    @Value("${google.calendar.redirect-uri:http://localhost:8081/api/calendar/oauth/callback}")
    private String redirectUri;

    private static final String TOKEN_URL     = "https://oauth2.googleapis.com/token";
    private static final String CALENDAR_URL  = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    // ─── OAuth2 ───────────────────────────────────────────────────────────────

    public String buildOAuthUrl(Long memberId) {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=https://www.googleapis.com/auth/calendar"
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + memberId;
    }

    @Transactional
    public void handleOAuthCallback(Long memberId, String code) {
        RestTemplate rt = new RestTemplate();
        Map<String, String> body = Map.of(
                "code", code,
                "client_id", clientId,
                "client_secret", clientSecret,
                "redirect_uri", redirectUri,
                "grant_type", "authorization_code"
        );
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = rt.postForObject(TOKEN_URL, body, Map.class);
        if (resp != null && resp.containsKey("refresh_token")) {
            userRepository.findById(memberId).ifPresent(user -> {
                user.setGoogleCalendarRefreshToken((String) resp.get("refresh_token"));
                userRepository.save(user);
                log.info("[GCAL] Token enregistré pour membre={}", memberId);
            });
        }
    }

    // ─── Synchronisation ──────────────────────────────────────────────────────

    public void createOrUpdateEvent(Appointment a) {
        User member = a.getMember();
        if (clientId.isBlank() || member.getGoogleCalendarRefreshToken() == null) {
            log.debug("[GCAL] Sync ignorée — pas de token pour membre={}", member.getId());
            return;
        }
        try {
            String accessToken = refreshAccessToken(member.getGoogleCalendarRefreshToken());
            if (a.getGoogleCalendarEventId() != null) {
                updateEvent(a, accessToken);
            } else {
                String eventId = createEvent(a, accessToken);
                a.setGoogleCalendarEventId(eventId);
            }
            log.info("[GCAL] Événement sync appointment={}", a.getId());
        } catch (Exception e) {
            log.warn("[GCAL] Échec sync appointment={}: {}", a.getId(), e.getMessage());
        }
    }

    public void deleteEvent(Appointment a) {
        if (a.getGoogleCalendarEventId() == null) return;
        User member = a.getMember();
        if (clientId.isBlank() || member.getGoogleCalendarRefreshToken() == null) return;
        try {
            String accessToken = refreshAccessToken(member.getGoogleCalendarRefreshToken());
            new RestTemplate().exchange(
                    CALENDAR_URL + "/" + a.getGoogleCalendarEventId(),
                    HttpMethod.DELETE,
                    new HttpEntity<>(authHeaders(accessToken)),
                    Void.class
            );
        } catch (Exception e) {
            log.warn("[GCAL] Échec suppression event={}: {}", a.getGoogleCalendarEventId(), e.getMessage());
        }
    }

    // ─── Privé ───────────────────────────────────────────────────────────────

    private String createEvent(Appointment a, String accessToken) {
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = new RestTemplate().exchange(
                CALENDAR_URL,
                HttpMethod.POST,
                new HttpEntity<>(eventPayload(a), authHeaders(accessToken)),
                Map.class
        ).getBody();
        return resp != null ? (String) resp.get("id") : null;
    }

    private void updateEvent(Appointment a, String accessToken) {
        new RestTemplate().exchange(
                CALENDAR_URL + "/" + a.getGoogleCalendarEventId(),
                HttpMethod.PUT,
                new HttpEntity<>(eventPayload(a), authHeaders(accessToken)),
                Void.class
        );
    }

    private String refreshAccessToken(String refreshToken) {
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = new RestTemplate().postForObject(
                TOKEN_URL,
                Map.of(
                        "refresh_token", refreshToken,
                        "client_id", clientId,
                        "client_secret", clientSecret,
                        "grant_type", "refresh_token"
                ),
                Map.class
        );
        if (resp == null || !resp.containsKey("access_token")) {
            throw new IllegalStateException("Impossible de rafraîchir le token Google Calendar");
        }
        return (String) resp.get("access_token");
    }

    private Map<String, Object> eventPayload(Appointment a) {
        String tz = a.getTimezone() != null ? a.getTimezone() : "UTC";
        ZoneId zone = ZoneId.of(tz);
        String startDt = a.getStartTime().atZone(zone).toOffsetDateTime().toString();
        String endDt   = a.getEndTime().atZone(zone).toOffsetDateTime().toString();

        return Map.of(
                "summary",     a.getTitle() != null ? a.getTitle() : "Rendez-vous",
                "description", a.getDescription() != null ? a.getDescription() : "",
                "location",    a.getLocation() != null ? a.getLocation() : "",
                "start",       Map.of("dateTime", startDt, "timeZone", tz),
                "end",         Map.of("dateTime", endDt,   "timeZone", tz),
                "conferenceData", a.getMeetingUrl() != null
                        ? Map.of("entryPoints", List.of(
                                Map.of("entryPointType", "video", "uri", a.getMeetingUrl())))
                        : Map.of()
        );
    }

    private HttpHeaders authHeaders(String accessToken) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(accessToken);
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }
}
