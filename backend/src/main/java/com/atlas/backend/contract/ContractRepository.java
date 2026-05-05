package com.atlas.backend.contract;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Optional<Contract> findByIdAndAgencyId(Long id, Long agencyId);

    Optional<Contract> findByAccessToken(String token);

    Optional<Contract> findByQuoteId(Long quoteId);

    @Query("SELECT COUNT(c) FROM Contract c WHERE c.agency.id = :agencyId AND YEAR(c.createdAt) = :year")
    long countByAgencyAndYear(@Param("agencyId") Long agencyId, @Param("year") int year);

    Page<Contract> findByAgencyIdAndStatus(Long agencyId, Contract.ContractStatus status, Pageable pageable);

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Contract.ContractStatus status);
}
