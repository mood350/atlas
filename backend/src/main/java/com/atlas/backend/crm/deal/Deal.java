package com.atlas.backend.crm.deal;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.crm.pipeline.PipelineStage;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "deal",
        indexes = {
                @Index(name = "idx_deal_agency",        columnList = "agency_id"),
                @Index(name = "idx_deal_client",        columnList = "client_id"),
                @Index(name = "idx_deal_stage",         columnList = "stage_id"),
                @Index(name = "idx_deal_owner",         columnList = "owner_id"),
                @Index(name = "idx_deal_last_activity", columnList = "last_activity_at")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Deal extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance tenant ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    // ─── Informations du deal ─────────────────────────────────────────────────
    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "weighted_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal weightedAmount = BigDecimal.ZERO;

    // ─── Position dans le pipeline ────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id")
    private PipelineStage stage;

    // ─── Dates ────────────────────────────────────────────────────────────────
    private LocalDate expectedCloseDate;
    private LocalDate actualCloseDate;

    @Column(name = "last_activity_at")
    @Builder.Default
    private LocalDateTime lastActivityAt = LocalDateTime.now();

    /*
     * NOTE IMPORTANTE — int primitif (pas Integer) :
     * Lombok @Getter génère getRemindersSent() sur un int.
     * Avec Integer wrapper, il génère aussi getRemindersSent() mais
     * @Builder.Default fonctionne mieux avec le primitif ici.
     */
    @Column(name = "reminders_sent")
    @Builder.Default
    private int remindersSent = 0;

    // ─── Statut ───────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DealStatus status = DealStatus.OPEN;

    private String lostReason;

    // ─── Priorité ─────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DealPriority priority = DealPriority.MEDIUM;

    // ─── Relations ────────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    // ─── Enums ────────────────────────────────────────────────────────────────

    public enum DealStatus {
        OPEN, WON, LOST
    }

    public enum DealPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    // ─── Méthodes utilitaires ─────────────────────────────────────────────────

    public void recalculateWeightedAmount() {
        if (stage != null && amount != null) {
            this.weightedAmount = amount.multiply(
                    BigDecimal.valueOf(stage.getWinProbability())
                            .divide(BigDecimal.valueOf(100))
            );
        }
    }

    public void recordActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }

    public boolean isInactiveSince(int hours) {
        return lastActivityAt.isBefore(LocalDateTime.now().minusHours(hours));
    }
}