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
    /**
     * Retourne tous les deals OPEN dont lastActivityAt est avant le seuil
     * ET dont le nombre de rappels déjà envoyés est inférieur à maxReminders.
     *
     * Appelé toutes les heures par DealInactivityScheduler.
     */
    @Query("""
        SELECT d FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = 'OPEN'
          AND d.lastActivityAt < :threshold
          AND d.remindersSent < :maxReminders
        ORDER BY d.lastActivityAt ASC
        """)
    List<Deal> findInactiveDeals(
            @Param("agencyId")     Long agencyId,
            @Param("threshold")    LocalDateTime threshold,
            @Param("maxReminders") int maxReminders
    );

    /**
     * Version globale (tous tenants) — appelée par le scheduler global.
     * Le scheduler itère ensuite agence par agence.
     */
    @Query("""
        SELECT d FROM Deal d
        WHERE d.status = 'OPEN'
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
          AND d.status = 'WON'
        """)
    BigDecimal sumWonAmountByAgency(@Param("agencyId") Long agencyId);

    /** CA prévisionnel pondéré des deals ouverts */
    @Query("""
        SELECT COALESCE(SUM(d.weightedAmount), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = 'OPEN'
        """)
    BigDecimal sumWeightedAmountByAgency(@Param("agencyId") Long agencyId);

    /** Nombre de deals par étape (pour le Kanban) */
    @Query("""
        SELECT d.stage.id, COUNT(d), COALESCE(SUM(d.amount), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = 'OPEN'
        GROUP BY d.stage.id
        """)
    List<Object[]> countAndSumByStage(@Param("agencyId") Long agencyId);

    /** Taux de conversion = deals gagnés / (deals gagnés + deals perdus) */
    @Query("""
        SELECT
          COUNT(CASE WHEN d.status = 'WON'  THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN d.status IN ('WON','LOST') THEN 1 END), 0)
        FROM Deal d
        WHERE d.agency.id = :agencyId
        """)
    Double conversionRate(@Param("agencyId") Long agencyId);

    /** Durée moyenne du cycle de vente en jours (deals gagnés uniquement) */
    @Query("""
        SELECT AVG(DATEDIFF(d.actualCloseDate, d.createdDate))
        FROM Deal d
        WHERE d.agency.id = :agencyId
          AND d.status = 'WON'
          AND d.actualCloseDate IS NOT NULL
        """)
    Double avgSalesCycleDays(@Param("agencyId") Long agencyId);
}