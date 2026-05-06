package com.atlas.backend.appointment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AppointmentDto {

    // ─── Page de booking publique ──────────────────────────────────────────────

    public record PublicBookingPage(
            Long   memberId,
            String memberName,
            String memberAvatarUrl,
            String agencyName,
            String timezone,
            int    durationMinutes,
            List<String> availableDays
    ) {}

    public record AvailableSlot(LocalDateTime start, LocalDateTime end) {}

    // ─── Booking public (sans authentification) ────────────────────────────────

    public record BookingRequest(
            @NotNull  LocalDateTime startTime,
            @NotBlank String guestName,
            @NotBlank @Email String guestEmail,
            String guestPhone,
            Appointment.AppointmentType type,
            String guestNotes
    ) {}

    // ─── Création côté agence (authentifié) ───────────────────────────────────

    public record Request(
            @NotNull  Long memberId,
            Long clientId,
            @NotBlank String title,
            String description,
            @NotNull  Appointment.AppointmentType type,
            @NotNull  Appointment.MeetingProvider meetingProvider,
            @NotNull  LocalDateTime startTime,
            @NotNull  LocalDateTime endTime,
            String location,
            String guestName,
            @Email String guestEmail,
            String guestPhone
    ) {}

    // ─── Réponse complète ─────────────────────────────────────────────────────

    public record Response(
            Long id,
            Long agencyId,
            Long memberId,
            String memberName,
            Long clientId,
            String clientOrGuestName,
            String title,
            String description,
            Appointment.AppointmentType type,
            Appointment.AppointmentStatus status,
            Appointment.MeetingProvider meetingProvider,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int durationMinutes,
            String timezone,
            String location,
            String meetingUrl,
            String guestName,
            String guestEmail,
            String accessToken,
            String googleCalendarEventId,
            String meetingNotes,
            LocalDateTime createdAt
    ) {}

    // ─── Résumé (liste paginée) ────────────────────────────────────────────────

    public record Summary(
            Long id,
            String title,
            Appointment.AppointmentType type,
            Appointment.AppointmentStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String memberName,
            String clientOrGuestName,
            String meetingUrl
    ) {}

    // ─── Disponibilités ───────────────────────────────────────────────────────

    public record AvailabilityRequest(
            @NotNull DayOfWeek  dayOfWeek,
            @NotNull LocalTime  startTime,
            @NotNull LocalTime  endTime,
            int durationMinutes
    ) {}

    public record AvailabilityResponse(
            Long      id,
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            int       durationMinutes,
            boolean   active
    ) {}

    // ─── Statistiques ─────────────────────────────────────────────────────────

    public record Stats(
            long total,
            long pending,
            long confirmed,
            long completed,
            long cancelled,
            long noShow,
            long upcomingThisWeek
    ) {}

    // ─── Compte rendu ─────────────────────────────────────────────────────────

    public record MeetingNotesRequest(@NotBlank String notes) {}

    // ─── Slots disponibles (date) ─────────────────────────────────────────────

    public record SlotsQuery(@NotNull LocalDate date) {}
}
