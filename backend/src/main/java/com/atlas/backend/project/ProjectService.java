package com.atlas.backend.project;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.contract.Contract;
import com.atlas.backend.contract.ContractRepository;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository          projectRepository;
    private final ProjectTaskRepository      taskRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final ProjectMapper              projectMapper;
    private final AgencyRepository           agencyRepository;
    private final ClientRepository           clientRepository;
    private final ContractRepository         contractRepository;
    private final UserRepository             userRepository;
    private final EmailService               emailService;

    @Value("${application.mail.from}")
    private String from;

    @Value("${application.mailing.frontend.base-url}")
    private String frontendBaseUrl;

    // ════════════════════════════════════════════════════════════════
    //  PROJETS
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public ProjectDto.Response create(Long agencyId, ProjectDto.Request dto, User currentUser) {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        Contract contract = null;
        if (dto.getContractId() != null) {
            contract = contractRepository.findByIdAndAgencyId(dto.getContractId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));
        }

        Project project = Project.builder()
                .agency(agency)
                .client(client)
                .contract(contract)
                .createdBy(currentUser)
                .projectNumber(generateProjectNumber(agencyId))
                .accessToken(UUID.randomUUID().toString())
                .name(dto.getName())
                .description(dto.getDescription())
                .priority(dto.getPriority() != null ? dto.getPriority() : Project.ProjectPriority.MEDIUM)
                .startDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now())
                .deadline(dto.getDeadline())
                .budget(dto.getBudget())
                .estimatedHours(dto.getEstimatedHours() != null ? dto.getEstimatedHours() : BigDecimal.ZERO)
                .status(Project.ProjectStatus.PLANNING)
                .build();

        Project saved = projectRepository.save(project);

        log.info("[PROJECT] Projet cree agence={} project='{}' client='{}'",
                agencyId, saved.getProjectNumber(), client.getName());

        return projectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectDto.Response update(Long agencyId, Long projectId, ProjectDto.Request dto) {
        Project project = getProjectSecure(agencyId, projectId);

        if (project.getStatus() == Project.ProjectStatus.DONE
                || project.getStatus() == Project.ProjectStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Un projet termine ou annule ne peut pas etre modifie. Statut: " + project.getStatus());
        }

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setClient(client);
        project.setPriority(dto.getPriority() != null ? dto.getPriority() : project.getPriority());
        if (dto.getStartDate() != null) project.setStartDate(dto.getStartDate());
        if (dto.getDeadline() != null)  project.setDeadline(dto.getDeadline());
        if (dto.getBudget() != null)    project.setBudget(dto.getBudget());
        if (dto.getEstimatedHours() != null) project.setEstimatedHours(dto.getEstimatedHours());

        Project saved = projectRepository.save(project);
        log.info("[PROJECT] Projet modifie project='{}'", project.getProjectNumber());

        return projectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectDto.Response updateStatus(Long agencyId, Long projectId, Project.ProjectStatus newStatus) {
        Project project = getProjectSecure(agencyId, projectId);
        Project.ProjectStatus old = project.getStatus();

        project.setStatus(newStatus);
        if (newStatus == Project.ProjectStatus.DONE && project.getCompletedAt() == null) {
            project.setCompletedAt(LocalDateTime.now());
        }

        Project saved = projectRepository.save(project);
        log.info("[PROJECT] Statut modifie project='{}' {}->{}",
                project.getProjectNumber(), old, newStatus);

        if (newStatus == Project.ProjectStatus.IN_PROGRESS
                && old != Project.ProjectStatus.IN_PROGRESS
                && project.getAccessToken() != null) {
            sendProjectStartedEmail(project);
        }

        return projectMapper.toResponse(saved);
    }

    private void sendProjectStartedEmail(Project project) {
        String clientEmail = project.getClient().getEmail();
        if (clientEmail == null || clientEmail.isBlank()) return;

        String portalUrl = frontendBaseUrl + "/portal/projects/" + project.getAccessToken();
        java.util.Map<String, Object> props = new java.util.HashMap<>();
        props.put("clientName",    project.getClient().fullContactName());
        props.put("agencyName",    project.getAgency().getName());
        props.put("projectNumber", project.getProjectNumber());
        props.put("projectName",   project.getName());
        props.put("deadline",      project.getDeadline() != null ? project.getDeadline().toString() : "");
        props.put("portalUrl",     portalUrl);

        try {
            emailService.sendEmail(
                    clientEmail,
                    "Votre projet a démarré — " + project.getName(),
                    EmailTemplateName.PROJECT_STARTED,
                    props,
                    from
            );
            log.info("[PROJECT] Email démarrage envoyé client='{}' project='{}'",
                    clientEmail, project.getProjectNumber());
        } catch (MessagingException e) {
            log.error("[PROJECT] Echec envoi email démarrage project='{}': {}",
                    project.getProjectNumber(), e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public ProjectDto.Response findById(Long agencyId, Long projectId) {
        return projectMapper.toResponse(getProjectSecure(agencyId, projectId));
    }

    @Transactional(readOnly = true)
    public ProjectDto.Response findByToken(String token) {
        Project project = projectRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable ou lien invalide"));
        return projectMapper.toResponse(project);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto.Summary> findAll(Long agencyId, Pageable pageable) {
        return projectRepository.findByAgencyId(agencyId, pageable)
                .map(projectMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto.Summary> findByStatus(Long agencyId, Project.ProjectStatus status,
                                                  Pageable pageable) {
        return projectRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                .map(projectMapper::toSummary);
    }

    @Transactional
    public void delete(Long agencyId, Long projectId) {
        Project project = getProjectSecure(agencyId, projectId);
        if (project.getStatus() != Project.ProjectStatus.PLANNING
                && project.getStatus() != Project.ProjectStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Seuls les projets PLANNING ou CANCELLED peuvent etre supprimes.");
        }
        projectRepository.delete(project);
        log.info("[PROJECT] Projet supprime project='{}'", project.getProjectNumber());
    }

    // ════════════════════════════════════════════════════════════════
    //  TACHES
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public ProjectDto.TaskResponse createTask(Long agencyId, Long projectId,
                                              ProjectDto.TaskRequest dto, User currentUser) {
        Project project = getProjectSecure(agencyId, projectId);

        User assignedTo = null;
        if (dto.getAssignedToId() != null) {
            assignedTo = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        }

        int position = dto.getPosition() > 0
                ? dto.getPosition()
                : (int) taskRepository.countByProjectId(projectId) + 1;

        ProjectTask task = ProjectTask.builder()
                .project(project)
                .agency(project.getAgency())
                .assignedTo(assignedTo)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .priority(dto.getPriority() != null ? dto.getPriority() : Project.ProjectPriority.MEDIUM)
                .dueDate(dto.getDueDate())
                .estimatedHours(dto.getEstimatedHours() != null ? dto.getEstimatedHours() : BigDecimal.ZERO)
                .position(position)
                .status(ProjectTask.TaskStatus.TODO)
                .build();

        ProjectTask saved = taskRepository.save(task);

        log.info("[PROJECT] Tache creee project='{}' task='{}'",
                project.getProjectNumber(), saved.getTitle());

        return projectMapper.toTaskResponse(saved);
    }

    @Transactional
    public ProjectDto.TaskResponse updateTask(Long agencyId, Long projectId, Long taskId,
                                              ProjectDto.TaskRequest dto) {
        ProjectTask task = getTaskSecure(agencyId, projectId, taskId);

        User assignedTo = null;
        if (dto.getAssignedToId() != null) {
            assignedTo = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        }

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setAssignedTo(assignedTo);
        if (dto.getPriority() != null) task.setPriority(dto.getPriority());
        if (dto.getDueDate() != null)  task.setDueDate(dto.getDueDate());
        if (dto.getEstimatedHours() != null) task.setEstimatedHours(dto.getEstimatedHours());
        if (dto.getPosition() > 0) task.setPosition(dto.getPosition());

        return projectMapper.toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public ProjectDto.TaskResponse updateTaskStatus(Long agencyId, Long projectId, Long taskId,
                                                    ProjectTask.TaskStatus newStatus) {
        ProjectTask task = getTaskSecure(agencyId, projectId, taskId);
        ProjectTask.TaskStatus old = task.getStatus();

        task.setStatus(newStatus);
        if (newStatus == ProjectTask.TaskStatus.DONE && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (newStatus != ProjectTask.TaskStatus.DONE) {
            task.setCompletedAt(null);
        }

        ProjectTask saved = taskRepository.save(task);
        log.info("[PROJECT] Statut tache modifie task='{}' {}->{}",
                task.getTitle(), old, newStatus);

        return projectMapper.toTaskResponse(saved);
    }

    @Transactional
    public ProjectDto.TaskResponse logHours(Long agencyId, Long projectId, Long taskId,
                                            BigDecimal hours) {
        ProjectTask task = getTaskSecure(agencyId, projectId, taskId);
        task.setLoggedHours(task.getLoggedHours().add(hours));
        taskRepository.save(task);

        Project project = task.getProject();
        project.setLoggedHours(project.getLoggedHours().add(hours));
        projectRepository.save(project);

        log.info("[PROJECT] Heures loggees task='{}' +{}h total={}h",
                task.getTitle(), hours, task.getLoggedHours());

        return projectMapper.toTaskResponse(task);
    }

    @Transactional
    public void deleteTask(Long agencyId, Long projectId, Long taskId) {
        ProjectTask task = getTaskSecure(agencyId, projectId, taskId);
        taskRepository.delete(task);
        log.info("[PROJECT] Tache supprimee task='{}'", task.getTitle());
    }

    // ════════════════════════════════════════════════════════════════
    //  JALONS
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public ProjectDto.MilestoneResponse createMilestone(Long agencyId, Long projectId,
                                                         ProjectDto.MilestoneRequest dto) {
        Project project = getProjectSecure(agencyId, projectId);

        ProjectMilestone milestone = ProjectMilestone.builder()
                .project(project)
                .agency(project.getAgency())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .billable(dto.isBillable())
                .amount(dto.getAmount())
                .status(ProjectMilestone.MilestoneStatus.PENDING)
                .build();

        ProjectMilestone saved = milestoneRepository.save(milestone);
        log.info("[PROJECT] Jalon cree project='{}' milestone='{}'",
                project.getProjectNumber(), saved.getTitle());

        return projectMapper.toMilestoneResponse(saved);
    }

    @Transactional
    public ProjectDto.MilestoneResponse completeMilestone(Long agencyId, Long projectId,
                                                           Long milestoneId) {
        ProjectMilestone milestone = getMilestoneSecure(agencyId, projectId, milestoneId);

        if (milestone.getStatus() == ProjectMilestone.MilestoneStatus.COMPLETED) {
            throw new IllegalStateException("Ce jalon est deja marque comme complete.");
        }

        milestone.setStatus(ProjectMilestone.MilestoneStatus.COMPLETED);
        milestone.setCompletedAt(LocalDateTime.now());
        milestoneRepository.save(milestone);

        log.info("[PROJECT] Jalon complete milestone='{}'", milestone.getTitle());
        return projectMapper.toMilestoneResponse(milestone);
    }

    @Transactional
    public void deleteMilestone(Long agencyId, Long projectId, Long milestoneId) {
        ProjectMilestone milestone = getMilestoneSecure(agencyId, projectId, milestoneId);
        if (milestone.getStatus() == ProjectMilestone.MilestoneStatus.COMPLETED) {
            throw new IllegalStateException("Un jalon complete ne peut pas etre supprime.");
        }
        milestoneRepository.delete(milestone);
        log.info("[PROJECT] Jalon supprime milestone='{}'", milestone.getTitle());
    }

    // ════════════════════════════════════════════════════════════════
    //  STATISTIQUES
    // ════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public ProjectDto.ProjectStats getStats(Long agencyId) {
        long overdueCount = projectRepository.findOverdueProjects(agencyId, LocalDate.now()).size();

        return ProjectDto.ProjectStats.builder()
                .totalProjects(projectRepository.countByAgencyId(agencyId))
                .planning(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.PLANNING))
                .inProgress(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.IN_PROGRESS))
                .onHold(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.ON_HOLD))
                .review(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.REVIEW))
                .done(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.DONE))
                .cancelled(projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.CANCELLED))
                .overdueProjects(overdueCount)
                .build();
    }

    // ════════════════════════════════════════════════════════════════
    //  SCHEDULER — chaque matin a 8h
    // ════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkDeadlines() {
        LocalDate today = LocalDate.now();

        List<ProjectMilestone> overdueMilestones = milestoneRepository
                .findOverdueMilestones(0L, today); // 0L = toutes agences

        overdueMilestones.forEach(m -> {
            m.setStatus(ProjectMilestone.MilestoneStatus.OVERDUE);
            log.info("[SCHEDULER] Jalon marque OVERDUE milestone='{}'", m.getTitle());
        });

        if (!overdueMilestones.isEmpty()) {
            milestoneRepository.saveAll(overdueMilestones);
            log.info("[SCHEDULER] {} jalons marques OVERDUE", overdueMilestones.size());
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  UTILITAIRES PRIVES
    // ════════════════════════════════════════════════════════════════

    private Project getProjectSecure(Long agencyId, Long projectId) {
        return projectRepository.findByIdAndAgencyId(projectId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable : " + projectId));
    }

    private ProjectTask getTaskSecure(Long agencyId, Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectIdAndAgencyId(taskId, projectId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable : " + taskId));
    }

    private ProjectMilestone getMilestoneSecure(Long agencyId, Long projectId, Long milestoneId) {
        return milestoneRepository.findByIdAndProjectIdAndAgencyId(milestoneId, projectId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Jalon introuvable : " + milestoneId));
    }

    private String generateProjectNumber(Long agencyId) {
        int  year  = Year.now().getValue();
        long count = projectRepository.countByAgencyAndYear(agencyId, year) + 1;
        return String.format("PRJ-%d-%05d", year, count);
    }
}
