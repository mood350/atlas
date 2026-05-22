package com.atlas.backend.quote;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class QuoteDto {

    // ──────────────────────────────────────────────────────────────────────────
    //  ITEM REQUEST — une ligne de devis
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ItemRequest {

        @NotBlank(message = "La désignation est obligatoire")
        private String designation;

        private String description;

        private QuoteItem.ItemType type;

        @NotNull(message = "La quantité est obligatoire")
        @DecimalMin(value = "0.01", message = "La quantité doit être positive")
        private BigDecimal quantity;

        private String unit;

        @NotNull(message = "Le prix unitaire est obligatoire")
        @DecimalMin(value = "0", message = "Le prix ne peut pas être négatif")
        private BigDecimal unitPrice;

        @DecimalMin(value = "0")
        @DecimalMax(value = "100")
        @Builder.Default
        private BigDecimal discountPercent = BigDecimal.ZERO;

        private int position;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  QUOTE REQUEST — créer / modifier un devis
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotNull(message = "Le client est obligatoire")
        private Long clientId;

        private Long dealId;

        @NotBlank(message = "Le titre est obligatoire")
        private String title;

        private String description;

        @NotEmpty(message = "Le devis doit contenir au moins une ligne")
        @Valid
        private List<ItemRequest> items;

        @DecimalMin(value = "0")
        @DecimalMax(value = "100")
        @Builder.Default
        private BigDecimal discountPercent = BigDecimal.ZERO;

        @DecimalMin(value = "0")
        @DecimalMax(value = "100")
        private BigDecimal taxRate;

        @FutureOrPresent(message = "La date de validité ne peut pas être dans le passé")
        private LocalDate validUntil;

        private String paymentTerms;
        private String internalNotes;
        private String clientNotes;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  ITEM RESPONSE
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ItemResponse {
        private Long             id;
        private int              position;
        private String           designation;
        private String           description;
        private QuoteItem.ItemType type;
        private BigDecimal       quantity;
        private String           unit;
        private BigDecimal       unitPrice;
        private BigDecimal       discountPercent;
        private BigDecimal       discountAmount;
        private BigDecimal       lineTotal;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  QUOTE RESPONSE — réponse complète
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private String quoteNumber;

        // Client
        private Long   clientId;
        private String clientName;
        private String clientEmail;
        private String clientCity;

        // Deal lié
        private Long   dealId;
        private String dealTitle;

        // Créé par
        private Long   createdById;
        private String createdByName;

        private String title;
        private String description;

        private List<ItemResponse> items;

        // Montants
        private BigDecimal subtotal;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private String     currency;

        // Conditions
        private LocalDate  validUntil;
        private String     paymentTerms;
        private String     clientNotes;

        // Statut & tracking
        private Quote.QuoteStatus status;
        private LocalDateTime     sentAt;
        private LocalDateTime     viewedAt;
        private LocalDateTime     respondedAt;
        private String            rejectionReason;
        private String            pdfUrl;
        private boolean           expired;

        private LocalDateTime createdAt;
        private LocalDateTime lastModifiedDate;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  SUMMARY — liste compacte
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long              id;
        private String            quoteNumber;
        private String            title;
        private String            clientName;
        private BigDecimal        totalAmount;
        private String            currency;
        private Quote.QuoteStatus status;
        private LocalDate         validUntil;
        private boolean           expired;
        private LocalDateTime     createdAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  REJECT REQUEST — refus avec raison
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RejectRequest {
        private String reason;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  STATS
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Stats {
        private long       totalQuotes;
        private long       drafts;
        private long       sent;
        private long       accepted;
        private long       rejected;
        private long       expired;
        private BigDecimal totalAcceptedAmount;
        private double     acceptanceRate;
    }
}