package com.atlas.backend.invoice;

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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository  invoiceRepository;
    private final InvoiceMapper      invoiceMapper;
    private final InvoicePdfService  invoicePdfService;
    private final AgencyRepository   agencyRepository;
    private final ClientRepository   clientRepository;
    private final ContractRepository contractRepository;
    private final EmailService       emailService;

    @Value("${application.mail.from}")
    private String from;

    @Value("${application.mailing.frontend.activation-url}")
    private String frontendUrl;

    // ─── Creer ───────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceDto.Response create(Long agencyId, InvoiceDto.Request dto, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Client client = clientRepository.findByIdAndAgencyId(dto.getClientId(), agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));

        Contract contract = null;
        if (dto.getContractId() != null) {
            contract = contractRepository.findByIdAndAgencyId(dto.getContractId(), agencyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));
        }

        LocalDate dueDate = dto.getDueDate() != null
                ? dto.getDueDate()
                : LocalDate.now().plusDays(agency.getInvoiceDueDays());

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber(agencyId))
                .title(dto.getTitle())
                .agency(agency)
                .client(client)
                .contract(contract)
                .createdBy(currentUser)
                .type(dto.getType() != null ? dto.getType() : Invoice.InvoiceType.STANDALONE)
                .depositPercent(dto.getDepositPercent())
                .discountPercent(dto.getDiscountPercent())
                .taxRate(dto.getTaxRate() != null
                        ? dto.getTaxRate()
                        : BigDecimal.valueOf(agency.getTaxRate()))
                .currency(agency.getCurrency())
                .dueDate(dueDate)
                .accessToken(UUID.randomUUID().toString())
                .status(Invoice.InvoiceStatus.DRAFT)
                .paidAmount(BigDecimal.ZERO)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        addItemsToInvoice(saved, dto.getItems());
        saved.recalculateTotals();
        saved = invoiceRepository.save(saved);
        invoicePdfService.generateInvoicePdf(saved);

        log.info("[INVOICE] Facture creee agence={} invoice='{}' client='{}' total={}{}",
                agencyId, saved.getInvoiceNumber(), client.getName(),
                saved.getTotalAmount(), saved.getCurrency());

        return invoiceMapper.toResponse(saved);
    }

    // ─── Generer depuis contrat signe ────────────────────────────────────────

    @Transactional
    public InvoiceDto.Response generateFromContract(Long agencyId, Long contractId, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Contract contract = contractRepository.findByIdAndAgencyId(contractId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));

        if (!contract.isSigned()) {
            throw new IllegalStateException("Seuls les contrats signes peuvent etre factures.");
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber(agencyId))
                .title(contract.getTitle())
                .agency(agency)
                .client(contract.getClient())
                .contract(contract)
                .createdBy(currentUser)
                .type(Invoice.InvoiceType.FINAL)
                .discountPercent(BigDecimal.ZERO)
                .taxRate(BigDecimal.valueOf(agency.getTaxRate()))
                .currency(agency.getCurrency())
                .dueDate(LocalDate.now().plusDays(agency.getInvoiceDueDays()))
                .accessToken(UUID.randomUUID().toString())
                .status(Invoice.InvoiceStatus.DRAFT)
                .paidAmount(BigDecimal.ZERO)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        invoicePdfService.generateInvoicePdf(saved);

        log.info("[INVOICE] Facture finale creee depuis contrat='{}' invoice='{}'",
                contract.getContractNumber(), saved.getInvoiceNumber());

        return invoiceMapper.toResponse(saved);
    }

    // ─── Generer un acompte ───────────────────────────────────────────────────

    @Transactional
    public InvoiceDto.Response generateDepositInvoice(Long agencyId, Long contractId,
                                                       BigDecimal percent, User currentUser)
            throws IOException {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        Contract contract = contractRepository.findByIdAndAgencyId(contractId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber(agencyId))
                .title("Acompte " + percent + "% - " + contract.getTitle())
                .agency(agency)
                .client(contract.getClient())
                .contract(contract)
                .createdBy(currentUser)
                .type(Invoice.InvoiceType.DEPOSIT)
                .depositPercent(percent)
                .discountPercent(BigDecimal.ZERO)
                .taxRate(BigDecimal.valueOf(agency.getTaxRate()))
                .currency(agency.getCurrency())
                .dueDate(LocalDate.now().plusDays(agency.getInvoiceDueDays()))
                .accessToken(UUID.randomUUID().toString())
                .status(Invoice.InvoiceStatus.DRAFT)
                .paidAmount(BigDecimal.ZERO)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        invoicePdfService.generateInvoicePdf(saved);

        log.info("[INVOICE] Acompte {}% cree depuis contrat='{}' invoice='{}'",
                percent, contract.getContractNumber(), saved.getInvoiceNumber());

        return invoiceMapper.toResponse(saved);
    }

    // ─── Envoyer au client ───────────────────────────────────────────────────

    @Transactional
    public InvoiceDto.Response send(Long agencyId, Long invoiceId)
            throws IOException, MessagingException {

        Invoice invoice = getInvoiceSecure(agencyId, invoiceId);

        if (invoice.getStatus() != Invoice.InvoiceStatus.DRAFT) {
            throw new IllegalStateException(
                    "Seules les factures DRAFT peuvent etre envoyees. Statut: " + invoice.getStatus());
        }

        invoicePdfService.generateInvoicePdf(invoice);

        String portalUrl = frontendUrl + "/portal/invoices/" + invoice.getAccessToken();
        Map<String, Object> props = new HashMap<>();
        props.put("clientName",     invoice.getClient().getName());
        props.put("agencyName",     invoice.getAgency().getName());
        props.put("invoiceNumber",  invoice.getInvoiceNumber());
        props.put("totalAmount",    invoice.getTotalAmount().toPlainString());
        props.put("currency",       invoice.getCurrency());
        props.put("dueDate",        invoice.getDueDate() != null ? invoice.getDueDate().toString() : "");
        props.put("portalUrl",      portalUrl);

        emailService.sendEmail(
                invoice.getClient().getEmail(),
                "Facture " + invoice.getInvoiceNumber() + " - " + invoice.getAgency().getName(),
                EmailTemplateName.INVOICE_SENT,
                props,
                from
        );

        invoice.setStatus(Invoice.InvoiceStatus.SENT);
        invoice.setSentAt(LocalDateTime.now());
        Invoice saved = invoiceRepository.save(invoice);

        log.info("[INVOICE] Facture envoyee invoice='{}' client='{}'",
                invoice.getInvoiceNumber(), invoice.getClient().getEmail());

        return invoiceMapper.toResponse(saved);
    }

    // ─── Enregistrer un paiement ─────────────────────────────────────────────

    @Transactional
    public InvoiceDto.Response recordPayment(Long agencyId, Long invoiceId,
                                              BigDecimal amount, String transactionId)
            throws IOException, MessagingException {

        Invoice invoice = getInvoiceSecure(agencyId, invoiceId);

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID
                || invoice.getStatus() == Invoice.InvoiceStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Cette facture ne peut plus recevoir de paiement. Statut: " + invoice.getStatus());
        }

        BigDecimal newPaid = invoice.getPaidAmount().add(amount);
        invoice.setPaidAmount(newPaid);

        if (invoice.isFullyPaid()) {
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
            notifyPaymentConfirmed(invoice);
        } else {
            invoice.setStatus(Invoice.InvoiceStatus.PARTIALLY_PAID);
        }

        Invoice saved = invoiceRepository.save(invoice);
        invoicePdfService.generateInvoicePdf(saved);

        log.info("[INVOICE] Paiement enregistre invoice='{}' montant={} transactionId='{}'",
                invoice.getInvoiceNumber(), amount, transactionId);

        return invoiceMapper.toResponse(saved);
    }

    // ─── Marquer comme paye (apres webhook) ─────────────────────────────────

    @Transactional
    public void markAsPaid(Long invoiceId) throws IOException, MessagingException {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable"));

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) return;

        invoice.setPaidAmount(invoice.getTotalAmount());
        invoice.setStatus(Invoice.InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());

        invoiceRepository.save(invoice);
        invoicePdfService.generateInvoicePdf(invoice);
        notifyPaymentConfirmed(invoice);

        log.info("[INVOICE] Facture marquee payee via webhook invoice='{}'",
                invoice.getInvoiceNumber());
    }

    // ─── Supprimer (DRAFT uniquement) ────────────────────────────────────────

    @Transactional
    public void delete(Long agencyId, Long invoiceId) {
        Invoice invoice = getInvoiceSecure(agencyId, invoiceId);
        if (invoice.getStatus() != Invoice.InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Seules les factures DRAFT peuvent etre supprimees.");
        }
        invoiceRepository.delete(invoice);
        log.info("[INVOICE] Facture supprimee invoice='{}'", invoice.getInvoiceNumber());
    }

    // ─── Telecharger le PDF ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] getPdf(Long agencyId, Long invoiceId) throws IOException {
        Invoice invoice = getInvoiceSecure(agencyId, invoiceId);
        return invoicePdfService.generateInvoicePdf(invoice);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InvoiceDto.Response findById(Long agencyId, Long invoiceId) {
        return invoiceMapper.toResponse(getInvoiceSecure(agencyId, invoiceId));
    }

    @Transactional(readOnly = true)
    public InvoiceDto.Response findByToken(String accessToken) {
        Invoice invoice = invoiceRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable"));
        return invoiceMapper.toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceDto.Summary> findAll(Long agencyId, Pageable pageable) {
        return invoiceRepository.findByAgencyId(agencyId, pageable)
                .map(invoiceMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceDto.Summary> findByStatus(Long agencyId, Invoice.InvoiceStatus status,
                                                  Pageable pageable) {
        return invoiceRepository.findByAgencyIdAndStatus(agencyId, status, pageable)
                .map(invoiceMapper::toSummary);
    }

    // ─── Statistiques ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InvoiceDto.InvoiceStats getStats(Long agencyId) {
        return InvoiceDto.InvoiceStats.builder()
                .totalInvoices(invoiceRepository.countByAgencyId(agencyId))
                .drafts(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.DRAFT))
                .sent(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.SENT))
                .partiallyPaid(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.PARTIALLY_PAID))
                .paid(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.PAID))
                .overdue(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.OVERDUE))
                .cancelled(invoiceRepository.countByAgencyIdAndStatus(agencyId, Invoice.InvoiceStatus.CANCELLED))
                .totalPaidAmount(invoiceRepository.sumPaidAmountByAgency(agencyId))
                .build();
    }

    // ─── Scheduler : marquer OVERDUE chaque matin a 9h ───────────────────────

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void markOverdueInvoices() {
        List<Invoice> overdue = invoiceRepository.findOverdueInvoices(LocalDate.now());
        overdue.forEach(invoice -> {
            invoice.setStatus(Invoice.InvoiceStatus.OVERDUE);
            log.info("[INVOICE] Facture marquee OVERDUE invoice='{}'", invoice.getInvoiceNumber());
            try {
                sendOverdueReminder(invoice);
            } catch (MessagingException e) {
                log.warn("[INVOICE] Echec envoi rappel invoice='{}' erreur='{}'",
                        invoice.getInvoiceNumber(), e.getMessage());
            }
        });
        if (!overdue.isEmpty()) {
            invoiceRepository.saveAll(overdue);
            log.info("[SCHEDULER] {} factures marquees OVERDUE", overdue.size());
        }
    }

    // ─── Utilitaires prives ───────────────────────────────────────────────────

    private Invoice getInvoiceSecure(Long agencyId, Long invoiceId) {
        return invoiceRepository.findByIdAndAgencyId(invoiceId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + invoiceId));
    }

    private String generateInvoiceNumber(Long agencyId) {
        int  year  = Year.now().getValue();
        long count = invoiceRepository.countByAgencyAndYear(agencyId, year) + 1;
        return String.format("FACT-%d-%05d", year, count);
    }

    private void addItemsToInvoice(Invoice invoice, List<InvoiceDto.ItemRequest> itemDtos) {
        for (int i = 0; i < itemDtos.size(); i++) {
            InvoiceDto.ItemRequest dto = itemDtos.get(i);
            if (dto.getPosition() == 0) dto.setPosition(i + 1);
            InvoiceItem item = invoiceMapper.toItemEntity(dto);
            item.setInvoice(invoice);
            invoice.getItems().add(item);
        }
    }

    private void notifyPaymentConfirmed(Invoice invoice) throws MessagingException {
        Map<String, Object> props = new HashMap<>();
        props.put("clientName",      invoice.getClient().getName());
        props.put("invoiceNumber",   invoice.getInvoiceNumber());
        props.put("paidAmount",      invoice.getPaidAmount().toPlainString());
        props.put("currency",        invoice.getCurrency());
        props.put("remainingAmount", invoice.getRemainingAmount().toPlainString());
        props.put("paidAt",          invoice.getPaidAt() != null ? invoice.getPaidAt().toString() : "");

        emailService.sendEmail(
                invoice.getClient().getEmail(),
                "Paiement confirme - Facture " + invoice.getInvoiceNumber(),
                EmailTemplateName.PAYMENT_CONFIRMED,
                props,
                from
        );
    }

    private void sendOverdueReminder(Invoice invoice) throws MessagingException {
        long daysOverdue = ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDate.now());
        String portalUrl = frontendUrl + "/portal/invoices/" + invoice.getAccessToken();

        Map<String, Object> props = new HashMap<>();
        props.put("clientName",    invoice.getClient().getName());
        props.put("invoiceNumber", invoice.getInvoiceNumber());
        props.put("totalAmount",   invoice.getTotalAmount().toPlainString());
        props.put("dueDate",       invoice.getDueDate().toString());
        props.put("daysOverdue",   daysOverdue);
        props.put("portalUrl",     portalUrl);

        emailService.sendEmail(
                invoice.getClient().getEmail(),
                "Rappel - Facture " + invoice.getInvoiceNumber() + " en retard de " + daysOverdue + " jour(s)",
                EmailTemplateName.INVOICE_REMINDER,
                props,
                from
        );
    }
}
