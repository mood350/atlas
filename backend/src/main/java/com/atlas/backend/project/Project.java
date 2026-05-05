package com.atlas.backend.project;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.atlas.backend.contract.Contract;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "project",
        indexes = {
                @Index(name = "idx_project_agency",  columnList = "agency_id"),
                @Index(name = "idx_project_client",  columnList = "client_id"),
                @Index(name = "idx_project_number",  columnList = "project_number"),
                @Index(name = "idx_project_status",  columnList = "status")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Project extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "project_number", unique = true, nullable = false, updatable = false)
    private String projectNumber;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.PLANNING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectPriority priority = ProjectPriority.MEDIUM;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "budget", precision = 15, scale = 2)
    private BigDecimal budget;

    @Column(name = "estimated_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal estimatedHours = BigDecimal.ZERO;

    @Column(name = "logged_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal loggedHours = BigDecimal.ZERO;

    @OneToMany(
            mappedBy = "project",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("position ASC")
    @Builder.Default
    private List<ProjectTask> tasks = new ArrayList<>();

    @OneToMany(
            mappedBy = "project",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("dueDate ASC")
    @Builder.Default
    private List<ProjectMilestone> milestones = new ArrayList<>();

    public enum ProjectStatus {
        PLANNING,
        IN_PROGRESS,
        ON_HOLD,
        REVIEW,
        DONE,
        CANCELLED
    }

    public enum ProjectPriority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }

    public boolean isOverdue() {
        return deadline != null
                && LocalDate.now().isAfter(deadline)
                && status != ProjectStatus.DONE
                && status != ProjectStatus.CANCELLED;
    }

    public boolean isActive() {
        return status == ProjectStatus.IN_PROGRESS || status == ProjectStatus.REVIEW;
    }

    public int getProgressPercent() {
        if (tasks == null || tasks.isEmpty()) return 0;
        long done = tasks.stream()
                .filter(t -> t.getStatus() == ProjectTask.TaskStatus.DONE)
                .count();
        return (int) (done * 100 / tasks.size());
    }
}
