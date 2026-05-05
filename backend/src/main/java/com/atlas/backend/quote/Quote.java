package com.atlas.backend.quote;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                      Quote.java                             ║
 * ║         Devis commercial — module facturation               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * CYCLE DE VIE D'UN DEVIS :
 *
 *   DRAFT ──► SENT ──► VIEWED ──► ACCEPTED ──► INVOICED
 *                  └──────────────► REJECTED
 *                  └──────────────► EXPIRED
 *
 *   DRAFT    : Brouillon, non envoyé au client
 *   SENT     : Envoyé par email, en attente de réponse
 *   VIEWED   : Client a ouvert le lien (tracking pixel ou accès portail)
 *   ACCEPTED : Client a accepté — peut être converti en contrat
 *   REJECTED : Client a refusé
 *   EXPIRED  : Date de validité dépassée sans réponse
 *   INVOICED : Converti en facture
 *
 * NUMÉROTATION OHADA :
 *   Format : DEV-{YYYY}-{XXXXX}  ex: DEV-2025-00042
 *   Généré automatiquement par QuoteService à la création.
 *
 * MULTI-TENANT :
 *   Toutes les requêtes filtrent sur agency_id.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "quote",
        indexes = {
                @Index(name = "idx_quote_agency",  columnList = "agency_id"),
                @Index(name = "idx_quote_client",  columnList = "client_id"),
                @Index(name = "idx_quote_number",  columnList = "quote_number"),
                @Index(name = "idx_quote_status",  columnList = "status")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Quote extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance tenant ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    // ─── Numérotation ─────────────────────────────────────────────────────────
    /**
     * Numéro unique du devis — format OHADA : DEV-2025-00042
     * Généré automatiquement, immuable après création.
     */
    @Column(name = "quote_number", unique = true, nullable = false, updatable = false)
    private String quoteNumber;

    // ─── Relations métier ─────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    /**
     * Deal associé (optionnel).
     * Si renseigné, le devis est lié à une opportunité CRM.
     * Quand le devis est ACCEPTED, le deal passe automatiquement à l'étape "Devis accepté".
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    /** Membre de l'agence ayant créé le devis */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    // ─── Contenu du devis ─────────────────────────────────────────────────────
    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    /**
     * Lignes du devis — cascade ALL + orphanRemoval pour suppression automatique
     * des lignes retirées.
     */
    @OneToMany(
            mappedBy = "quote",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("position ASC")
    @Builder.Default
    private List<QuoteItem> items = new ArrayList<>();

    // ─── Montants calculés ────────────────────────────────────────────────────
    /**
     * Sous-total HT (somme des lignes).
     * Recalculé automatiquement par recalculateTotals().
     */
    @Column(name = "subtotal", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    /**
     * Taux de remise globale en % (ex: 10.0 pour 10%).
     * Appliquée sur le sous-total avant TVA.
     */
    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    /** Montant de la remise en valeur absolue. Calculé automatiquement. */
    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * Base imposable = subtotal - discountAmount.
     * Calculé automatiquement.
     */
    @Column(name = "taxable_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    /**
     * Taux de TVA en % (repris depuis agency.taxRate par défaut).
     * Modifiable manuellement (ex: 0% pour exports, ONG exonérées...).
     */
    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(18);

    /** Montant TVA calculé. */
    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /** Total TTC = taxableAmount + taxAmount. */
    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** Devise (reprise depuis agency.currency). Ex: "XOF", "XAF", "EUR". */
    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "XOF";

    // ─── Conditions ───────────────────────────────────────────────────────────
    /** Date de validité du devis (après cette date : statut EXPIRED). */
    @Column(name = "valid_until")
    private LocalDate validUntil;

    /** Conditions de paiement (ex: "30% acompte, solde à la livraison"). */
    @Column(name = "payment_terms", length = 500)
    private String paymentTerms;

    /** Notes internes (non visibles par le client). */
    @Column(name = "internal_notes", length = 1000)
    private String internalNotes;

    /** Notes visibles par le client (bas de page du PDF). */
    @Column(name = "client_notes", length = 1000)
    private String clientNotes;

    // ─── Statut ───────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuoteStatus status = QuoteStatus.DRAFT;

    // ─── Tracking envoi et lecture ────────────────────────────────────────────
    /** Date d'envoi au client. */
    private LocalDateTime sentAt;

    /**
     * Date de première ouverture par le client.
     * Renseignée quand le client clique sur le lien du portail.
     * Déclenche le passage au statut VIEWED.
     */
    private LocalDateTime viewedAt;

    /** Date de réponse (acceptation ou refus). */
    private LocalDateTime respondedAt;

    /** Raison du refus (renseignée si status = REJECTED). */
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    /** URL du PDF généré (stocké sur S3/Cloudinary). */
    @Column(name = "pdf_url")
    private String pdfUrl;

    /**
     * Token unique pour accès au portail client sans authentification.
     * Format UUID. Envoyé dans le lien email.
     */
    @Column(name = "access_token", unique = true)
    private String accessToken;

    // ─── Enum statut ─────────────────────────────────────────────────────────

    public enum QuoteStatus {
        DRAFT,
        SENT,
        VIEWED,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        INVOICED
    }

    // ─── Méthodes métier ──────────────────────────────────────────────────────

    /**
     * Recalcule tous les montants depuis les lignes.
     * À appeler après chaque modification des items ou des taux.
     */
    public void recalculateTotals() {
        // 1. Sous-total HT = somme (quantité × prix unitaire) de chaque ligne
        this.subtotal = items.stream()
                .map(QuoteItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Remise globale
        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = subtotal.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100));
        } else {
            this.discountAmount = BigDecimal.ZERO;
        }

        // 3. Base imposable
        this.taxableAmount = subtotal.subtract(discountAmount);

        // 4. TVA
        if (taxRate != null && taxRate.compareTo(BigDecimal.ZERO) > 0) {
            this.taxAmount = taxableAmount.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100));
        } else {
            this.taxAmount = BigDecimal.ZERO;
        }

        // 5. Total TTC
        this.totalAmount = taxableAmount.add(taxAmount);
    }

    /** Vérifie si le devis est expiré. */
    public boolean isExpired() {
        return validUntil != null && LocalDate.now().isAfter(validUntil);
    }

    /** Vérifie si le devis peut encore être modifié. */
    public boolean isEditable() {
        return status == QuoteStatus.DRAFT;
    }

    /** Vérifie si le devis peut être envoyé. */
    public boolean isSendable() {
        return (status == QuoteStatus.DRAFT || status == QuoteStatus.SENT)
                && !items.isEmpty();
    }
}