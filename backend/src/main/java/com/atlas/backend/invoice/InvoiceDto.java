package com.atlas.backend.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ItemRequest {

        @NotBlank(message = "La designation est obligatoire")
        private String designation;

        private String description;

        private InvoiceItem.ItemType type;

        @NotNull(message = "La quantite est obligatoire")
        @DecimalMin(value = "0.01", message = "La quantite doit etre positive")
        private BigDecimal quantity;

        private String unit;

        @NotNull(message = "Le prix unitaire est obligatoire")
        @DecimalMin(value = "0", message = "Le prix ne peut pas etre negatif")
        private BigDecimal unitPrice;

        @DecimalMin(value = "0") @DecimalMax(value = "100")
        @Builder.Default
        private BigDecimal discountPercent = BigDecimal.ZERO;

        private int position;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotNull(message = "Le client est obligatoire")
        private Long clientId;

        private Long contractId;
        private Long quoteId;

        @NotBlank(message = "Le titre est obligatoire")
        private String title;

        @NotEmpty(message = "La facture doit contenir au moins une ligne")
        @Valid
        private List<ItemRequest> items;

        @DecimalMin(value = "0") @DecimalMax(value = "100")
        @Builder.Default
        private BigDecimal discountPercent = BigDecimal.ZERO;

        @DecimalMin(value = "0") @DecimalMax(value = "100")
        private BigDecimal taxRate;

        private LocalDate dueDate;

        @Builder.Default
        private Invoice.InvoiceType type = Invoice.InvoiceType.STANDALONE;

        @DecimalMin(value = "0") @DecimalMax(value = "100")
        private BigDecimal depositPercent;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ItemResponse {
        private Long id;
        private int position;
        private String designation;
        private String description;
        private InvoiceItem.ItemType type;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal lineTotal;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String invoiceNumber;
        private String title;

        private Long clientId;
        private String clientName;
        private Long contractId;
        private String contractNumber;
        private Long quoteId;
        private String quoteNumber;
        private Long createdById;
        private String createdByName;

        private Invoice.InvoiceType type;
        private BigDecimal depositPercent;

        private List<ItemResponse> items;

        private BigDecimal subtotal;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private String currency;

        private LocalDate dueDate;
        private Invoice.InvoiceStatus status;
        private BigDecimal paidAmount;
        private BigDecimal remainingAmount;
        private LocalDateTime paidAt;
        private LocalDateTime sentAt;
        private String pdfUrl;

        private LocalDateTime createdAt;
        private LocalDateTime lastModifiedDate;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long id;
        private String invoiceNumber;
        private String clientName;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private String currency;
        private Invoice.InvoiceStatus status;
        private Invoice.InvoiceType type;
        private LocalDate dueDate;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class PaymentRequest {

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit etre positif")
        private BigDecimal amount;

        private String transactionId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InvoiceStats {
        private long totalInvoices;
        private long drafts;
        private long sent;
        private long partiallyPaid;
        private long paid;
        private long overdue;
        private long cancelled;
        private BigDecimal totalPaidAmount;
    }
}
