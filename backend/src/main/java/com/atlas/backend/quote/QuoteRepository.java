package com.atlas.backend.quote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {

    // ─── Multi-tenant ─────────────────────────────────────────────────────────

    Page<Quote> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Quote> findByAgencyIdAndStatus(Long agencyId, Quote.QuoteStatus status, Pageable pageable);

    Optional<Quote> findByIdAndAgencyId(Long id, Long agencyId);

    Optional<Quote> findByAccessToken(String accessToken);

    Optional<Quote> findByQuoteNumber(String quoteNumber);

    boolean existsByIdAndAgencyId(Long id, Long agencyId);

    List<Quote> findByAgencyIdAndClientId(Long agencyId, Long clientId);

    // ─── Statistiques ─────────────────────────────────────────────────────────

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Quote.QuoteStatus status);

    @Query("SELECT COALESCE(SUM(q.totalAmount), 0) FROM Quote q WHERE q.agency.id = :agencyId AND q.status = 'ACCEPTED'")
    BigDecimal sumAcceptedAmountByAgency(@Param("agencyId") Long agencyId);

    // ─── Numérotation séquentielle ────────────────────────────────────────────

    @Query("SELECT COUNT(q) FROM Quote q WHERE q.agency.id = :agencyId AND YEAR(q.createdAt) = :year")
    long countByAgencyAndYear(@Param("agencyId") Long agencyId, @Param("year") int year);

    // ─── Devis expirés (scheduler) ────────────────────────────────────────────

    @Query("SELECT q FROM Quote q WHERE q.status IN ('SENT', 'VIEWED') AND q.validUntil < :today")
    List<Quote> findExpiredQuotes(@Param("today") LocalDate today);

    // ─── Analytics ────────────────────────────────────────────────────────────

    @Query("""
        SELECT COUNT(q) FROM Quote q
        WHERE q.agency.id = :agencyId
          AND q.status IN ('SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','INVOICED')
          AND q.sentAt >= :from
        """)
    long countSentSince(@Param("agencyId") Long agencyId, @Param("from") LocalDateTime from);

    @Query("""
        SELECT COUNT(q) FROM Quote q
        WHERE q.agency.id = :agencyId
          AND q.status = 'ACCEPTED'
          AND q.respondedAt >= :from
        """)
    long countAcceptedSince(@Param("agencyId") Long agencyId, @Param("from") LocalDateTime from);
}