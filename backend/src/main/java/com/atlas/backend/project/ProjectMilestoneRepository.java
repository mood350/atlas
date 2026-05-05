package com.atlas.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, Long> {

    Optional<ProjectMilestone> findByIdAndProjectIdAndAgencyId(Long id, Long projectId, Long agencyId);

    List<ProjectMilestone> findByProjectIdOrderByDueDateAsc(Long projectId);

    @Query("SELECT m FROM ProjectMilestone m WHERE m.agency.id = :agencyId AND m.dueDate < :today AND m.status = 'PENDING'")
    List<ProjectMilestone> findOverdueMilestones(@Param("agencyId") Long agencyId, @Param("today") LocalDate today);
}
