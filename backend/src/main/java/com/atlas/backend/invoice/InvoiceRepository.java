package com.atlas.backend.invoice;

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
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByIdAndAgencyId(Long id, Long agencyId);

    Page<Invoice> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Invoice> findByAgencyIdAndStatus(Long agencyId, Invoice.InvoiceStatus status, Pageable pageable);

    Optional<Invoice> findByAccessToken(String accessToken);

    @Query("SELECT i FROM Invoice i WHERE i.status IN ('SENT', 'PARTIALLY_PAID') AND i.dueDate < :today")
    List<Invoice> findOverdueInvoices(@Param("today") LocalDate today);

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Invoice.InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.agency.id = :agencyId AND i.status = 'PAID'")
    BigDecimal sumPaidAmountByAgency(@Param("agencyId") Long agencyId);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.agency.id = :agencyId AND YEAR(i.createdAt) = :year")
    long countByAgencyAndYear(@Param("agencyId") Long agencyId, @Param("year") int year);

    // ─── Analytics ────────────────────────────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(i.totalAmount), 0)
        FROM Invoice i
        WHERE i.agency.id = :agencyId AND i.status = 'PAID'
          AND YEAR(i.paidAt) = :year AND MONTH(i.paidAt) = :month
        """)
    BigDecimal sumPaidInMonth(@Param("agencyId") Long agencyId,
                              @Param("year") int year,
                              @Param("month") int month);

    @Query("""
        SELECT COALESCE(SUM(i.totalAmount), 0)
        FROM Invoice i
        WHERE i.agency.id = :agencyId AND i.status = 'PAID'
          AND i.paidAt >= :from AND i.paidAt <= :to
        """)
    BigDecimal sumPaidInPeriod(@Param("agencyId") Long agencyId,
                               @Param("from") LocalDateTime from,
                               @Param("to") LocalDateTime to);

    @Query("""
        SELECT COALESCE(SUM(i.totalAmount - i.paidAmount), 0)
        FROM Invoice i
        WHERE i.agency.id = :agencyId AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
        """)
    BigDecimal sumPendingAmount(@Param("agencyId") Long agencyId);

    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (paid_at - sent_at)) / 86400.0)
        FROM invoice
        WHERE agency_id = :agencyId AND status = 'PAID'
          AND paid_at IS NOT NULL AND sent_at IS NOT NULL
        """, nativeQuery = true)
    Double avgPaymentDelayDays(@Param("agencyId") Long agencyId);

    @Query("""
        SELECT YEAR(i.paidAt), MONTH(i.paidAt), SUM(i.totalAmount)
        FROM Invoice i
        WHERE i.agency.id = :agencyId AND i.status = 'PAID' AND i.paidAt >= :from
        GROUP BY YEAR(i.paidAt), MONTH(i.paidAt)
        ORDER BY YEAR(i.paidAt) ASC, MONTH(i.paidAt) ASC
        """)
    List<Object[]> revenueByMonth(@Param("agencyId") Long agencyId, @Param("from") LocalDateTime from);
}
