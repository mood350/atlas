package com.atlas.backend.project;

import com.atlas.backend.agency.Agency;
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
        name = "project_milestone",
        indexes = {
                @Index(name = "idx_milestone_project", columnList = "project_id"),
                @Index(name = "idx_milestone_agency",  columnList = "agency_id")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class ProjectMilestone extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    @Builder.Default
    private boolean billable = false;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    public enum MilestoneStatus {
        PENDING,
        COMPLETED,
        OVERDUE
    }

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status == MilestoneStatus.PENDING;
    }
}
