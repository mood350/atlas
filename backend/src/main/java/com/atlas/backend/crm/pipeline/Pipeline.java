package com.atlas.backend.crm.pipeline;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    Pipeline.java                            ║
 * ║   Pipeline CRM personnalisable — conteneur d'étapes         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Une agence peut avoir plusieurs pipelines selon ses activités :
 *   - "Développement web" (étapes : Prospect → Devis → Négociation → Signé → Livré)
 *   - "Maintenance" (étapes : Demande → Planifié → En cours → Facturé)
 *   - "Consulting" (étapes personnalisées)
 *
 * À la création de l'agence, un pipeline "Par défaut" est auto-créé
 * par AgencyInitializerService avec 5 étapes standard.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "pipeline",
        indexes = @Index(name = "idx_pipeline_agency", columnList = "agency_id")
)
@EntityListeners(AuditingEntityListener.class)
public class Pipeline extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Appartenance tenant ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    // ─── Informations ────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String name;              // ex : "Développement web"

    @Column(length = 500)
    private String description;

    /** Pipeline actif (false = archivé) */
    @Builder.Default
    private boolean active = true;

    /** Pipeline par défaut de l'agence (un seul peut être default par agence) */
    @Builder.Default
    private boolean isDefault = false;

    // ─── Étapes du pipeline ───────────────────────────────────────────────────
    @OneToMany(
            mappedBy = "pipeline",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("position ASC")
    @Builder.Default
    private List<PipelineStage> stages = new ArrayList<>();
}