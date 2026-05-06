package com.atlas.backend.appointment;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository      appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AgencyRepository           agencyRepository;
    private final UserRepository             userRepository;
    private final ClientRepository           clientRepository;
    private final EmailService               emailService;
    private final GoogleCalendarService      googleCalendarService;

    @Value("${application.mail.from}")
    private String mailFrom;

    // ════════════════════════════════════════════════════════════════
    //  PAGE DE BOOKING PUBLIQUE
    // ════════════════════════════════════════════════════════════════

    public AppointmentDto.PublicBookingPage getPublicBookingPage(Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        List<AvailabilitySlot> slots = member.getAgency() != null
                ? availabilitySlotRepository.findByMemberIdAndAgencyIdAndActiveTrue(memberId, member.getAgency().getId())
                : List.of();

        List<String> days = slots.stream()
                .map(s -> s.getDayOfWeek().name())
                .distinct()
                .sorted()
                .toList();

        int duration = slots.isEmpty() ? 60 : slots.get(0).getDurationMinutes();

        return new AppointmentDto.PublicBookingPage(
                member.getId(),
                member.fullName(),
                member.getAvatarUrl(),
                member.getAgency() != null ? member.getAgency().getName() : "",
                member.getTimezone(),
                duration,
                days
        );
    }

    public List<AppointmentDto.AvailableSlot> getAvailableSlots(Long memberId, LocalDate date) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        DayOfWeek dow = date.getDayOfWeek();
        List<AvailabilitySlot> daySlots =
                availabilitySlotRepository.findByMemberIdAndDayOfWeekAndActiveTrue(memberId, dow);

        List<AppointmentDto.AvailableSlot> available = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (AvailabilitySlot slot : daySlots) {
            LocalDateTime cursor  = LocalDateTime.of(date, slot.getStartTime());
            LocalDateTime slotEnd = LocalDateTime.of(date, slot.getEndTime());
            int           step    = slot.getDurationMinutes();

            while (!cursor.plusMinutes(step).isAfter(slotEnd)) {
                LocalDateTime end = cursor.plusMinutes(step);
                if (cursor.isAfter(now)) {
                    boolean conflict = appointmentRepository.countConflicts(memberId, cursor, end) > 0;
                    if (!conflict) {
                        available.add(new AppointmentDto.AvailableSlot(cursor, end));
                    }
                }
                cursor = cursor.plusMinutes(step);
            }
        }
        return available;
    }

    // ════════════════════════════════════════════════════════════════
    //  BOOKING PUBLIC
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public AppointmentDto.Response bookPublicly(Long memberId, AppointmentDto.BookingRequest req) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        int slotDuration = defaultDuration(memberId);
        LocalDateTime endTime = req.startTime().plusMinutes(slotDuration);

        if (appointmentRepository.countConflicts(memberId, req.startTime(), endTime) > 0) {
            throw new IllegalStateException("Ce créneau n'est plus disponible");
        }

        Appointment a = Appointment.builder()
                .agency(member.getAgency())
                .member(member)
                .title((req.type() != null ? req.type().name() : "RDV") + " — " + req.guestName())
                .type(req.type() != null ? req.type() : Appointment.AppointmentType.DISCOVERY)
                .status(Appointment.AppointmentStatus.PENDING)
                .startTime(req.startTime())
                .endTime(endTime)
                .durationMinutes(slotDuration)
                .timezone(member.getTimezone())
                .meetingProvider(Appointment.MeetingProvider.GOOGLE_MEET)
                .guestName(req.guestName())
                .guestEmail(req.guestEmail())
                .guestPhone(req.guestPhone())
                .guestNotes(req.guestNotes())
                .accessToken(UUID.randomUUID().toString())
                .build();

        a = appointmentRepository.save(a);
        notifyGuest(a, "confirmation");
        notifyMemberNewBooking(a);

        log.info("[BOOKING] Nouveau RDV public agence={} member={} guest='{}' at={}",
                member.getAgency() != null ? member.getAgency().getId() : "?",
                memberId, req.guestName(), req.startTime());

        return toResponse(a);
    }

    // ════════════════════════════════════════════════════════════════
    //  CRUD CÔTÉ AGENCE
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public AppointmentDto.Response create(Long agencyId, AppointmentDto.Request dto, User currentUser) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        User member = userRepository.findById(dto.memberId())
                .filter(u -> u.getAgency() != null && u.getAgency().getId().equals(agencyId))
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable dans cette agence"));

        Client client = null;
        if (dto.clientId() != null) {
            client = clientRepository.findByIdAndAgencyId(dto.clientId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));
        }

        if (appointmentRepository.countConflicts(member.getId(), dto.startTime(), dto.endTime()) > 0) {
            throw new IllegalStateException("Conflit de créneau pour ce membre");
        }

        Appointment a = Appointment.builder()
                .agency(agency)
                .member(member)
                .client(client)
                .title(dto.title())
                .description(dto.description())
                .type(dto.type())
                .status(Appointment.AppointmentStatus.CONFIRMED)
                .meetingProvider(dto.meetingProvider())
                .startTime(dto.startTime())
                .endTime(dto.endTime())
                .durationMinutes((int) java.time.Duration.between(dto.startTime(), dto.endTime()).toMinutes())
                .timezone(member.getTimezone())
                .location(dto.location())
                .guestName(dto.guestName())
                .guestEmail(dto.guestEmail())
                .guestPhone(dto.guestPhone())
                .meetingUrl(generateMeetingUrl(dto.meetingProvider()))
                .accessToken(UUID.randomUUID().toString())
                .build();

        a = appointmentRepository.save(a);
        googleCalendarService.createOrUpdateEvent(a);

        log.info("[APPOINTMENT] Créé agence={} member={} at={}", agencyId, member.getId(), dto.startTime());
        return toResponse(a);
    }

    public Page<AppointmentDto.Summary> findAll(Long agencyId,
                                                Appointment.AppointmentStatus status,
                                                Pageable pageable) {
        Page<Appointment> page = status != null
                ? appointmentRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                : appointmentRepository.findByAgencyId(agencyId, pageable);
        return page.map(this::toSummary);
    }

    public AppointmentDto.Response findById(Long agencyId, Long id) {
        return toResponse(getOrThrow(agencyId, id));
    }

    @Transactional
    public AppointmentDto.Response confirm(Long agencyId, Long id) {
        Appointment a = getOrThrow(agencyId, id);
        a.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        if (a.getMeetingUrl() == null) {
            a.setMeetingUrl(generateMeetingUrl(a.getMeetingProvider()));
        }
        appointmentRepository.save(a);
        googleCalendarService.createOrUpdateEvent(a);
        notifyGuest(a, "confirmation");
        return toResponse(a);
    }

    @Transactional
    public AppointmentDto.Response cancel(Long agencyId, Long id, String reason) {
        Appointment a = getOrThrow(agencyId, id);
        a.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(a);
        notifyGuest(a, "cancellation");
        googleCalendarService.deleteEvent(a);
        return toResponse(a);
    }

    @Transactional
    public AppointmentDto.Response complete(Long agencyId, Long id) {
        Appointment a = getOrThrow(agencyId, id);
        a.setStatus(Appointment.AppointmentStatus.COMPLETED);
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentDto.Response addMeetingNotes(Long agencyId, Long id, String notes) {
        Appointment a = getOrThrow(agencyId, id);
        a.setMeetingNotes(notes);
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional
    public void delete(Long agencyId, Long id) {
        Appointment a = getOrThrow(agencyId, id);
        googleCalendarService.deleteEvent(a);
        appointmentRepository.delete(a);
    }

    // ════════════════════════════════════════════════════════════════
    //  DISPONIBILITÉS
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public List<AppointmentDto.AvailabilityResponse> setAvailability(
            Long agencyId, Long memberId, List<AppointmentDto.AvailabilityRequest> dtos) {

        User member = userRepository.findById(memberId)
                .filter(u -> u.getAgency() != null && u.getAgency().getId().equals(agencyId))
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        Agency agency = member.getAgency();
        availabilitySlotRepository.deleteByMemberIdAndAgencyId(memberId, agencyId);

        List<AvailabilitySlot> saved = availabilitySlotRepository.saveAll(
                dtos.stream()
                        .map(dto -> AvailabilitySlot.builder()
                                .member(member)
                                .agency(agency)
                                .dayOfWeek(dto.dayOfWeek())
                                .startTime(dto.startTime())
                                .endTime(dto.endTime())
                                .durationMinutes(dto.durationMinutes() > 0 ? dto.durationMinutes() : 60)
                                .active(true)
                                .build())
                        .toList()
        );

        return saved.stream().map(this::toAvailabilityResponse).toList();
    }

    public List<AppointmentDto.AvailabilityResponse> getAvailability(Long agencyId, Long memberId) {
        return availabilitySlotRepository
                .findByMemberIdAndAgencyIdAndActiveTrue(memberId, agencyId)
                .stream()
                .map(this::toAvailabilityResponse)
                .toList();
    }

    // ════════════════════════════════════════════════════════════════
    //  STATISTIQUES
    // ════════════════════════════════════════════════════════════════

    public AppointmentDto.Stats getStats(Long agencyId) {
        LocalDateTime now = LocalDateTime.now();
        return new AppointmentDto.Stats(
                appointmentRepository.countByAgencyId(agencyId),
                appointmentRepository.countByAgencyIdAndStatus(agencyId, Appointment.AppointmentStatus.PENDING),
                appointmentRepository.countByAgencyIdAndStatus(agencyId, Appointment.AppointmentStatus.CONFIRMED),
                appointmentRepository.countByAgencyIdAndStatus(agencyId, Appointment.AppointmentStatus.COMPLETED),
                appointmentRepository.countByAgencyIdAndStatus(agencyId, Appointment.AppointmentStatus.CANCELLED),
                appointmentRepository.countByAgencyIdAndStatus(agencyId, Appointment.AppointmentStatus.NO_SHOW),
                appointmentRepository.countUpcomingInRange(agencyId, now, now.plusDays(7))
        );
    }

    // ════════════════════════════════════════════════════════════════
    //  SCHEDULER DE RAPPELS (toutes les heures)
    // ════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();

        // J-1 : startTime dans la fenêtre [now+23h, now+25h]
        List<Appointment> dayBefore =
                appointmentRepository.findDayBeforeReminders(now.plusHours(23), now.plusHours(25));
        for (Appointment a : dayBefore) {
            notifyGuest(a, "reminder_day");
            a.setDayBeforeReminderSent(true);
            appointmentRepository.save(a);
            log.info("[REMINDER J-1] appointment={}", a.getId());
        }

        // H-1 : startTime dans la fenêtre [now+45min, now+75min]
        List<Appointment> hourBefore =
                appointmentRepository.findHourBeforeReminders(now.plusMinutes(45), now.plusMinutes(75));
        for (Appointment a : hourBefore) {
            notifyGuest(a, "reminder_hour");
            a.setHourBeforeReminderSent(true);
            appointmentRepository.save(a);
            log.info("[REMINDER H-1] appointment={}", a.getId());
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  PRIVÉ — EMAILS
    // ════════════════════════════════════════════════════════════════

    private void notifyGuest(Appointment a, String type) {
        if (a.getGuestEmail() == null) return;
        try {
            EmailTemplateName template = switch (type) {
                case "confirmation"  -> EmailTemplateName.APPOINTMENT_CONFIRMATION;
                case "cancellation"  -> EmailTemplateName.APPOINTMENT_CANCELLED;
                case "reminder_day"  -> EmailTemplateName.APPOINTMENT_REMINDER;
                case "reminder_hour" -> EmailTemplateName.APPOINTMENT_REMINDER;
                default              -> EmailTemplateName.APPOINTMENT_CONFIRMATION;
            };
            String subject = switch (type) {
                case "confirmation"  -> "Confirmation de votre rendez-vous";
                case "cancellation"  -> "Votre rendez-vous a été annulé";
                case "reminder_day"  -> "Rappel : votre rendez-vous demain";
                case "reminder_hour" -> "Rappel : votre rendez-vous dans 1h";
                default              -> "Votre rendez-vous";
            };
            emailService.sendEmail(
                    a.getGuestEmail(), subject, template,
                    Map.of(
                            "guestName",   a.getGuestName(),
                            "memberName",  a.getMember().fullName(),
                            "startTime",   a.getStartTime().toString(),
                            "meetingUrl",  a.getMeetingUrl() != null ? a.getMeetingUrl() : "",
                            "accessToken", a.getAccessToken()
                    ),
                    mailFrom
            );
        } catch (Exception e) {
            log.warn("[EMAIL] Échec notification type={} guest={}: {}", type, a.getGuestEmail(), e.getMessage());
        }
    }

    private void notifyMemberNewBooking(Appointment a) {
        if (!a.getMember().isEmailNotificationsEnabled()) return;
        try {
            emailService.sendEmail(
                    a.getMember().getEmail(),
                    "Nouveau rendez-vous reçu",
                    EmailTemplateName.APPOINTMENT_NEW_BOOKING,
                    Map.of(
                            "memberName", a.getMember().fullName(),
                            "guestName",  a.getGuestName(),
                            "guestEmail", a.getGuestEmail(),
                            "startTime",  a.getStartTime().toString(),
                            "type",       a.getType().name()
                    ),
                    mailFrom
            );
        } catch (Exception e) {
            log.warn("[EMAIL] Échec notif membre={}: {}", a.getMember().getEmail(), e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  PRIVÉ — UTILITAIRES
    // ════════════════════════════════════════════════════════════════

    private String generateMeetingUrl(Appointment.MeetingProvider provider) {
        if (provider == Appointment.MeetingProvider.GOOGLE_MEET) {
            String code = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            return "https://meet.google.com/" + code.substring(0, 3)
                    + "-" + code.substring(3, 7)
                    + "-" + code.substring(7);
        }
        return null;
    }

    private int defaultDuration(Long memberId) {
        return availabilitySlotRepository
                .findByMemberIdAndDayOfWeekAndActiveTrue(memberId, LocalDate.now().getDayOfWeek())
                .stream()
                .findFirst()
                .map(AvailabilitySlot::getDurationMinutes)
                .orElse(60);
    }

    private Appointment getOrThrow(Long agencyId, Long id) {
        return appointmentRepository.findByIdAndAgencyId(id, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous introuvable"));
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private AppointmentDto.Response toResponse(Appointment a) {
        String name = a.getClient() != null ? a.getClient().getName() : a.getGuestName();
        return new AppointmentDto.Response(
                a.getId(),
                a.getAgency().getId(),
                a.getMember().getId(),
                a.getMember().fullName(),
                a.getClient() != null ? a.getClient().getId() : null,
                name,
                a.getTitle(),
                a.getDescription(),
                a.getType(),
                a.getStatus(),
                a.getMeetingProvider(),
                a.getStartTime(),
                a.getEndTime(),
                a.getDurationMinutes(),
                a.getTimezone(),
                a.getLocation(),
                a.getMeetingUrl(),
                a.getGuestName(),
                a.getGuestEmail(),
                a.getAccessToken(),
                a.getGoogleCalendarEventId(),
                a.getMeetingNotes(),
                a.getCreatedAt()
        );
    }

    private AppointmentDto.Summary toSummary(Appointment a) {
        String name = a.getClient() != null ? a.getClient().getName() : a.getGuestName();
        return new AppointmentDto.Summary(
                a.getId(),
                a.getTitle(),
                a.getType(),
                a.getStatus(),
                a.getStartTime(),
                a.getEndTime(),
                a.getMember().fullName(),
                name,
                a.getMeetingUrl()
        );
    }

    private AppointmentDto.AvailabilityResponse toAvailabilityResponse(AvailabilitySlot s) {
        return new AppointmentDto.AvailabilityResponse(
                s.getId(),
                s.getDayOfWeek(),
                s.getStartTime(),
                s.getEndTime(),
                s.getDurationMinutes(),
                s.isActive()
        );
    }
}
