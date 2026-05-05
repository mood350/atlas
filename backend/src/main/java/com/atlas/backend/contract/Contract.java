package com.atlas.backend.contract;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.quote.Quote;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "contract",
        indexes = {
                @Index(name = "idx_contract_agency",  columnList = "agency_id"),
                @Index(name = "idx_contract_client",  columnList = "client_id"),
                @Index(name = "idx_contract_number",  columnList = "contract_number"),
                @Index(name = "idx_contract_status",  columnList = "status"),
                @Index(name = "idx_contract_token",   columnList = "access_token")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Contract extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "contract_number", unique = true, nullable = false, updatable = false)
    private String contractNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "access_token", unique = true)
    private String accessToken;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "signature_hash")
    private String signatureHash;

    @Column(name = "signer_name")
    private String signerName;

    @Column(name = "signer_email")
    private String signerEmail;

    @Column(name = "signer_ip_address")
    private String signerIpAddress;

    @Column(name = "signer_user_agent", length = 500)
    private String signerUserAgent;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    public enum ContractStatus {
        DRAFT,
        SENT,
        SIGNED,
        CANCELLED
    }

    public boolean isEditable() {
        return status == ContractStatus.DRAFT;
    }

    public boolean isSigned() {
        return status == ContractStatus.SIGNED;
    }

    public static String computeExpectedHash(String content, String signerName,
                                             String signerEmail, LocalDateTime signedAt) {
        try {
            String input = (content == null ? "" : content)
                    + signerName + signerEmail + signedAt.toString();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }
}
