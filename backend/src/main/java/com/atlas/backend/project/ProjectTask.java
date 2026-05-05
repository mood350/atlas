package com.atlas.backend.project;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "project_task",
        indexes = {
                @Index(name = "idx_task_project", columnList = "project_id"),
                @Index(name = "idx_task_agency",  columnList = "agency_id"),
                @Index(name = "idx_task_assigned", columnList = "assigned_to_id")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class ProjectTask extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Project.ProjectPriority priority = Project.ProjectPriority.MEDIUM;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "estimated_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal estimatedHours = BigDecimal.ZERO;

    @Column(name = "logged_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal loggedHours = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int position = 1;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum TaskStatus {
        TODO,
        IN_PROGRESS,
        REVIEW,
        DONE
    }

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status != TaskStatus.DONE;
    }
}
