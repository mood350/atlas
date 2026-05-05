package com.atlas.backend.contract;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.quote.Quote;
import com.atlas.backend.quote.QuoteRepository;
import com.atlas.backend.user.User;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractMapper     contractMapper;
    private final ContractPdfService contractPdfService;
    private final AgencyRepository   agencyRepository;
    private final ClientRepository   clientRepository;
    private final QuoteRepository    quoteRepository;
    private final EmailService       emailService;

    @Value("${application.mail.from}")
    private String from;

    @Value("${application.mailing.frontend.activation-url}")
    private String frontendUrl;

    // ─── Creer ───────────────────────────────────────────────────────────────

    @Transactional
    public ContractDto.Response create(Long agencyId, ContractDto.Request dto, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        Quote quote = null;
        if (dto.getQuoteId() != null) {
            quote = quoteRepository.findByIdAndAgencyId(dto.getQuoteId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));
        }

        Contract contract = Contract.builder()
                .agency(agency)
                .client(client)
                .quote(quote)
                .createdBy(currentUser)
                .contractNumber(generateContractNumber(agencyId))
                .title(dto.getTitle())
                .content(dto.getContent())
                .validUntil(dto.getValidUntil())
                .accessToken(UUID.randomUUID().toString())
                .status(Contract.ContractStatus.DRAFT)
                .build();

        Contract saved = contractRepository.save(contract);
        contractPdfService.generateContractPdf(saved);

        log.info("[CONTRACT] Contrat cree agence={} contract='{}' client='{}'",
                agencyId, saved.getContractNumber(), client.getName());

        return contractMapper.toResponse(saved);
    }

    // ─── Convertir depuis devis accepte ─────────────────────────────────────

    @Transactional
    public ContractDto.Response convertFromQuote(Long agencyId, Long quoteId, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Quote quote = quoteRepository.findByIdAndAgencyId(quoteId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));

        if (quote.getStatus() != Quote.QuoteStatus.ACCEPTED) {
            throw new IllegalStateException(
                    "Seuls les devis au statut ACCEPTED peuvent etre convertis en contrat. Statut actuel: "
                            + quote.getStatus());
        }

        Contract contract = Contract.builder()
                .agency(agency)
                .client(quote.getClient())
                .quote(quote)
                .createdBy(currentUser)
                .contractNumber(generateContractNumber(agencyId))
                .title(quote.getTitle())
                .content("")
                .validUntil(quote.getValidUntil())
                .accessToken(UUID.randomUUID().toString())
                .status(Contract.ContractStatus.DRAFT)
                .build();

        Contract saved = contractRepository.save(contract);
        contractPdfService.generateContractPdf(saved);

        log.info("[CONTRACT] Contrat cree depuis devis quote='{}' contract='{}' agence={}",
                quote.getQuoteNumber(), saved.getContractNumber(), agencyId);

        return contractMapper.toResponse(saved);
    }

    // ─── Envoyer au client ───────────────────────────────────────────────────

    @Transactional
    public ContractDto.Response send(Long agencyId, Long contractId)
            throws IOException, MessagingException {

        Contract contract = getContractSecure(agencyId, contractId);

        if (contract.getStatus() != Contract.ContractStatus.DRAFT
                && contract.getStatus() != Contract.ContractStatus.SENT) {
            throw new IllegalStateException(
                    "Ce contrat ne peut pas etre envoye. Statut actuel: " + contract.getStatus());
        }

        contractPdfService.generateContractPdf(contract);

        String portalUrl = frontendUrl + "/portal/contracts/" + contract.getAccessToken();
        Map<String, Object> props = new HashMap<>();
        props.put("clientName",      contract.getClient().getName());
        props.put("agencyName",      contract.getAgency().getName());
        props.put("contractNumber",  contract.getContractNumber());
        props.put("contractTitle",   contract.getTitle());
        props.put("validUntil",      contract.getValidUntil() != null ? contract.getValidUntil().toString() : "");
        props.put("portalUrl",       portalUrl);

        emailService.sendEmail(
                contract.getClient().getEmail(),
                "Contrat " + contract.getContractNumber() + " - " + contract.getAgency().getName(),
                EmailTemplateName.CONTRACT_SENT,
                props,
                from
        );

        contract.setStatus(Contract.ContractStatus.SENT);
        contract.setSentAt(LocalDateTime.now());
        Contract saved = contractRepository.save(contract);

        log.info("[CONTRACT] Contrat envoye contract='{}' client='{}'",
                contract.getContractNumber(), contract.getClient().getEmail());

        return contractMapper.toResponse(saved);
    }

    // ─── Signer (portail client) ──────────────────────────────────────────────

    @Transactional
    public ContractDto.Response sign(String accessToken, ContractDto.SignRequest dto,
                                     String ipAddress, String userAgent)
            throws IOException, MessagingException {

        Contract contract = contractRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));

        if (contract.getStatus() != Contract.ContractStatus.SENT) {
            throw new IllegalStateException(
                    "Ce contrat ne peut pas etre signe. Statut actuel: " + contract.getStatus());
        }

        LocalDateTime signedAt = LocalDateTime.now();
        String hash = Contract.computeExpectedHash(
                contract.getContent(), dto.getSignerName(), dto.getSignerEmail(), signedAt);

        contract.setSignedAt(signedAt);
        contract.setSignerName(dto.getSignerName());
        contract.setSignerEmail(dto.getSignerEmail());
        contract.setSignerIpAddress(ipAddress);
        contract.setSignerUserAgent(userAgent);
        contract.setSignatureHash(hash);
        contract.setStatus(Contract.ContractStatus.SIGNED);

        contractPdfService.generateContractPdf(contract);

        Contract saved = contractRepository.save(contract);

        notifyAgencyOfSignature(saved);

        log.info("[CONTRACT] Contrat signe contract='{}' signataire='{}' ip='{}'",
                contract.getContractNumber(), dto.getSignerName(), ipAddress);

        return contractMapper.toResponse(saved);
    }

    // ─── Annuler ─────────────────────────────────────────────────────────────

    @Transactional
    public void cancel(Long agencyId, Long contractId, String reason) {
        Contract contract = getContractSecure(agencyId, contractId);

        if (contract.getStatus() != Contract.ContractStatus.DRAFT
                && contract.getStatus() != Contract.ContractStatus.SENT) {
            throw new IllegalStateException(
                    "Seuls les contrats DRAFT ou SENT peuvent etre annules. Statut actuel: "
                            + contract.getStatus());
        }

        contract.setStatus(Contract.ContractStatus.CANCELLED);
        contract.setRejectionReason(reason);
        contractRepository.save(contract);

        log.info("[CONTRACT] Contrat annule contract='{}' raison='{}'",
                contract.getContractNumber(), reason);
    }

    // ─── Telecharger le PDF ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] getPdf(Long agencyId, Long contractId) throws IOException {
        Contract contract = getContractSecure(agencyId, contractId);
        return contractPdfService.generateContractPdf(contract);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ContractDto.Response findById(Long agencyId, Long contractId) {
        return contractMapper.toResponse(getContractSecure(agencyId, contractId));
    }

    @Transactional(readOnly = true)
    public ContractDto.Response findByToken(String accessToken) {
        Contract contract = contractRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));
        return contractMapper.toResponse(contract);
    }

    @Transactional(readOnly = true)
    public Page<ContractDto.Summary> findAll(Long agencyId, Pageable pageable) {
        return contractRepository.findAll(pageable)
                .map(contractMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<ContractDto.Summary> findByStatus(Long agencyId, Contract.ContractStatus status,
                                                   Pageable pageable) {
        return contractRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                .map(contractMapper::toSummary);
    }

    // ─── Modifier (DRAFT uniquement) ─────────────────────────────────────────

    @Transactional
    public ContractDto.Response update(Long agencyId, Long contractId,
                                       ContractDto.Request dto) throws IOException {
        Contract contract = getContractSecure(agencyId, contractId);

        if (!contract.isEditable()) {
            throw new IllegalStateException(
                    "Un contrat ne peut être modifie qu'au statut DRAFT. Statut actuel: "
                            + contract.getStatus());
        }

        contract.setTitle(dto.getTitle());
        contract.setContent(dto.getContent());
        if (dto.getValidUntil() != null) contract.setValidUntil(dto.getValidUntil());

        contractPdfService.generateContractPdf(contract);
        Contract saved = contractRepository.save(contract);

        return contractMapper.toResponse(saved);
    }

    // ─── Statistiques ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ContractDto.ContractStats getStats(Long agencyId) {
        long total     = contractRepository.countByAgencyId(agencyId);
        long drafts    = contractRepository.countByAgencyIdAndStatus(agencyId, Contract.ContractStatus.DRAFT);
        long sent      = contractRepository.countByAgencyIdAndStatus(agencyId, Contract.ContractStatus.SENT);
        long signed    = contractRepository.countByAgencyIdAndStatus(agencyId, Contract.ContractStatus.SIGNED);
        long cancelled = contractRepository.countByAgencyIdAndStatus(agencyId, Contract.ContractStatus.CANCELLED);

        return ContractDto.ContractStats.builder()
                .totalContracts(total)
                .drafts(drafts)
                .sent(sent)
                .signed(signed)
                .cancelled(cancelled)
                .build();
    }

    // ─── Verifier l'integrite de la signature ────────────────────────────────

    @Transactional(readOnly = true)
    public boolean verifySignatureIntegrity(Long agencyId, Long contractId) {
        Contract contract = getContractSecure(agencyId, contractId);

        if (!contract.isSigned()) return false;

        String expected = Contract.computeExpectedHash(
                contract.getContent(),
                contract.getSignerName(),
                contract.getSignerEmail(),
                contract.getSignedAt()
        );

        boolean valid = expected.equals(contract.getSignatureHash());
        log.info("[CONTRACT] Verification intégrité contract='{}' valide={}",
                contract.getContractNumber(), valid);
        return valid;
    }

    // ─── Utilitaires prives ───────────────────────────────────────────────────

    private Contract getContractSecure(Long agencyId, Long contractId) {
        return contractRepository.findByIdAndAgencyId(contractId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable : " + contractId));
    }

    private String generateContractNumber(Long agencyId) {
        int  year  = Year.now().getValue();
        long count = contractRepository.countByAgencyAndYear(agencyId, year) + 1;
        return String.format("CTR-%d-%05d", year, count);
    }

    private void notifyAgencyOfSignature(Contract contract) throws MessagingException {
        if (contract.getCreatedBy() == null) return;

        Map<String, Object> props = new HashMap<>();
        props.put("agencyMemberName", contract.getCreatedBy().fullName());
        props.put("clientName",       contract.getClient().getName());
        props.put("contractNumber",   contract.getContractNumber());
        props.put("signerName",       contract.getSignerName());
        props.put("signedAt",         contract.getSignedAt() != null
                ? contract.getSignedAt().toString() : "");
        props.put("signatureHash",    contract.getSignatureHash());

        emailService.sendEmail(
                contract.getCreatedBy().getEmail(),
                "Contrat signe : " + contract.getContractNumber(),
                EmailTemplateName.CONTRACT_SIGNED,
                props,
                from
        );
    }
}
