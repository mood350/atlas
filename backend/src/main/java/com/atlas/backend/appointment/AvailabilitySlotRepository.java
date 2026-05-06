package com.atlas.backend.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {

    List<AvailabilitySlot> findByMemberIdAndAgencyIdAndActiveTrue(Long memberId, Long agencyId);

    List<AvailabilitySlot> findByMemberIdAndDayOfWeekAndActiveTrue(Long memberId, DayOfWeek dayOfWeek);

    Optional<AvailabilitySlot> findByIdAndAgencyId(Long id, Long agencyId);

    void deleteByMemberIdAndAgencyId(Long memberId, Long agencyId);
}
