package com.atlas.backend.quote;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.crm.deal.DealRepository;
import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import com.atlas.backend.user.User;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository  quoteRepository;
    private final QuoteMapper      quoteMapper;
    private final QuotePdfService  quotePdfService;
    private final AgencyRepository agencyRepository;
    private final ClientRepository clientRepository;
    private final DealRepository   dealRepository;
    private final EmailService     emailService;

    @Value("${application.mail.from}")
    private String from;

    @Value("${application.mailing.frontend.activation-url}")
    private String frontendUrl;

    // ─── Creer ───────────────────────────────────────────────────────────────

    @Transactional
    public QuoteDto.Response create(Long agencyId, QuoteDto.Request dto, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        Deal deal = null;
        if (dto.getDealId() != null) {
            deal = dealRepository.findByIdAndAgencyId(dto.getDealId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Deal introuvable"));
        }

        Quote quote = Quote.builder()
                .agency(agency)
                .client(client)
                .deal(deal)
                .createdBy(currentUser)
                .quoteNumber(generateQuoteNumber(agencyId))
                .title(dto.getTitle())
                .description(dto.getDescription())
                .discountPercent(dto.getDiscountPercent())
                .taxRate(dto.getTaxRate() != null
                        ? dto.getTaxRate()
                        : java.math.BigDecimal.valueOf(agency.getTaxRate()))
                .currency(agency.getCurrency())
                .validUntil(dto.getValidUntil() != null
                        ? dto.getValidUntil()
                        : LocalDate.now().plusDays(30))
                .paymentTerms(dto.getPaymentTerms())
                .internalNotes(dto.getInternalNotes())
                .clientNotes(dto.getClientNotes())
                .accessToken(UUID.randomUUID().toString())
                .status(Quote.QuoteStatus.DRAFT)
                .build();

        Quote saved = quoteRepository.save(quote);
        addItemsToQuote(saved, dto.getItems());
        saved.recalculateTotals();
        saved = quoteRepository.save(saved);

        byte[] pdf = quotePdfService.generateQuotePdf(saved);
        log.info("[QUOTE] Devis cree agence={} quote='{}' client='{}' total={}{} pdf={}o",
                agencyId, saved.getQuoteNumber(), client.getName(),
                saved.getTotalAmount(), saved.getCurrency(), pdf.length);

        return quoteMapper.toResponse(saved);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuoteDto.Response findById(Long agencyId, Long quoteId) {
        return quoteMapper.toResponse(getQuoteSecure(agencyId, quoteId));
    }

    @Transactional(readOnly = true)
    public Page<QuoteDto.Summary> findAll(Long agencyId, Pageable pageable) {
        return quoteRepository.findByAgencyId(agencyId, pageable)
                .map(quoteMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<QuoteDto.Summary> findByStatus(Long agencyId, Quote.QuoteStatus status, Pageable pageable) {
        return quoteRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                .map(quoteMapper::toSummary);
    }

    // ─── Modifier (DRAFT uniquement) ─────────────────────────────────────────

    @Transactional
    public QuoteDto.Response update(Long agencyId, Long quoteId, QuoteDto.Request dto)
            throws IOException {
        Quote quote = getQuoteSecure(agencyId, quoteId);

        if (!quote.isEditable()) {
            throw new IllegalStateException(
                    "Un devis ne peut etre modifie qu'au statut DRAFT. Statut actuel: " + quote.getStatus());
        }

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        quote.setClient(client);
        quote.setTitle(dto.getTitle());
        quote.setDescription(dto.getDescription());
        quote.setDiscountPercent(dto.getDiscountPercent());
        if (dto.getTaxRate() != null) quote.setTaxRate(dto.getTaxRate());
        if (dto.getValidUntil() != null) quote.setValidUntil(dto.getValidUntil());
        quote.setPaymentTerms(dto.getPaymentTerms());
        quote.setInternalNotes(dto.getInternalNotes());
        quote.setClientNotes(dto.getClientNotes());

        quote.getItems().clear();
        quoteRepository.save(quote);
        addItemsToQuote(quote, dto.getItems());
        quote.recalculateTotals();

        Quote saved = quoteRepository.save(quote);
        quotePdfService.generateQuotePdf(saved);

        return quoteMapper.toResponse(saved);
    }

    // ─── Envoyer au client ───────────────────────────────────────────────────

    @Transactional
    public QuoteDto.Response send(Long agencyId, Long quoteId) throws MessagingException, IOException {
        Quote quote = getQuoteSecure(agencyId, quoteId);

        if (!quote.isSendable()) {
            throw new IllegalStateException("Ce devis ne peut pas etre envoye (statut: " + quote.getStatus() + ").");
        }

        quotePdfService.generateQuotePdf(quote);

        String portalUrl = frontendUrl + "/portal/quotes/" + quote.getAccessToken();
        Map<String, Object> props = new HashMap<>();
        props.put("clientName",  quote.getClient().fullContactName());
        props.put("agencyName",  quote.getAgency().getName());
        props.put("quoteNumber", quote.getQuoteNumber());
        props.put("quoteTitle",  quote.getTitle());
        props.put("totalAmount", quote.getTotalAmount().toPlainString());
        props.put("currency",    quote.getCurrency());
        props.put("validUntil",  quote.getValidUntil() != null ? quote.getValidUntil().toString() : "");
        props.put("portalUrl",   portalUrl);

        emailService.sendEmail(
                quote.getClient().getEmail(),
                "Devis " + quote.getQuoteNumber() + " - " + quote.getAgency().getName(),
                EmailTemplateName.QUOTE_SENT,
                props,
                from
        );

        quote.setStatus(Quote.QuoteStatus.SENT);
        quote.setSentAt(LocalDateTime.now());
        Quote saved = quoteRepository.save(quote);

        log.info("[QUOTE] Devis envoye quote='{}' client='{}'",
                quote.getQuoteNumber(), quote.getClient().getEmail());

        return quoteMapper.toResponse(saved);
    }

    // ─── Tracking ouverture (portail client) ─────────────────────────────────

    @Transactional
    public QuoteDto.Response markAsViewed(String accessToken) {
        Quote quote = quoteRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));

        if (quote.getStatus() == Quote.QuoteStatus.SENT) {
            quote.setStatus(Quote.QuoteStatus.VIEWED);
            quote.setViewedAt(LocalDateTime.now());
            quoteRepository.save(quote);
            log.info("[QUOTE] Devis ouvert par le client quote='{}'", quote.getQuoteNumber());
        }

        return quoteMapper.toResponse(quote);
    }

    // ─── Accepter (portail client) ────────────────────────────────────────────

    @Transactional
    public QuoteDto.Response accept(String accessToken) throws MessagingException {
        Quote quote = quoteRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));

        if (quote.getStatus() != Quote.QuoteStatus.SENT
                && quote.getStatus() != Quote.QuoteStatus.VIEWED) {
            throw new IllegalStateException("Ce devis ne peut pas etre accepte (statut: " + quote.getStatus() + ").");
        }
        if (quote.isExpired()) {
            throw new IllegalStateException("Ce devis a expire le " + quote.getValidUntil() + ".");
        }

        quote.setStatus(Quote.QuoteStatus.ACCEPTED);
        quote.setRespondedAt(LocalDateTime.now());
        quoteRepository.save(quote);
        notifyAgencyOfResponse(quote, true);

        log.info("[QUOTE] Devis accepte quote='{}' client='{}'",
                quote.getQuoteNumber(), quote.getClient().getName());

        return quoteMapper.toResponse(quote);
    }

    // ─── Rejeter (portail client) ─────────────────────────────────────────────

    @Transactional
    public QuoteDto.Response reject(String accessToken, String reason) throws MessagingException {
        Quote quote = quoteRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));

        if (quote.getStatus() != Quote.QuoteStatus.SENT
                && quote.getStatus() != Quote.QuoteStatus.VIEWED) {
            throw new IllegalStateException("Ce devis ne peut pas etre refuse (statut: " + quote.getStatus() + ").");
        }

        quote.setStatus(Quote.QuoteStatus.REJECTED);
        quote.setRejectionReason(reason);
        quote.setRespondedAt(LocalDateTime.now());
        quoteRepository.save(quote);
        notifyAgencyOfResponse(quote, false);

        log.info("[QUOTE] Devis refuse quote='{}' raison='{}'", quote.getQuoteNumber(), reason);

        return quoteMapper.toResponse(quote);
    }

    // ─── Transitions manuelles (agence) ──────────────────────────────────────

    @Transactional
    public QuoteDto.Response markAsNegotiating(Long agencyId, Long quoteId) {
        Quote quote = getQuoteSecure(agencyId, quoteId);
        if (!quote.canTransitionManually()) {
            throw new IllegalStateException(
                    "Transition impossible depuis le statut : " + quote.getStatus());
        }
        quote.setStatus(Quote.QuoteStatus.NEGOTIATING);
        Quote saved = quoteRepository.save(quote);
        log.info("[QUOTE] Devis passe en negotiation quote='{}'", quote.getQuoteNumber());
        return quoteMapper.toResponse(saved);
    }

    @Transactional
    public QuoteDto.Response markAsAccepted(Long agencyId, Long quoteId) throws MessagingException {
        Quote quote = getQuoteSecure(agencyId, quoteId);
        if (!quote.canTransitionManually()) {
            throw new IllegalStateException(
                    "Transition impossible depuis le statut : " + quote.getStatus());
        }
        quote.setStatus(Quote.QuoteStatus.ACCEPTED);
        quote.setRespondedAt(LocalDateTime.now());
        Quote saved = quoteRepository.save(quote);
        log.info("[QUOTE] Devis marque accepte (manuellement) quote='{}'", quote.getQuoteNumber());
        return quoteMapper.toResponse(saved);
    }

    @Transactional
    public QuoteDto.Response markAsRejected(Long agencyId, Long quoteId, String reason) throws MessagingException {
        Quote quote = getQuoteSecure(agencyId, quoteId);
        if (!quote.canTransitionManually()) {
            throw new IllegalStateException(
                    "Transition impossible depuis le statut : " + quote.getStatus());
        }
        quote.setStatus(Quote.QuoteStatus.REJECTED);
        quote.setRejectionReason(reason);
        quote.setRespondedAt(LocalDateTime.now());
        Quote saved = quoteRepository.save(quote);
        log.info("[QUOTE] Devis marque refuse (manuellement) quote='{}' raison='{}'",
                quote.getQuoteNumber(), reason);
        return quoteMapper.toResponse(saved);
    }

    // ─── Supprimer (DRAFT uniquement) ─────────────────────────────────────────

    @Transactional
    public void delete(Long agencyId, Long quoteId) {
        Quote quote = getQuoteSecure(agencyId, quoteId);
        if (!quote.isEditable()) {
            throw new IllegalStateException("Seuls les devis au statut DRAFT peuvent etre supprimes.");
        }
        quoteRepository.delete(quote);
        log.info("[QUOTE] Devis supprime quote='{}'", quote.getQuoteNumber());
    }

    // ─── Regenerer le PDF ─────────────────────────────────────────────────────

    @Transactional
    public byte[] regeneratePdf(Long agencyId, Long quoteId) throws IOException {
        Quote quote = getQuoteSecure(agencyId, quoteId);
        return quotePdfService.generateQuotePdf(quote);
    }

    // ─── Statistiques ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuoteDto.Stats getStats(Long agencyId) {
        long total    = quoteRepository.countByAgencyId(agencyId);
        long drafts   = quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.DRAFT);
        long sent     = quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.SENT)
                + quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.VIEWED)
                + quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.NEGOTIATING);
        long accepted = quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.ACCEPTED);
        long rejected = quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.REJECTED);
        long expired  = quoteRepository.countByAgencyIdAndStatus(agencyId, Quote.QuoteStatus.EXPIRED);

        long responded = accepted + rejected;
        double rate = responded > 0 ? (accepted * 100.0 / responded) : 0.0;

        return QuoteDto.Stats.builder()
                .totalQuotes(total)
                .drafts(drafts)
                .sent(sent)
                .accepted(accepted)
                .rejected(rejected)
                .expired(expired)
                .totalAcceptedAmount(quoteRepository.sumAcceptedAmountByAgency(agencyId))
                .acceptanceRate(Math.round(rate * 10.0) / 10.0)
                .build();
    }

    // ─── Scheduler : expiration automatique chaque matin a 8h ────────────────

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void expireOutdatedQuotes() {
        List<Quote> expired = quoteRepository.findExpiredQuotes(LocalDate.now());
        expired.forEach(q -> {
            q.setStatus(Quote.QuoteStatus.EXPIRED);
            log.info("[QUOTE] Devis expire automatiquement quote='{}'", q.getQuoteNumber());
        });
        if (!expired.isEmpty()) {
            quoteRepository.saveAll(expired);
            log.info("[SCHEDULER] {} devis expires automatiquement", expired.size());
        }
    }

    // ─── Utilitaires prives ───────────────────────────────────────────────────

    private Quote getQuoteSecure(Long agencyId, Long quoteId) {
        return quoteRepository.findByIdAndAgencyId(quoteId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable : " + quoteId));
    }

    private void addItemsToQuote(Quote quote, List<QuoteDto.ItemRequest> itemDtos) {
        for (int i = 0; i < itemDtos.size(); i++) {
            QuoteDto.ItemRequest dto = itemDtos.get(i);
            if (dto.getPosition() == 0) dto.setPosition(i + 1);
            QuoteItem item = quoteMapper.toItemEntity(dto);
            item.setQuote(quote);
            quote.getItems().add(item);
        }
    }

    private void notifyAgencyOfResponse(Quote quote, boolean accepted) throws MessagingException {
        if (quote.getCreatedBy() == null) return;

        Map<String, Object> props = new HashMap<>();
        props.put("agencyMemberName", quote.getCreatedBy().fullName());
        props.put("clientName",       quote.getClient().getName());
        props.put("quoteNumber",      quote.getQuoteNumber());
        props.put("quoteTitle",       quote.getTitle());
        props.put("totalAmount",      quote.getTotalAmount().toPlainString());
        props.put("currency",         quote.getCurrency());
        props.put("accepted",         accepted);
        props.put("rejectionReason",  quote.getRejectionReason());
        props.put("quoteUrl",         frontendUrl + "/quotes/" + quote.getId());

        emailService.sendEmail(
                quote.getCreatedBy().getEmail(),
                (accepted ? "Devis accepte" : "Devis refuse") + " : " + quote.getQuoteNumber(),
                EmailTemplateName.QUOTE_RESPONSE,
                props,
                from
        );
    }

    private String generateQuoteNumber(Long agencyId) {
        int year = Year.now().getValue();
        long count = quoteRepository.countByAgencyAndYear(agencyId, year) + 1;
        return String.format("DEV-%d-%05d", year, count);
    }
}