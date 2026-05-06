package com.atlas.backend.communication;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.project.Project;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "message",
        indexes = {
                @Index(name = "idx_msg_agency",   columnList = "agency_id"),
                @Index(name = "idx_msg_client",   columnList = "client_id"),
                @Index(name = "idx_msg_project",  columnList = "project_id"),
                @Index(name = "idx_msg_deal",     columnList = "deal_id"),
                @Index(name = "idx_msg_channel",  columnList = "channel"),
                @Index(name = "idx_msg_external", columnList = "external_id")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Message extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    /** Null pour les messages automatisés du système */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_by_id")
    private User sentBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageDirection direction = MessageDirection.OUTBOUND;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageStatus status = MessageStatus.PENDING;

    @Column(name = "from_address")
    private String fromAddress;

    @Column(name = "to_address")
    private String toAddress;

    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** SID Twilio ou ID de message email */
    @Column(name = "external_id")
    private String externalId;

    @Column(name = "error_message")
    private String errorMessage;

    // ─── Enums ───────────────────────────────────────────────────────────────

    public enum MessageChannel  { EMAIL, SMS, WHATSAPP, INTERNAL }
    public enum MessageDirection { OUTBOUND, INBOUND }
    public enum MessageStatus   { PENDING, SENT, DELIVERED, FAILED, READ }
}
