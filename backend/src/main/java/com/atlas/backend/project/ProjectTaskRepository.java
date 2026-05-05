package com.atlas.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    Optional<ProjectTask> findByIdAndProjectIdAndAgencyId(Long id, Long projectId, Long agencyId);

    List<ProjectTask> findByProjectIdOrderByPositionAsc(Long projectId);

    List<ProjectTask> findByAgencyIdAndAssignedToId(Long agencyId, Long userId);

    @Query("SELECT t FROM ProjectTask t WHERE t.agency.id = :agencyId AND t.dueDate < :today AND t.status != 'DONE'")
    List<ProjectTask> findOverdueTasks(@Param("agencyId") Long agencyId, @Param("today") LocalDate today);

    long countByProjectIdAndStatus(Long projectId, ProjectTask.TaskStatus status);

    long countByProjectId(Long projectId);
}
