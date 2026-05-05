package com.atlas.backend.project;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ProjectDto {

    // ─── Project Request ─────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotBlank(message = "Le nom du projet est obligatoire")
        private String name;

        private String description;

        @NotNull(message = "Le client est obligatoire")
        private Long clientId;

        private Long contractId;

        @Builder.Default
        private Project.ProjectPriority priority = Project.ProjectPriority.MEDIUM;

        private LocalDate startDate;
        private LocalDate deadline;

        @DecimalMin(value = "0", message = "Le budget ne peut pas etre negatif")
        private BigDecimal budget;

        @DecimalMin(value = "0")
        @Builder.Default
        private BigDecimal estimatedHours = BigDecimal.ZERO;
    }

    // ─── Task Request ────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TaskRequest {

        @NotBlank(message = "Le titre de la tache est obligatoire")
        private String title;

        private String description;
        private Long assignedToId;

        @Builder.Default
        private Project.ProjectPriority priority = Project.ProjectPriority.MEDIUM;

        private LocalDate dueDate;

        @DecimalMin(value = "0")
        @Builder.Default
        private BigDecimal estimatedHours = BigDecimal.ZERO;

        @Builder.Default
        private int position = 0;
    }

    // ─── Milestone Request ───────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MilestoneRequest {

        @NotBlank(message = "Le titre du jalon est obligatoire")
        private String title;

        private String description;

        @NotNull(message = "La date du jalon est obligatoire")
        private LocalDate dueDate;

        @Builder.Default
        private boolean billable = false;

        @DecimalMin(value = "0")
        private BigDecimal amount;
    }

    // ─── Log Hours Request ───────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LogHoursRequest {

        @NotNull(message = "Le nombre d'heures est obligatoire")
        @DecimalMin(value = "0.25", message = "Minimum 15 minutes (0.25h)")
        private BigDecimal hours;
    }

    // ─── Task Response ───────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TaskResponse {
        private Long   id;
        private String title;
        private String description;
        private ProjectTask.TaskStatus   status;
        private Project.ProjectPriority  priority;
        private Long   assignedToId;
        private String assignedToName;
        private LocalDate    dueDate;
        private BigDecimal   estimatedHours;
        private BigDecimal   loggedHours;
        private int          position;
        private boolean      overdue;
        private LocalDateTime completedAt;
        private LocalDateTime createdAt;
    }

    // ─── Milestone Response ──────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MilestoneResponse {
        private Long   id;
        private String title;
        private String description;
        private LocalDate             dueDate;
        private ProjectMilestone.MilestoneStatus status;
        private boolean               billable;
        private BigDecimal            amount;
        private boolean               overdue;
        private LocalDateTime         completedAt;
        private LocalDateTime         createdAt;
    }

    // ─── Project Response ────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private String projectNumber;
        private String name;
        private String description;

        private Long   clientId;
        private String clientName;
        private Long   contractId;
        private String contractNumber;
        private Long   createdById;
        private String createdByName;

        private Project.ProjectStatus   status;
        private Project.ProjectPriority priority;
        private LocalDate   startDate;
        private LocalDate   deadline;
        private boolean     overdue;
        private int         progressPercent;

        private BigDecimal  budget;
        private BigDecimal  estimatedHours;
        private BigDecimal  loggedHours;

        private List<TaskResponse>      tasks;
        private List<MilestoneResponse> milestones;

        private LocalDateTime completedAt;
        private LocalDateTime createdAt;
        private LocalDateTime lastModifiedDate;
    }

    // ─── Project Summary ─────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long   id;
        private String projectNumber;
        private String name;
        private String clientName;
        private Project.ProjectStatus   status;
        private Project.ProjectPriority priority;
        private LocalDate   deadline;
        private boolean     overdue;
        private int         progressPercent;
        private long        totalTasks;
        private long        doneTasks;
        private LocalDateTime createdAt;
    }

    // ─── Project Stats ───────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProjectStats {
        private long totalProjects;
        private long planning;
        private long inProgress;
        private long onHold;
        private long review;
        private long done;
        private long cancelled;
        private long overdueProjects;
        private long totalTasks;
        private long doneTasks;
    }
}
