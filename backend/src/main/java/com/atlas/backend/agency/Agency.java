package com.atlas.backend.agency;

import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                      Agency.java                            ║
 * ║         Entité centrale du modèle multi-tenant              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Chaque agence est un tenant isolé.
 * Toutes les entités métier (Client, Deal, Facture, Projet...)
 * sont liées à une agence via agency_id.
 *
 * ISOLATION DES DONNÉES :
 *  → Toutes les requêtes doivent filtrer sur agency_id
 *  → Utiliser @PreAuthorize + AgencyContext pour garantir l'isolation
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "agency")
@EntityListeners(AuditingEntityListener.class)
public class Agency extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Informations générales ───────────────────────────────────────────────
    @Column(nullable = false)
    private String name;

    /** Sous-domaine unique ex: "creativedigital" → creativedigital.agencycrm.com */
    @Column(unique = true, nullable = false)
    private String subdomain;

    private String logoUrl;

    @Column(length = 500)
    private String description;

    // ─── Contact ──────────────────────────────────────────────────────────────
    @Column(unique = true)
    private String email;

    private String phoneNumber;
    private String whatsappNumber;
    private String website;

    // ─── Adresse (important pour la facturation OHADA) ───────────────────────
    private String addressLine;
    private String city;
    private String country;

    /**
     * RCCM : Registre du Commerce et du Crédit Mobilier
     * Équivalent africain du SIRET — obligatoire sur les factures OHADA
     */
    private String rccm;

    /**
     * IFU : Identifiant Fiscal Unique
     * Numéro fiscal africain — requis sur les factures légales
     */
    private String ifu;

    // ─── Paramètres de facturation ────────────────────────────────────────────
    /** Devise utilisée (ex: "XOF", "XAF", "EUR", "USD") */
    @Column(nullable = false, columnDefinition = "VARCHAR(3)")
    @Builder.Default
    private String currency = "XOF";

    /** Taux de TVA appliqué (ex: 18.0 pour 18%) */
    @Builder.Default
    private double taxRate = 18.0;

    /** Nombre de jours avant échéance des factures (ex: 30) */
    @Builder.Default
    private int invoiceDueDays = 30;

    // ─── Abonnement SaaS ──────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AgencyPlan plan = AgencyPlan.FREE;

    private boolean active;

    // ─── Relations ────────────────────────────────────────────────────────────
    /** Propriétaire principal de l'agence */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "agency", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> members;

    // ─── Enum plan ────────────────────────────────────────────────────────────
    public enum AgencyPlan {
        FREE,      // Limité : 3 clients, 2 projets actifs
        STARTER,   // 20 clients, 10 projets
        PRO,       // Illimité, toutes fonctionnalités
        ENTERPRISE // Multi-agences, support dédié
    }
}