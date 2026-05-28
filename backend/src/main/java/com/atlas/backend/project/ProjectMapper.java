package com.atlas.backend.project;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProjectMapper {

    public ProjectDto.Response toResponse(Project project) {
        return ProjectDto.Response.builder()
                .id(project.getId())
                .projectNumber(project.getProjectNumber())
                .accessToken(project.getAccessToken())
                .name(project.getName())
                .description(project.getDescription())
                .clientId(project.getClient().getId())
                .clientName(project.getClient().getName())
                .contractId(project.getContract() != null ? project.getContract().getId() : null)
                .contractNumber(project.getContract() != null ? project.getContract().getContractNumber() : null)
                .createdById(project.getCreatedBy() != null ? project.getCreatedBy().getId() : null)
                .createdByName(project.getCreatedBy() != null ? project.getCreatedBy().fullName() : null)
                .status(project.getStatus())
                .priority(project.getPriority())
                .startDate(project.getStartDate())
                .deadline(project.getDeadline())
                .overdue(project.isOverdue())
                .progressPercent(project.getProgressPercent())
                .budget(project.getBudget())
                .estimatedHours(project.getEstimatedHours())
                .loggedHours(project.getLoggedHours())
                .tasks(toTaskResponseList(project.getTasks()))
                .milestones(toMilestoneResponseList(project.getMilestones()))
                .completedAt(project.getCompletedAt())
                .createdAt(project.getCreatedAt())
                .lastModifiedDate(project.getLastModifiedDate())
                .build();
    }

    public ProjectDto.Summary toSummary(Project project) {
        long totalTasks = project.getTasks().size();
        long doneTasks  = project.getTasks().stream()
                .filter(t -> t.getStatus() == ProjectTask.TaskStatus.DONE)
                .count();

        return ProjectDto.Summary.builder()
                .id(project.getId())
                .projectNumber(project.getProjectNumber())
                .name(project.getName())
                .clientName(project.getClient().getName())
                .status(project.getStatus())
                .priority(project.getPriority())
                .deadline(project.getDeadline())
                .overdue(project.isOverdue())
                .progressPercent(project.getProgressPercent())
                .totalTasks(totalTasks)
                .doneTasks(doneTasks)
                .createdAt(project.getCreatedAt())
                .build();
    }

    public ProjectDto.TaskResponse toTaskResponse(ProjectTask task) {
        return ProjectDto.TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().fullName() : null)
                .dueDate(task.getDueDate())
                .estimatedHours(task.getEstimatedHours())
                .loggedHours(task.getLoggedHours())
                .position(task.getPosition())
                .overdue(task.isOverdue())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .build();
    }

    public List<ProjectDto.TaskResponse> toTaskResponseList(List<ProjectTask> tasks) {
        return tasks.stream().map(this::toTaskResponse).toList();
    }

    public ProjectDto.MilestoneResponse toMilestoneResponse(ProjectMilestone milestone) {
        return ProjectDto.MilestoneResponse.builder()
                .id(milestone.getId())
                .title(milestone.getTitle())
                .description(milestone.getDescription())
                .dueDate(milestone.getDueDate())
                .status(milestone.getStatus())
                .billable(milestone.isBillable())
                .amount(milestone.getAmount())
                .overdue(milestone.isOverdue())
                .completedAt(milestone.getCompletedAt())
                .createdAt(milestone.getCreatedAt())
                .build();
    }

    public List<ProjectDto.MilestoneResponse> toMilestoneResponseList(List<ProjectMilestone> milestones) {
        return milestones.stream().map(this::toMilestoneResponse).toList();
    }
}
