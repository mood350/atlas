package com.atlas.backend.invoice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
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
}
