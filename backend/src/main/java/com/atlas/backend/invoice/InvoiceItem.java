package com.atlas.backend.invoice;

import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "invoice_item",
        indexes = @Index(name = "idx_invoice_item_invoice", columnList = "invoice_id")
)
@EntityListeners(AuditingEntityListener.class)
public class InvoiceItem extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private String designation;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemType type = ItemType.SERVICE;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(length = 50)
    @Builder.Default
    private String unit = "Forfait";

    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "line_total", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;

    public enum ItemType {
        SERVICE,
        DEVELOPMENT,
        DESIGN,
        HOSTING,
        MAINTENANCE,
        TRAINING,
        LICENSE,
        OTHER
    }

    public void calculateLineTotal() {
        if (unitPrice == null || quantity == null) {
            this.lineTotal = BigDecimal.ZERO;
            return;
        }
        BigDecimal base = quantity.multiply(unitPrice);
        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(
                    discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            this.lineTotal = base.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        } else {
            this.lineTotal = base.setScale(2, RoundingMode.HALF_UP);
        }
    }

    public BigDecimal getDiscountAmount() {
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal base = quantity.multiply(unitPrice);
        return base.subtract(lineTotal).setScale(2, RoundingMode.HALF_UP);
    }
}
