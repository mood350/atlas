package com.atlas.backend.appointment;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "appointment",
        indexes = {
                @Index(name = "idx_appt_agency",  columnList = "agency_id"),
                @Index(name = "idx_appt_member",  columnList = "member_id"),
                @Index(name = "idx_appt_client",  columnList = "client_id"),
                @Index(name = "idx_appt_start",   columnList = "start_time"),
                @Index(name = "idx_appt_token",   columnList = "access_token")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Appointment extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentType type = AppointmentType.DISCOVERY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Builder.Default
    private int durationMinutes = 60;

    private String timezone;

    private String location;

    @Column(name = "meeting_url")
    private String meetingUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MeetingProvider meetingProvider = MeetingProvider.GOOGLE_MEET;

    // ─── Infos invité (booking public sans authentification) ──────────────────
    private String guestName;
    private String guestEmail;
    private String guestPhone;

    @Column(columnDefinition = "TEXT")
    private String guestNotes;

    // ─── Token pour que l'invité gère son RDV ────────────────────────────────
    @Column(unique = true)
    private String accessToken;

    // ─── Rappels ─────────────────────────────────────────────────────────────
    @Builder.Default
    private boolean dayBeforeReminderSent = false;

    @Builder.Default
    private boolean hourBeforeReminderSent = false;

    // ─── Google Calendar ──────────────────────────────────────────────────────
    @Column(name = "google_calendar_event_id")
    private String googleCalendarEventId;

    // ─── Compte rendu post-réunion ────────────────────────────────────────────
    @Column(name = "meeting_notes", columnDefinition = "TEXT")
    private String meetingNotes;

    // ─── Enums ───────────────────────────────────────────────────────────────

    public enum AppointmentType {
        DISCOVERY, FOLLOW_UP, DELIVERY, SUPPORT
    }

    public enum AppointmentStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
    }

    public enum MeetingProvider {
        GOOGLE_MEET, ZOOM, IN_PERSON, PHONE
    }
}
