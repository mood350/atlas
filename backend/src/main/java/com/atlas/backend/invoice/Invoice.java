package com.atlas.backend.invoice;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.contract.Contract;
import com.atlas.backend.quote.Quote;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "invoice",
        indexes = {
                @Index(name = "idx_invoice_agency",  columnList = "agency_id"),
                @Index(name = "idx_invoice_client",  columnList = "client_id"),
                @Index(name = "idx_invoice_number",  columnList = "invoice_number"),
                @Index(name = "idx_invoice_status",  columnList = "status"),
                @Index(name = "idx_invoice_token",   columnList = "access_token")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Invoice extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false, updatable = false)
    private String invoiceNumber;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvoiceType type = InvoiceType.STANDALONE;

    @Column(name = "deposit_percent", precision = 5, scale = 2)
    private BigDecimal depositPercent;

    @OneToMany(
            mappedBy = "invoice",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("position ASC")
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "subtotal", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "taxable_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(18);

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "XOF";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "access_token", unique = true)
    private String accessToken;

    @Column(name = "pdf_url")
    private String pdfUrl;

    public enum InvoiceType {
        DEPOSIT,
        FINAL,
        STANDALONE
    }

    public enum InvoiceStatus {
        DRAFT,
        SENT,
        PARTIALLY_PAID,
        PAID,
        OVERDUE,
        CANCELLED
    }

    public void recalculateTotals() {
        this.subtotal = items.stream()
                .map(InvoiceItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = subtotal.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            this.discountAmount = BigDecimal.ZERO;
        }

        this.taxableAmount = subtotal.subtract(discountAmount);

        if (taxRate != null && taxRate.compareTo(BigDecimal.ZERO) > 0) {
            this.taxAmount = taxableAmount.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            this.taxAmount = BigDecimal.ZERO;
        }

        this.totalAmount = taxableAmount.add(taxAmount);
    }

    public boolean isFullyPaid() {
        return paidAmount != null && paidAmount.compareTo(totalAmount) >= 0;
    }

    public BigDecimal getRemainingAmount() {
        if (paidAmount == null) return totalAmount;
        BigDecimal remaining = totalAmount.subtract(paidAmount);
        return remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining;
    }
}
