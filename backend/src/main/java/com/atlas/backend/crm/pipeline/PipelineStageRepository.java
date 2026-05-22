package com.atlas.backend.crm.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineStageRepository extends JpaRepository<PipelineStage, Long> {

    List<PipelineStage> findByPipelineIdOrderByPositionAsc(Long pipelineId);

    Optional<PipelineStage> findByIdAndPipelineId(Long id, Long pipelineId);

    /**
     * Charge une étape en garantissant qu'elle appartient bien à l'agence
     * (via pipeline → agency). Empêche un tenant de référencer l'étape
     * d'une autre agence lors de la création/déplacement d'un deal.
     */
    @Query("""
        SELECT s FROM PipelineStage s
        WHERE s.id = :id AND s.pipeline.agency.id = :agencyId
        """)
    Optional<PipelineStage> findByIdAndAgencyId(
            @Param("id")       Long id,
            @Param("agencyId") Long agencyId
    );

    Optional<PipelineStage> findByPipelineIdAndIsWonTrue(Long pipelineId);

    Optional<PipelineStage> findByPipelineIdAndIsLostTrue(Long pipelineId);

    int countByPipelineId(Long pipelineId);

    /**
     * Décale les positions de tous les stages >= startPosition
     * Utile lors de l'insertion d'une nouvelle étape entre deux existantes.
     */
    @Modifying
    @Query("""
        UPDATE PipelineStage s
        SET s.position = s.position + 1
        WHERE s.pipeline.id = :pipelineId
          AND s.position >= :startPosition
        """)
    void shiftPositionsFrom(
            @Param("pipelineId")     Long pipelineId,
            @Param("startPosition")  int startPosition
    );
}