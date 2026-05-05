package com.atlas.backend.quote;

import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    QuoteItem.java                           ║
 * ║              Ligne d'un devis AgencyCRM                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Exemples de lignes pour une agence web :
 *
 *  Pos | Désignation                  | Qté | Unité | PU HT    | Remise | Total HT
 *  ────┼──────────────────────────────┼─────┼───────┼──────────┼────────┼──────────
 *   1  | Conception UX/UI             |  1  | Forfait| 250 000 |   0%   | 250 000
 *   2  | Développement frontend       |  1  | Forfait| 400 000 |   0%   | 400 000
 *   3  | Intégration backend API      | 20  | Heure  |  15 000 |  10%   | 270 000
 *   4  | Hébergement annuel           |  1  | An     |  60 000 |   0%   |  60 000
 *   5  | Formation utilisateurs       |  2  | Journée|  50 000 |   0%   | 100 000
 *
 * CALCUL DU TOTAL LIGNE :
 *   lineTotal = quantity × unitPrice × (1 - discountPercent/100)
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "quote_item",
        indexes = @Index(name = "idx_quote_item_quote", columnList = "quote_id")
)
@EntityListeners(AuditingEntityListener.class)
public class QuoteItem extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance ─────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    // ─── Ordre d'affichage ────────────────────────────────────────────────────
    /** Position dans le PDF (commence à 1). */
    @Column(nullable = false)
    private int position;

    // ─── Désignation ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String designation;       // ex: "Développement frontend React"

    @Column(length = 1000)
    private String description;       // Détails optionnels visibles dans le PDF

    // ─── Type de prestation ───────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemType type = ItemType.SERVICE;

    // ─── Quantité & prix ──────────────────────────────────────────────────────
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    /**
     * Unité de mesure.
     * Ex: "Forfait", "Heure", "Jour", "Mois", "An", "Page", "Écran"
     */
    @Column(length = 50)
    @Builder.Default
    private String unit = "Forfait";

    /** Prix unitaire HT dans la devise de l'agence. */
    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    /**
     * Remise sur cette ligne spécifique en % (ex: 10.0 pour 10%).
     * Distincte de la remise globale du devis.
     */
    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    /**
     * Total HT de la ligne = quantity × unitPrice × (1 - discountPercent/100).
     * Calculé automatiquement par calculateLineTotal().
     */
    @Column(name = "line_total", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;

    // ─── Enum type ────────────────────────────────────────────────────────────

    public enum ItemType {
        SERVICE,        // Prestation de service
        DEVELOPMENT,    // Développement / code
        DESIGN,         // Design / UX-UI
        HOSTING,        // Hébergement / infra
        MAINTENANCE,    // Maintenance / support
        TRAINING,       // Formation
        LICENSE,        // Licence logicielle
        OTHER
    }

    // ─── Méthodes métier ──────────────────────────────────────────────────────

    /**
     * Calcule et met à jour lineTotal.
     * À appeler après chaque modification de quantity, unitPrice ou discountPercent.
     *
     * Formule : lineTotal = quantity × unitPrice × (1 - discountPercent / 100)
     */
    public void calculateLineTotal() {
        if (unitPrice == null || quantity == null) {
            this.lineTotal = BigDecimal.ZERO;
            return;
        }

        BigDecimal base = quantity.multiply(unitPrice);

        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountFactor = BigDecimal.ONE.subtract(
                    discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            this.lineTotal = base.multiply(discountFactor)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            this.lineTotal = base.setScale(2, RoundingMode.HALF_UP);
        }
    }

    /** Retourne le montant de la remise en valeur absolue sur cette ligne. */
    public BigDecimal getDiscountAmount() {
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal base = quantity.multiply(unitPrice);
        return base.subtract(lineTotal).setScale(2, RoundingMode.HALF_UP);
    }
}