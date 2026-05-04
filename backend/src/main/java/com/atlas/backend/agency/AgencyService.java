package com.atlas.backend.agency;

import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.crm.pipeline.PipelineService;
import com.atlas.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgencyService {

    private final AgencyRepository agencyRepository;
    private final PipelineService  pipelineService;

    // ─── Récupérer une agence ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Agency findById(Long agencyId) {
        return agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable : " + agencyId));
    }

    @Transactional(readOnly = true)
    public Agency findBySubdomain(String subdomain) {
        return agencyRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable : " + subdomain));
    }

    // ─── Créer une agence (appelé par AuthenticationService à l'inscription) ──

    @Transactional
    public Agency create(AgencyDto.Request dto, User owner) {
        if (agencyRepository.existsBySubdomain(dto.getSubdomain())) {
            throw new IllegalStateException("Ce sous-domaine est déjà utilisé : " + dto.getSubdomain());
        }

        Agency agency = Agency.builder()
                .name(dto.getName())
                .subdomain(dto.getSubdomain())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .country(dto.getCountry())
                .city(dto.getCity())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "XOF")
                .taxRate(dto.getTaxRate() > 0 ? dto.getTaxRate() : 18.0)
                .invoiceDueDays(dto.getInvoiceDueDays() > 0 ? dto.getInvoiceDueDays() : 30)
                .plan(Agency.AgencyPlan.FREE)
                .active(true)
                .owner(owner)
                .build();

        Agency saved = agencyRepository.save(agency);

        // Initialiser le pipeline CRM par défaut
        pipelineService.initializeDefaultPipeline(saved);

        log.info("[AGENCY] Agence créée — id={} name='{}' subdomain='{}'",
                saved.getId(), saved.getName(), saved.getSubdomain());

        return saved;
    }

    // ─── Mettre à jour le profil ──────────────────────────────────────────────

    @Transactional
    public Agency update(Long agencyId, AgencyDto.Request dto) {
        Agency agency = findById(agencyId);

        // Vérifier unicité du subdomain si modifié
        if (!agency.getSubdomain().equals(dto.getSubdomain())
                && agencyRepository.existsBySubdomain(dto.getSubdomain())) {
            throw new IllegalStateException("Ce sous-domaine est déjà utilisé : " + dto.getSubdomain());
        }

        agency.setName(dto.getName());
        agency.setSubdomain(dto.getSubdomain());
        agency.setEmail(dto.getEmail());
        agency.setPhoneNumber(dto.getPhoneNumber());
        agency.setWhatsappNumber(dto.getWhatsappNumber());
        agency.setWebsite(dto.getWebsite());
        agency.setAddressLine(dto.getAddressLine());
        agency.setCity(dto.getCity());
        agency.setCountry(dto.getCountry());
        agency.setRccm(dto.getRccm());
        agency.setIfu(dto.getIfu());
        agency.setDescription(dto.getDescription());

        if (dto.getCurrency()       != null) agency.setCurrency(dto.getCurrency());
        if (dto.getTaxRate()        > 0)     agency.setTaxRate(dto.getTaxRate());
        if (dto.getInvoiceDueDays() > 0)     agency.setInvoiceDueDays(dto.getInvoiceDueDays());

        log.info("[AGENCY] Agence mise à jour — id={}", agencyId);
        return agencyRepository.save(agency);
    }

    // ─── Mettre à jour le logo ────────────────────────────────────────────────

    @Transactional
    public Agency updateLogo(Long agencyId, String logoUrl) {
        Agency agency = findById(agencyId);
        agency.setLogoUrl(logoUrl);
        return agencyRepository.save(agency);
    }

    // ─── Changer de plan ──────────────────────────────────────────────────────

    @Transactional
    public Agency changePlan(Long agencyId, Agency.AgencyPlan newPlan) {
        Agency agency = findById(agencyId);
        Agency.AgencyPlan oldPlan = agency.getPlan();
        agency.setPlan(newPlan);
        agencyRepository.save(agency);
        log.info("[AGENCY] Plan changé — id={} {} → {}", agencyId, oldPlan, newPlan);
        return agency;
    }

    // ─── Désactiver une agence ────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long agencyId) {
        Agency agency = findById(agencyId);
        agency.setActive(false);
        agencyRepository.save(agency);
        log.warn("[AGENCY] Agence désactivée — id={} name='{}'", agencyId, agency.getName());
    }

    // ─── Lister les membres ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<User> getMembers(Long agencyId) {
        Agency agency = findById(agencyId);
        return agency.getMembers();
    }

    // ─── Vérifier qu'un utilisateur appartient à l'agence ────────────────────

    public void assertMembership(Long agencyId, User user) {
        if (user.getAgency() == null || !user.getAgency().getId().equals(agencyId)) {
            throw new com.atlas.backend.common.exception.UnauthorizedAccessException(
                    "Vous n'êtes pas membre de cette agence");
        }
    }

    // ─── DTO interne ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AgencyDto.Response toResponse(Agency agency) {
        return AgencyDto.Response.builder()
                .id(agency.getId())
                .name(agency.getName())
                .subdomain(agency.getSubdomain())
                .logoUrl(agency.getLogoUrl())
                .email(agency.getEmail())
                .phoneNumber(agency.getPhoneNumber())
                .website(agency.getWebsite())
                .city(agency.getCity())
                .country(agency.getCountry())
                .currency(agency.getCurrency())
                .taxRate(agency.getTaxRate())
                .invoiceDueDays(agency.getInvoiceDueDays())
                .plan(agency.getPlan())
                .active(agency.isActive())
                .membersCount(agency.getMembers() != null ? agency.getMembers().size() : 0)
                .build();
    }
}