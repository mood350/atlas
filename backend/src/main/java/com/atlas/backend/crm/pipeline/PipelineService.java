package com.atlas.backend.crm.pipeline;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineService {

    private final PipelineRepository      pipelineRepository;
    private final PipelineStageRepository stageRepository;
    private final AgencyRepository        agencyRepository;

    // ─── Créer un pipeline ───────────────────────────────────────────────────

    @Transactional
    public Pipeline create(Long agencyId, String name, String description, boolean isDefault) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        // Si ce pipeline est défini comme default, désactiver l'ancien
        if (isDefault) {
            pipelineRepository.findByAgencyIdAndIsDefaultTrue(agencyId)
                    .ifPresent(p -> { p.setDefault(false); pipelineRepository.save(p); });
        }

        Pipeline pipeline = Pipeline.builder()
                .agency(agency)
                .name(name)
                .description(description)
                .isDefault(isDefault)
                .active(true)
                .build();

        return pipelineRepository.save(pipeline);
    }

    // ─── Initialiser le pipeline par défaut à la création de l'agence ────────
    /**
     * Appelé par AgencyService après la création d'une nouvelle agence.
     * Crée le pipeline "Par défaut" avec 6 étapes standard.
     */
    @Transactional
    public Pipeline initializeDefaultPipeline(Agency agency) {
        Pipeline pipeline = Pipeline.builder()
                .agency(agency)
                .name("Pipeline par défaut")
                .description("Cycle de vente standard pour le développement web")
                .isDefault(true)
                .active(true)
                .build();

        pipeline = pipelineRepository.save(pipeline);

        // Création des 6 étapes standard
        String[][] defaultStages = {
                // { nom, couleur, probabilité, isWon, isLost }
                { "Prospect",      "#6B7280", "10",  "false", "false" },
                { "Qualification", "#3B82F6", "25",  "false", "false" },
                { "Devis envoyé",  "#F59E0B", "50",  "false", "false" },
                { "Négociation",   "#8B5CF6", "75",  "false", "false" },
                { "Gagné",         "#10B981", "100", "true",  "false" },
                { "Perdu",         "#EF4444", "0",   "false", "true"  },
        };

        for (int i = 0; i < defaultStages.length; i++) {
            String[] s = defaultStages[i];
            PipelineStage stage = PipelineStage.builder()
                    .pipeline(pipeline)
                    .name(s[0])
                    .color(s[1])
                    .winProbability(Integer.parseInt(s[2]))
                    .isWon(Boolean.parseBoolean(s[3]))
                    .isLost(Boolean.parseBoolean(s[4]))
                    .position(i + 1)
                    .build();
            stageRepository.save(stage);
        }

        log.info("[PIPELINE] Pipeline par défaut créé — agence='{}' avec {} étapes",
                agency.getName(), defaultStages.length);

        return pipeline;
    }

    // ─── Lister les pipelines d'une agence ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<Pipeline> findAllByAgency(Long agencyId) {
        return pipelineRepository.findByAgencyIdAndActiveTrue(agencyId);
    }

    // ─── Récupérer un pipeline avec ses stages ────────────────────────────────

    @Transactional(readOnly = true)
    public Pipeline findWithStages(Long agencyId, Long pipelineId) {
        return pipelineRepository.findWithStages(pipelineId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline introuvable"));
    }

    // ─── Ajouter une étape au pipeline ───────────────────────────────────────

    @Transactional
    public PipelineStage addStage(Long agencyId, Long pipelineId, String name,
                                  String color, int probability, int position) {
        Pipeline pipeline = pipelineRepository.findByIdAndAgencyId(pipelineId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline introuvable"));

        // Décaler les stages existants à partir de la position d'insertion
        stageRepository.shiftPositionsFrom(pipelineId, position);

        PipelineStage stage = PipelineStage.builder()
                .pipeline(pipeline)
                .name(name)
                .color(color)
                .winProbability(probability)
                .position(position)
                .build();

        return stageRepository.save(stage);
    }

    // ─── Supprimer un pipeline (archiver) ────────────────────────────────────

    @Transactional
    public void archive(Long agencyId, Long pipelineId) {
        Pipeline pipeline = pipelineRepository.findByIdAndAgencyId(pipelineId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline introuvable"));

        if (pipeline.isDefault()) {
            throw new IllegalStateException("Impossible d'archiver le pipeline par défaut.");
        }

        pipeline.setActive(false);
        pipelineRepository.save(pipeline);
        log.info("[PIPELINE] Pipeline archivé — id={} name='{}'", pipelineId, pipeline.getName());
    }
}