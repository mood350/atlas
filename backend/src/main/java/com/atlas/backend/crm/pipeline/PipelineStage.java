package com.atlas.backend.crm.pipeline;

import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                  PipelineStage.java                         ║
 * ║   Colonne Kanban — étape d'un pipeline CRM                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Exemple de stages par défaut (créés par AgencyInitializerService) :
 *
 *  Position 1 — "Prospect"       (couleur #6B7280, probabilité 10%)
 *  Position 2 — "Qualification"  (couleur #3B82F6, probabilité 25%)
 *  Position 3 — "Devis envoyé"   (couleur #F59E0B, probabilité 50%)
 *  Position 4 — "Négociation"    (couleur #8B5CF6, probabilité 75%)
 *  Position 5 — "Gagné"          (couleur #10B981, probabilité 100%, isWon=true)
 *  Position 6 — "Perdu"          (couleur #EF4444, probabilité 0%,  isLost=true)
 *
 * isWon et isLost sont des étapes terminales — un deal ne peut plus bouger.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "pipeline_stage",
        indexes = @Index(name = "idx_stage_pipeline", columnList = "pipeline_id")
)
@EntityListeners(AuditingEntityListener.class)
public class PipelineStage extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance ─────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    // ─── Informations de l'étape ──────────────────────────────────────────────
    @Column(nullable = false)
    private String name;              // ex : "Devis envoyé"

    /** Ordre d'affichage dans le Kanban (commence à 1) */
    @Column(nullable = false)
    private int position;

    /**
     * Couleur hexadécimale de la colonne Kanban — ex : "#F59E0B"
     * Utilisée par le frontend pour coloriser la colonne.
     */
    @Column(length = 7)
    @Builder.Default
    private String color = "#6B7280";

    /**
     * Probabilité de conversion estimée pour les deals dans cette étape.
     * Utilisé pour calculer le CA prévisionnel pondéré.
     * Valeur entre 0 et 100.
     */
    @Builder.Default
    private int winProbability = 50;

    /**
     * Indique que c'est l'étape terminale "Gagné".
     * Un seul stage par pipeline peut avoir isWon=true.
     */
    @Builder.Default
    private boolean isWon = false;

    /**
     * Indique que c'est l'étape terminale "Perdu".
     * Un seul stage par pipeline peut avoir isLost=true.
     */
    @Builder.Default
    private boolean isLost = false;

    // ─── Deals dans cette étape ───────────────────────────────────────────────
    @OneToMany(mappedBy = "stage", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Deal> deals = new ArrayList<>();
}