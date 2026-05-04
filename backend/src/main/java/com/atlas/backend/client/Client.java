package com.atlas.backend.client;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                     Client.java                             ║
 * ║     Représente un prospect ou client d'une agence           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ISOLATION MULTI-TENANT :
 *  Chaque client appartient à UNE SEULE agence via agency_id.
 *  Toutes les requêtes doivent filtrer sur agency.id.
 *
 * CYCLE DE VIE :
 *  PROSPECT → ACTIVE → INACTIVE
 *  Un prospect devient ACTIVE dès qu'un deal est signé.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "client",
        indexes = {
                @Index(name = "idx_client_agency", columnList = "agency_id"),
                @Index(name = "idx_client_email",  columnList = "email")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Client extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance tenant ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    // ─── Informations de base ─────────────────────────────────────────────────
    @Column(nullable = false)
    private String name;              // Raison sociale ou nom complet

    private String contactFirstName;  // Prénom du contact principal
    private String contactLastName;   // Nom du contact principal

    @Column(unique = false)           // Un même email peut être client de plusieurs agences
    private String email;

    private String phoneNumber;
    private String whatsappNumber;

    // ─── Type de client ───────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClientType type = ClientType.SME;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClientStatus status = ClientStatus.PROSPECT;

    // ─── Localisation ─────────────────────────────────────────────────────────
    private String country;
    private String city;

    // ─── Informations fiscales (pour facturation OHADA) ───────────────────────
    private String rccm;  // Registre du Commerce
    private String ifu;   // Identifiant Fiscal Unique

    // ─── Secteur d'activité ───────────────────────────────────────────────────
    private String industry;  // ex: "Commerce", "ONG", "Collectivité", "Tech"

    // ─── Source d'acquisition ─────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    private LeadSource leadSource;

    // ─── Notes internes (visibles uniquement par l'agence) ───────────────────
    @Column(length = 2000)
    private String notes;

    // ─── Relations ────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Deal> deals = new ArrayList<>();

    // ─── Enums ────────────────────────────────────────────────────────────────

    public enum ClientType {
        SME,            // PME
        NGO,            // ONG / Association
        PUBLIC,         // Collectivité / Institution publique
        STARTUP,        // Startup
        INDIVIDUAL      // Particulier / Freelance
    }

    public enum ClientStatus {
        PROSPECT,       // Pas encore client, en phase de discussion
        ACTIVE,         // Client actif (au moins un contrat signé)
        INACTIVE        // Ancien client, plus d'activité récente
    }

    public enum LeadSource {
        REFERRAL,       // Bouche-à-oreille
        WHATSAPP,       // Prospection WhatsApp
        SOCIAL_MEDIA,   // Réseaux sociaux
        WEBSITE,        // Formulaire site web
        EVENT,          // Salon / événement
        COLD_OUTREACH,  // Démarchage direct
        OTHER
    }

    // ─── Méthodes utilitaires ─────────────────────────────────────────────────

    public String fullContactName() {
        if (contactFirstName == null && contactLastName == null) return name;
        return (contactFirstName != null ? contactFirstName + " " : "") +
                (contactLastName  != null ? contactLastName  : "");
    }
}