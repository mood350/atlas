package com.atlas.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ─── Auth ─────────────────────────────────────────────────────────────────

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    // ─── Multi-tenant ─────────────────────────────────────────────────────────

    List<User> findByAgencyId(Long agencyId);

    Page<User> findByAgencyId(Long agencyId, Pageable pageable);

    Optional<User> findByIdAndAgencyId(Long id, Long agencyId);

    boolean existsByIdAndAgencyId(Long id, Long agencyId);

    long countByAgencyId(Long agencyId);

    // ─── Recherche membres ────────────────────────────────────────────────────

    @Query("""
        SELECT u FROM User u
        WHERE u.agency.id = :agencyId
          AND (
            LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(u.email)     LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """)
    List<User> searchByAgency(
            @Param("agencyId") Long agencyId,
            @Param("query")    String query
    );

    // ─── Sécurité ─────────────────────────────────────────────────────────────

    @Query("""
        SELECT u FROM User u
        WHERE u.accountLocked = true
          AND u.lockedAt < :threshold
        """)
    List<User> findLockedAccountsOlderThan(
            @Param("threshold") java.time.LocalDateTime threshold
    );
}