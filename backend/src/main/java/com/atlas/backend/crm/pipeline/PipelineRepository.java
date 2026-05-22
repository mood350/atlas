package com.atlas.backend.crm.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {

    List<Pipeline> findByAgencyIdAndActiveTrue(Long agencyId);

    Optional<Pipeline> findByIdAndAgencyId(Long id, Long agencyId);

    Optional<Pipeline> findByAgencyIdAndIsDefaultTrue(Long agencyId);

    boolean existsByIdAndAgencyId(Long id, Long agencyId);

    // Récupère le pipeline avec ses stages en une requête (évite N+1)
    @Query("""
        SELECT p FROM Pipeline p
        LEFT JOIN FETCH p.stages s
        WHERE p.id = :id AND p.agency.id = :agencyId
        ORDER BY s.position ASC
        """)
    Optional<Pipeline> findWithStages(
            @Param("id")       Long id,
            @Param("agencyId") Long agencyId
    );

    // Récupère tous les pipelines actifs avec leurs stages (évite N+1 sur la liste)
    @Query("""
        SELECT DISTINCT p FROM Pipeline p
        LEFT JOIN FETCH p.stages s
        WHERE p.agency.id = :agencyId AND p.active = true
        ORDER BY p.id ASC
        """)
    List<Pipeline> findAllWithStages(@Param("agencyId") Long agencyId);
}