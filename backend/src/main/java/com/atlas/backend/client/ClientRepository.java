package com.atlas.backend.client;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    // ─── Requêtes multi-tenant (filtrage par agence OBLIGATOIRE) ─────────────

    Page<Client> findAllByAgencyId(Long agencyId, Pageable pageable);

    Optional<Client> findByIdAndAgencyId(Long id, Long agencyId);

    List<Client> findByAgencyIdAndStatus(Long agencyId, Client.ClientStatus status);

    boolean existsByIdAndAgencyId(Long id, Long agencyId);

    // ─── Recherche textuelle ──────────────────────────────────────────────────

    @Query("""
        SELECT c FROM Client c
        WHERE c.agency.id = :agencyId
          AND (
            LOWER(c.name)             LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.email)            LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.contactFirstName) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.contactLastName)  LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.city)             LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY c.name ASC
        """)
    Page<Client> search(
            @Param("agencyId") Long agencyId,
            @Param("query")    String query,
            Pageable pageable
    );

    // ─── Statistiques dashboard ───────────────────────────────────────────────

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndStatus(Long agencyId, Client.ClientStatus status);

    @Query("""
        SELECT c.type, COUNT(c)
        FROM Client c
        WHERE c.agency.id = :agencyId
        GROUP BY c.type
        """)
    List<Object[]> countByTypeForAgency(@Param("agencyId") Long agencyId);
}