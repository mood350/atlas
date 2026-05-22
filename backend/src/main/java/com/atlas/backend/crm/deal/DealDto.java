package com.atlas.backend.crm.deal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DealDto {

    // ──────────────────────────────────────────────────────────────────────────
    //  REQUEST — créer / modifier un deal
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotBlank(message = "Le titre du deal est obligatoire")
        private String title;

        private String description;

        @NotNull(message = "Le client est obligatoire")
        private Long clientId;

        @NotNull(message = "L'étape du pipeline est obligatoire")
        private Long stageId;

        private Long ownerId;

        @DecimalMin(value = "0", message = "Le montant ne peut pas être négatif")
        @Builder.Default
        private BigDecimal amount = BigDecimal.ZERO;

        private LocalDate expectedCloseDate;
        private Deal.DealPriority priority;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  RESPONSE — retourné à l'API
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private Long   agencyId;
        private String title;
        private String description;

        // Client résumé
        private Long   clientId;
        private String clientName;

        // Stage résumé
        private Long   pipelineId;
        private Long   stageId;
        private String stageName;
        private String stageColor;
        private int    stageWinProbability;

        // Owner
        private Long   ownerId;
        private String ownerName;
        private String ownerAvatarUrl;

        private BigDecimal amount;
        private String     currency;
        private BigDecimal weightedAmount;
        private Deal.DealStatus   status;
        private Deal.DealPriority priority;
        private LocalDate expectedCloseDate;
        private LocalDate actualCloseDate;
        private String lostReason;

        private LocalDateTime lastActivityAt;
        private int           remindersSent;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  MOVE — déplacer un deal vers une autre étape (drag & drop Kanban)
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class MoveRequest {
        @NotNull
        private Long targetStageId;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  LOSE — marquer un deal comme perdu avec une raison
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoseRequest {
        private String reason;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  PIPELINE VIEW — vue Kanban complète (une colonne par stage)
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class KanbanColumn {
        private StageInfo  stage;
        private int        count;
        private BigDecimal totalAmount;
        private java.util.List<Response> deals;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class StageInfo {
            private Long   id;
            private String name;
            private String color;
            private int    position;
            private int    probability;
            private Long   pipelineId;
        }
    }
}