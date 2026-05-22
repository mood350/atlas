package com.atlas.backend.crm.deal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agencies/{agencyId}/deals")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    // POST /api/agencies/{agencyId}/deals
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody DealDto.Request dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dealService.create(agencyId, dto));
    }

    // GET /api/agencies/{agencyId}/deals/{dealId}
    @GetMapping("/{dealId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long dealId
    ) {
        return ResponseEntity.ok(dealService.findById(agencyId, dealId));
    }

    // GET /api/agencies/{agencyId}/deals?status=OPEN
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<DealDto.Response>> findByStatus(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "OPEN") Deal.DealStatus status,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size
    ) {
        return ResponseEntity.ok(
                dealService.findByStatus(agencyId, status, PageRequest.of(page, size)));
    }

    // GET /api/agencies/{agencyId}/deals/kanban?pipelineId=1
    @GetMapping("/kanban")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<List<DealDto.KanbanColumn>> getKanbanView(
            @PathVariable Long agencyId,
            @RequestParam Long pipelineId
    ) {
        return ResponseEntity.ok(dealService.getKanbanView(agencyId, pipelineId));
    }

    // PATCH /api/agencies/{agencyId}/deals/{dealId}/move
    @PatchMapping("/{dealId}/move")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> moveDeal(
            @PathVariable Long agencyId,
            @PathVariable Long dealId,
            @Valid @RequestBody DealDto.MoveRequest request
    ) {
        return ResponseEntity.ok(dealService.moveDeal(agencyId, dealId, request.getStageId()));
    }

    // PATCH /api/agencies/{agencyId}/deals/{dealId}/lost
    @PatchMapping("/{dealId}/lost")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> markAsLost(
            @PathVariable Long agencyId,
            @PathVariable Long dealId,
            @RequestBody DealDto.LoseRequest request
    ) {
        return ResponseEntity.ok(dealService.markAsLost(agencyId, dealId, request.getReason()));
    }

    // PATCH /api/agencies/{agencyId}/deals/{dealId}/won
    @PatchMapping("/{dealId}/won")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> markAsWon(
            @PathVariable Long agencyId,
            @PathVariable Long dealId
    ) {
        return ResponseEntity.ok(dealService.markAsWon(agencyId, dealId));
    }

    // PATCH /api/agencies/{agencyId}/deals/{dealId}/reopen
    @PatchMapping("/{dealId}/reopen")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> reopen(
            @PathVariable Long agencyId,
            @PathVariable Long dealId
    ) {
        return ResponseEntity.ok(dealService.reopen(agencyId, dealId));
    }

    // PUT /api/agencies/{agencyId}/deals/{dealId}
    @PutMapping("/{dealId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<DealDto.Response> update(
            @PathVariable Long agencyId,
            @PathVariable Long dealId,
            @Valid @RequestBody DealDto.UpdateRequest dto
    ) {
        return ResponseEntity.ok(dealService.update(agencyId, dealId, dto));
    }

    // DELETE /api/agencies/{agencyId}/deals/{dealId}
    @DeleteMapping("/{dealId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long dealId
    ) {
        dealService.delete(agencyId, dealId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/agencies/{agencyId}/deals/stats
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<DealService.PipelineStats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(dealService.getPipelineStats(agencyId));
    }
}