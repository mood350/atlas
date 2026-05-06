package com.atlas.backend.appointment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.atlas.backend.user.User;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService    appointmentService;
    private final GoogleCalendarService googleCalendarService;

    // ════════════════════════════════════════════════════════════════
    //  PUBLIC — Page de booking /api/booking/**
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/booking/member/{memberId}")
    public ResponseEntity<AppointmentDto.PublicBookingPage> getBookingPage(
            @PathVariable Long memberId) {
        return ResponseEntity.ok(appointmentService.getPublicBookingPage(memberId));
    }

    @GetMapping("/api/booking/member/{memberId}/slots")
    public ResponseEntity<List<AppointmentDto.AvailableSlot>> getAvailableSlots(
            @PathVariable Long memberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(memberId, date));
    }

    @PostMapping("/api/booking/member/{memberId}")
    public ResponseEntity<AppointmentDto.Response> bookPublicly(
            @PathVariable Long memberId,
            @Valid @RequestBody AppointmentDto.BookingRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.bookPublicly(memberId, dto));
    }

    // ════════════════════════════════════════════════════════════════
    //  AGENCE — Gestion des rendez-vous
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/appointments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody AppointmentDto.Request dto,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.create(agencyId, dto, currentUser));
    }

    @GetMapping("/api/agencies/{agencyId}/appointments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<AppointmentDto.Summary>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(required = false) Appointment.AppointmentStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        return ResponseEntity.ok(appointmentService.findAll(agencyId, status, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/appointments/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Stats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(appointmentService.getStats(agencyId));
    }

    @GetMapping("/api/agencies/{agencyId}/appointments/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.findById(agencyId, id));
    }

    @PostMapping("/api/agencies/{agencyId}/appointments/{id}/confirm")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> confirm(
            @PathVariable Long agencyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.confirm(agencyId, id));
    }

    @PostMapping("/api/agencies/{agencyId}/appointments/{id}/cancel")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> cancel(
            @PathVariable Long agencyId,
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(appointmentService.cancel(agencyId, id, reason));
    }

    @PostMapping("/api/agencies/{agencyId}/appointments/{id}/complete")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> complete(
            @PathVariable Long agencyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.complete(agencyId, id));
    }

    @PatchMapping("/api/agencies/{agencyId}/appointments/{id}/notes")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<AppointmentDto.Response> addNotes(
            @PathVariable Long agencyId,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentDto.MeetingNotesRequest dto) {
        return ResponseEntity.ok(appointmentService.addMeetingNotes(agencyId, id, dto.notes()));
    }

    @DeleteMapping("/api/agencies/{agencyId}/appointments/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long id) {
        appointmentService.delete(agencyId, id);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════════════
    //  DISPONIBILITÉS
    // ════════════════════════════════════════════════════════════════

    @PutMapping("/api/agencies/{agencyId}/members/{memberId}/availability")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<List<AppointmentDto.AvailabilityResponse>> setAvailability(
            @PathVariable Long agencyId,
            @PathVariable Long memberId,
            @Valid @RequestBody List<AppointmentDto.AvailabilityRequest> dto) {
        return ResponseEntity.ok(appointmentService.setAvailability(agencyId, memberId, dto));
    }

    @GetMapping("/api/agencies/{agencyId}/members/{memberId}/availability")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<List<AppointmentDto.AvailabilityResponse>> getAvailability(
            @PathVariable Long agencyId,
            @PathVariable Long memberId) {
        return ResponseEntity.ok(appointmentService.getAvailability(agencyId, memberId));
    }

    // ════════════════════════════════════════════════════════════════
    //  GOOGLE CALENDAR — OAuth2
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/agencies/{agencyId}/calendar/oauth/connect")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<String> connectGoogleCalendar(
            @PathVariable Long agencyId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(googleCalendarService.buildOAuthUrl(currentUser.getId()));
    }

    /** Callback public — Google redirige ici après autorisation OAuth2 */
    @GetMapping("/api/calendar/oauth/callback")
    public ResponseEntity<String> oauthCallback(
            @RequestParam String code,
            @RequestParam String state) {
        googleCalendarService.handleOAuthCallback(Long.parseLong(state), code);
        return ResponseEntity.ok("Google Calendar connecté avec succès.");
    }
}
