package com.atlas.backend.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByIdAndAgencyId(Long id, Long agencyId);

    Page<Project> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Project> findByAgencyIdAndStatus(Long agencyId, Project.ProjectStatus status, Pageable pageable);

    Page<Project> findByAgencyIdAndClientId(Long agencyId, Long clientId, Pageable pageable);

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Project.ProjectStatus status);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.agency.id = :agencyId AND YEAR(p.createdAt) = :year")
    long countByAgencyAndYear(@Param("agencyId") Long agencyId, @Param("year") int year);

    @Query("SELECT p FROM Project p WHERE p.agency.id = :agencyId AND p.deadline < :today AND p.status NOT IN ('DONE', 'CANCELLED')")
    List<Project> findOverdueProjects(@Param("agencyId") Long agencyId, @Param("today") LocalDate today);

    @Query("SELECT p FROM Project p WHERE p.agency.id = :agencyId AND p.deadline BETWEEN :today AND :soon AND p.status NOT IN ('DONE', 'CANCELLED')")
    List<Project> findProjectsDeadlineSoon(@Param("agencyId") Long agencyId,
                                           @Param("today") LocalDate today,
                                           @Param("soon") LocalDate soon);
}
