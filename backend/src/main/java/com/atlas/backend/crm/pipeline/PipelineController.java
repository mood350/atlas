package com.atlas.backend.crm.pipeline;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agencies/{agencyId}/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    // ─── DTOs ─────────────────────────────────────────────────────────────────

    record StageResponse(
        long id,
        String name,
        int position,
        String color,
        int probability,
        long pipelineId
    ) {}

    record PipelineResponse(
        long id,
        String name,
        @JsonProperty("isDefault") boolean isDefault,
        List<StageResponse> stages
    ) {}

    record CreatePipelineRequest(
        @NotBlank String name,
        String description,
        boolean isDefault
    ) {}

    record AddStageRequest(
        @NotBlank String name,
        int position,
        String color,
        int probability
    ) {}

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private StageResponse toStageResponse(PipelineStage s) {
        return new StageResponse(
            s.getId(),
            s.getName(),
            s.getPosition(),
            s.getColor(),
            s.getWinProbability(),
            s.getPipeline().getId()
        );
    }

    private PipelineResponse toResponse(Pipeline p) {
        List<StageResponse> stages = p.getStages().stream()
            .map(this::toStageResponse)
            .toList();
        return new PipelineResponse(p.getId(), p.getName(), p.isDefault(), stages);
    }

    // ─── GET /api/agencies/{agencyId}/pipelines ───────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<List<PipelineResponse>> findAll(@PathVariable Long agencyId) {
        List<PipelineResponse> result = pipelineService.findAllByAgency(agencyId)
            .stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(result);
    }

    // ─── GET /api/agencies/{agencyId}/pipelines/{pipelineId} ─────────────────

    @GetMapping("/{pipelineId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<PipelineResponse> findOne(
        @PathVariable Long agencyId,
        @PathVariable Long pipelineId
    ) {
        Pipeline pipeline = pipelineService.findWithStages(agencyId, pipelineId);
        return ResponseEntity.ok(toResponse(pipeline));
    }

    // ─── POST /api/agencies/{agencyId}/pipelines ──────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PipelineResponse> create(
        @PathVariable Long agencyId,
        @Valid @RequestBody CreatePipelineRequest req
    ) {
        Pipeline pipeline = pipelineService.create(
            agencyId, req.name(), req.description(), req.isDefault()
        );
        Pipeline withStages = pipelineService.findWithStages(agencyId, pipeline.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(withStages));
    }

    // ─── POST /api/agencies/{agencyId}/pipelines/{pipelineId}/stages ─────────

    @PostMapping("/{pipelineId}/stages")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PipelineResponse> addStage(
        @PathVariable Long agencyId,
        @PathVariable Long pipelineId,
        @Valid @RequestBody AddStageRequest req
    ) {
        pipelineService.addStage(
            agencyId, pipelineId, req.name(), req.color(), req.probability(), req.position()
        );
        Pipeline pipeline = pipelineService.findWithStages(agencyId, pipelineId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(pipeline));
    }

    // ─── DELETE /api/agencies/{agencyId}/pipelines/{pipelineId} ──────────────

    @DeleteMapping("/{pipelineId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> archive(
        @PathVariable Long agencyId,
        @PathVariable Long pipelineId
    ) {
        pipelineService.archive(agencyId, pipelineId);
        return ResponseEntity.noContent().build();
    }
}
