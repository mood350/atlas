package com.atlas.backend.quote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, Long> {

    List<QuoteItem> findByQuoteIdOrderByPositionAsc(Long quoteId);

    void deleteByQuoteId(Long quoteId);

    @Modifying
    @Query("""
        UPDATE QuoteItem i
        SET i.position = i.position + 1
        WHERE i.quote.id = :quoteId
          AND i.position >= :fromPosition
        """)
    void shiftPositionsFrom(
            @Param("quoteId")      Long quoteId,
            @Param("fromPosition") int fromPosition
    );
}