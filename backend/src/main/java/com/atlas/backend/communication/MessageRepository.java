package com.atlas.backend.communication;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // ─── Histoires par contexte ───────────────────────────────────────────────

    Page<Message> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Message> findByAgencyIdAndClientId(Long agencyId, Long clientId, Pageable pageable);

    Page<Message> findByAgencyIdAndProjectId(Long agencyId, Long projectId, Pageable pageable);

    Page<Message> findByAgencyIdAndDealId(Long agencyId, Long dealId, Pageable pageable);

    Page<Message> findByAgencyIdAndChannel(Long agencyId, Message.MessageChannel channel, Pageable pageable);

    Optional<Message> findByExternalId(String externalId);

    // ─── Statistiques ────────────────────────────────────────────────────────

    long countByAgencyId(Long agencyId);

    long countByAgencyIdAndDirection(Long agencyId, Message.MessageDirection direction);

    long countByAgencyIdAndStatus(Long agencyId, Message.MessageStatus status);

    @Query("""
        SELECT m.channel, COUNT(m)
        FROM Message m
        WHERE m.agency.id = :agencyId
        GROUP BY m.channel
        """)
    List<Object[]> countByChannelForAgency(@Param("agencyId") Long agencyId);
}
