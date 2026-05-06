package com.atlas.backend.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByIdAndAgencyId(Long id, Long agencyId);

    Page<Appointment> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Appointment> findByAgencyIdAndMemberId(Long agencyId, Long memberId, Pageable pageable);

    Page<Appointment> findByAgencyIdAndStatus(Long agencyId, Appointment.AppointmentStatus status, Pageable pageable);

    Optional<Appointment> findByAccessToken(String accessToken);

    // ─── Vérification de disponibilité ───────────────────────────────────────

    @Query("""
        SELECT COUNT(a) FROM Appointment a
        WHERE a.member.id = :memberId
          AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
          AND a.startTime < :endTime
          AND a.endTime > :startTime
        """)
    long countConflicts(@Param("memberId") Long memberId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);

    // ─── Rappels (scheduler horaire) ─────────────────────────────────────────

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.status = 'CONFIRMED'
          AND a.startTime BETWEEN :from AND :to
          AND a.dayBeforeReminderSent = false
        """)
    List<Appointment> findDayBeforeReminders(@Param("from") LocalDateTime from,
                                             @Param("to") LocalDateTime to);

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.status = 'CONFIRMED'
          AND a.startTime BETWEEN :from AND :to
          AND a.hourBeforeReminderSent = false
        """)
    List<Appointment> findHourBeforeReminders(@Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    // ─── Statistiques ────────────────────────────────────────────────────────

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Appointment.AppointmentStatus status);

    @Query("""
        SELECT COUNT(a) FROM Appointment a
        WHERE a.agency.id = :agencyId
          AND a.startTime BETWEEN :from AND :to
        """)
    long countUpcomingInRange(@Param("agencyId") Long agencyId,
                              @Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to);
}
