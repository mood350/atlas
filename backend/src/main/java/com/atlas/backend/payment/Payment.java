package com.atlas.backend.payment;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.invoice.Invoice;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "payment",
        indexes = {
                @Index(name = "idx_payment_agency",   columnList = "agency_id"),
                @Index(name = "idx_payment_invoice",  columnList = "invoice_id"),
                @Index(name = "idx_payment_transaction", columnList = "transaction_id")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Payment extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "XOF";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "payment_url")
    private String paymentUrl;

    @Column(name = "webhook_payload", columnDefinition = "TEXT")
    private String webhookPayload;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "failure_reason")
    private String failureReason;

    public enum PaymentProvider {
        FEDAPAY,
        PAYDUNYA,
        BANK_TRANSFER,
        CASH,
        MOBILE_MONEY
    }

    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED
    }
}
