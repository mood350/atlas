package com.atlas.backend.project;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.atlas.backend.user.User;

@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ════════════════════════════════════════════════════════════════
    //  PROJETS — /api/agencies/{agencyId}/projects/**
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/projects")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody ProjectDto.Request dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(agencyId, dto, currentUser));
    }

    @GetMapping("/api/agencies/{agencyId}/projects")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<ProjectDto.Summary>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Project.ProjectStatus status
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return ResponseEntity.ok(projectService.findByStatus(agencyId, status, pageable));
        }
        return ResponseEntity.ok(projectService.findAll(agencyId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/projects/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.ProjectStats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(projectService.getStats(agencyId));
    }

    @GetMapping("/api/agencies/{agencyId}/projects/{projectId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectService.findById(agencyId, projectId));
    }

    @PutMapping("/api/agencies/{agencyId}/projects/{projectId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.Response> update(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDto.Request dto
    ) {
        return ResponseEntity.ok(projectService.update(agencyId, projectId, dto));
    }

    @PatchMapping("/api/agencies/{agencyId}/projects/{projectId}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.Response> updateStatus(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @RequestParam Project.ProjectStatus status
    ) {
        return ResponseEntity.ok(projectService.updateStatus(agencyId, projectId, status));
    }

    @DeleteMapping("/api/agencies/{agencyId}/projects/{projectId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long projectId
    ) {
        projectService.delete(agencyId, projectId);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════════════
    //  TACHES — /api/agencies/{agencyId}/projects/{projectId}/tasks/**
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/projects/{projectId}/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.TaskResponse> createTask(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDto.TaskRequest dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createTask(agencyId, projectId, dto, currentUser));
    }

    @PutMapping("/api/agencies/{agencyId}/projects/{projectId}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.TaskResponse> updateTask(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody ProjectDto.TaskRequest dto
    ) {
        return ResponseEntity.ok(projectService.updateTask(agencyId, projectId, taskId, dto));
    }

    @PatchMapping("/api/agencies/{agencyId}/projects/{projectId}/tasks/{taskId}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.TaskResponse> updateTaskStatus(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestParam ProjectTask.TaskStatus status
    ) {
        return ResponseEntity.ok(projectService.updateTaskStatus(agencyId, projectId, taskId, status));
    }

    @PostMapping("/api/agencies/{agencyId}/projects/{projectId}/tasks/{taskId}/log-hours")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.TaskResponse> logHours(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody ProjectDto.LogHoursRequest dto
    ) {
        return ResponseEntity.ok(projectService.logHours(agencyId, projectId, taskId, dto.getHours()));
    }

    @DeleteMapping("/api/agencies/{agencyId}/projects/{projectId}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        projectService.deleteTask(agencyId, projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════════════
    //  JALONS — /api/agencies/{agencyId}/projects/{projectId}/milestones/**
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/projects/{projectId}/milestones")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.MilestoneResponse> createMilestone(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDto.MilestoneRequest dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createMilestone(agencyId, projectId, dto));
    }

    @PostMapping("/api/agencies/{agencyId}/projects/{projectId}/milestones/{milestoneId}/complete")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProjectDto.MilestoneResponse> completeMilestone(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long milestoneId
    ) {
        return ResponseEntity.ok(projectService.completeMilestone(agencyId, projectId, milestoneId));
    }

    @DeleteMapping("/api/agencies/{agencyId}/projects/{projectId}/milestones/{milestoneId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> deleteMilestone(
            @PathVariable Long agencyId,
            @PathVariable Long projectId,
            @PathVariable Long milestoneId
    ) {
        projectService.deleteMilestone(agencyId, projectId, milestoneId);
        return ResponseEntity.noContent().build();
    }
}
