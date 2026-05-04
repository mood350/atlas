package com.atlas.backend.crm.deal;

import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.crm.pipeline.PipelineStage;
import com.atlas.backend.crm.pipeline.PipelineStageRepository;
import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository          dealRepository;
    private final ClientRepository        clientRepository;
    private final PipelineStageRepository stageRepository;
    private final UserRepository          userRepository;

    // ─── Créer ───────────────────────────────────────────────────────────────

    @Transactional
    public DealDto.Response create(Long agencyId, DealDto.Request dto) {
        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        PipelineStage stage = stageRepository.findById(dto.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("Etape introuvable"));

        User owner = null;
        if (dto.getOwnerId() != null) {
            owner = userRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        }

        Deal deal = Deal.builder()
                .agency(client.getAgency())
                .client(client)
                .stage(stage)
                .owner(owner)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .amount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO)
                .expectedCloseDate(dto.getExpectedCloseDate())
                .priority(dto.getPriority() != null ? dto.getPriority() : Deal.DealPriority.MEDIUM)
                .build();

        deal.recalculateWeightedAmount();
        Deal saved = dealRepository.save(deal);
        log.info("[CRM] Deal cree agence={} deal={} client='{}' stage='{}'",
                agencyId, saved.getId(), client.getName(), stage.getName());

        return toResponse(saved);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DealDto.Response findById(Long agencyId, Long dealId) {
        return toResponse(getDealSecure(agencyId, dealId));
    }

    @Transactional(readOnly = true)
    public Page<DealDto.Response> findByStatus(Long agencyId, Deal.DealStatus status, Pageable pageable) {
        return dealRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                .map(this::toResponse);
    }

    // ─── Vue Kanban ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DealDto.KanbanColumn> getKanbanView(Long agencyId, Long pipelineId) {
        List<PipelineStage> stages = stageRepository.findByPipelineIdOrderByPositionAsc(pipelineId);

        return stages.stream().map(stage -> {
            List<Deal> stageDeals = dealRepository.findByStageId(stage.getId())
                    .stream()
                    .filter(d -> d.getStatus() == Deal.DealStatus.OPEN)
                    .toList();

            BigDecimal total = stageDeals.stream()
                    .map(Deal::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return DealDto.KanbanColumn.builder()
                    .stageId(stage.getId())
                    .stageName(stage.getName())
                    .stageColor(stage.getColor())
                    .winProbability(stage.getWinProbability())
                    .dealsCount(stageDeals.size())
                    .totalAmount(total)
                    .deals(stageDeals.stream().map(this::toResponse).toList())
                    .build();
        }).toList();
    }

    // ─── Déplacer (drag & drop Kanban) ───────────────────────────────────────

    @Transactional
    public DealDto.Response moveDeal(Long agencyId, Long dealId, Long targetStageId) {
        Deal deal = getDealSecure(agencyId, dealId);

        PipelineStage targetStage = stageRepository.findById(targetStageId)
                .orElseThrow(() -> new ResourceNotFoundException("Etape cible introuvable"));

        String previousStage = deal.getStage() != null ? deal.getStage().getName() : "aucune";
        deal.setStage(targetStage);
        deal.recalculateWeightedAmount();
        deal.recordActivity();

        if (targetStage.isWon()) {
            deal.setStatus(Deal.DealStatus.WON);
            deal.setActualCloseDate(LocalDate.now());
            log.info("[CRM] Deal gagne deal={} client='{}'", dealId, deal.getClient().getName());
        } else if (targetStage.isLost()) {
            deal.setStatus(Deal.DealStatus.LOST);
            deal.setActualCloseDate(LocalDate.now());
            log.info("[CRM] Deal perdu deal={}", dealId);
        }

        log.info("[CRM] Deal deplace deal={} '{}' -> '{}'", dealId, previousStage, targetStage.getName());
        return toResponse(dealRepository.save(deal));
    }

    // ─── Marquer comme perdu ─────────────────────────────────────────────────

    @Transactional
    public DealDto.Response markAsLost(Long agencyId, Long dealId, String reason) {
        Deal deal = getDealSecure(agencyId, dealId);
        deal.setStatus(Deal.DealStatus.LOST);
        deal.setLostReason(reason);
        deal.setActualCloseDate(LocalDate.now());
        deal.recordActivity();

        stageRepository.findByPipelineIdAndIsLostTrue(deal.getStage().getPipeline().getId())
                .ifPresent(deal::setStage);

        return toResponse(dealRepository.save(deal));
    }

    // ─── Modifier ────────────────────────────────────────────────────────────

    @Transactional
    public DealDto.Response update(Long agencyId, Long dealId, DealDto.Request dto) {
        Deal deal = getDealSecure(agencyId, dealId);

        if (!deal.getClient().getId().equals(dto.getClientId())) {
            Client newClient = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));
            deal.setClient(newClient);
        }

        if (!deal.getStage().getId().equals(dto.getStageId())) {
            PipelineStage newStage = stageRepository.findById(dto.getStageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Etape introuvable"));
            deal.setStage(newStage);
        }

        deal.setTitle(dto.getTitle());
        deal.setDescription(dto.getDescription());
        deal.setAmount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO);
        deal.setExpectedCloseDate(dto.getExpectedCloseDate());
        deal.setPriority(dto.getPriority() != null ? dto.getPriority() : Deal.DealPriority.MEDIUM);
        deal.recalculateWeightedAmount();
        deal.recordActivity();

        return toResponse(dealRepository.save(deal));
    }

    // ─── Supprimer ───────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long agencyId, Long dealId) {
        Deal deal = getDealSecure(agencyId, dealId);
        dealRepository.delete(deal);
        log.info("[CRM] Deal supprime agence={} deal={}", agencyId, dealId);
    }

    // ─── Statistiques ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PipelineStats getPipelineStats(Long agencyId) {
        return PipelineStats.builder()
                .openDeals(dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.OPEN))
                .wonDeals(dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.WON))
                .lostDeals(dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.LOST))
                .totalWonAmount(dealRepository.sumWonAmountByAgency(agencyId))
                .forecastedAmount(dealRepository.sumWeightedAmountByAgency(agencyId))
                .conversionRate(dealRepository.conversionRate(agencyId))
                .avgSalesCycleDays(dealRepository.avgSalesCycleDays(agencyId))
                .build();
    }

    // ─── Sécurité multi-tenant ────────────────────────────────────────────────

    public Deal getDealSecure(Long agencyId, Long dealId) {
        return dealRepository.findByIdAndAgencyId(dealId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Deal introuvable : " + dealId));
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    public DealDto.Response toResponse(Deal deal) {
        return DealDto.Response.builder()
                .id(deal.getId())
                .title(deal.getTitle())
                .description(deal.getDescription())
                .clientId(deal.getClient().getId())
                .clientName(deal.getClient().getName())
                .stageId(deal.getStage() != null ? deal.getStage().getId() : null)
                .stageName(deal.getStage() != null ? deal.getStage().getName() : null)
                .stageColor(deal.getStage() != null ? deal.getStage().getColor() : null)
                .stageWinProbability(deal.getStage() != null ? deal.getStage().getWinProbability() : 0)
                .ownerId(deal.getOwner() != null ? deal.getOwner().getId() : null)
                .ownerName(deal.getOwner() != null ? deal.getOwner().fullName() : null)
                .amount(deal.getAmount())
                .weightedAmount(deal.getWeightedAmount())
                .status(deal.getStatus())
                .priority(deal.getPriority())
                .expectedCloseDate(deal.getExpectedCloseDate())
                .actualCloseDate(deal.getActualCloseDate())
                .lostReason(deal.getLostReason())
                .lastActivityAt(deal.getLastActivityAt())
                .remindersSent(deal.getRemindersSent())
                .createdAt(deal.getCreatedAt())   // getCreatedAt() — champ Listeners
                .build();
    }

    // ─── Stats DTO ────────────────────────────────────────────────────────────

    @lombok.Value
    @lombok.Builder
    public static class PipelineStats {
        long       openDeals;
        long       wonDeals;
        long       lostDeals;
        BigDecimal totalWonAmount;
        BigDecimal forecastedAmount;
        Double     conversionRate;
        Double     avgSalesCycleDays;
    }
}