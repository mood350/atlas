package com.atlas.backend.crm.deal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {

    // ─── Requêtes multi-tenant ────────────────────────────────────────────────

    Page<Deal> findByAgencyIdAndStatus(Long agencyId, Deal.DealStatus status, Pageable pageable);

    Optional<Deal> findByIdAndAgencyId(Long id, Long agencyId);

    List<Deal> findByStageId(Long stageId);

    Page<Deal> findByAgencyIdAndClientId(Long agencyId, Long clientId, Pageable pageable);

    // ─── DÉTECTION D'INACTIVITÉ (utilisée par le job Redis) ──────────────────

    @Query("""
        SELECT d FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = com.atlas.backend.crm.deal.Deal.DealStatus.OPEN
          AND d.lastActivityAt < :threshold
          AND d.remindersSent < :maxReminders
        ORDER BY d.lastActivityAt ASC
        """)
    List<Deal> findInactiveDeals(
            @Param("agencyId")     Long agencyId,
            @Param("threshold")    LocalDateTime threshold,
            @Param("maxReminders") int maxReminders
    );

    @Query("""
        SELECT d FROM Deal d
        WHERE d.status = com.atlas.backend.crm.deal.Deal.DealStatus.OPEN
          AND d.lastActivityAt < :threshold
          AND d.remindersSent < :maxReminders
        """)
    List<Deal> findAllInactiveDeals(
            @Param("threshold")    LocalDateTime threshold,
            @Param("maxReminders") int maxReminders
    );

    // ─── Statistiques dashboard ───────────────────────────────────────────────

    long countByAgencyIdAndStatus(Long agencyId, Deal.DealStatus status);

    /** CA total des deals gagnés */
    @Query("""
        SELECT COALESCE(SUM(d.amount), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = com.atlas.backend.crm.deal.Deal.DealStatus.WON
        """)
    BigDecimal sumWonAmountByAgency(@Param("agencyId") Long agencyId);

    /** CA prévisionnel pondéré des deals ouverts */
    @Query("""
        SELECT COALESCE(SUM(d.weightedAmount), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = com.atlas.backend.crm.deal.Deal.DealStatus.OPEN
        """)
    BigDecimal sumWeightedAmountByAgency(@Param("agencyId") Long agencyId);

    /** Nombre de deals par étape (pour le Kanban) */
    @Query("""
        SELECT d.stage.id, COUNT(d), COALESCE(SUM(d.amount), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = com.atlas.backend.crm.deal.Deal.DealStatus.OPEN
        GROUP BY d.stage.id
        """)
    List<Object[]> countAndSumByStage(@Param("agencyId") Long agencyId);

    /** Taux de conversion = deals gagnés / (deals gagnés + deals perdus) */
    @Query("""
        SELECT
          COUNT(CASE WHEN d.status = com.atlas.backend.crm.deal.Deal.DealStatus.WON  THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN d.status IN (
              com.atlas.backend.crm.deal.Deal.DealStatus.WON,
              com.atlas.backend.crm.deal.Deal.DealStatus.LOST
          ) THEN 1 END), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
        """)
    Double conversionRate(@Param("agencyId") Long agencyId);

    /** Durée moyenne du cycle de vente en jours (deals gagnés uniquement) */
    @Query(value = """
        SELECT AVG(actual_close_date - DATE(created_at))
        FROM deal
        WHERE agency_id = :agencyId
          AND status = 'WON'
          AND actual_close_date IS NOT NULL
        """, nativeQuery = true)
    Double avgSalesCycleDays(@Param("agencyId") Long agencyId);
}