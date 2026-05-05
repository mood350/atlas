package com.atlas.backend.invoice;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.atlas.backend.user.User;

import java.io.IOException;
import java.math.BigDecimal;

@RestController
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // ════════════════════════════════════════════════════════════════
    //  AGENCE — /api/agencies/{agencyId}/invoices/**
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/invoices")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<InvoiceDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody InvoiceDto.Request dto,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.create(agencyId, dto, currentUser));
    }

    @PostMapping("/api/agencies/{agencyId}/invoices/from-contract/{contractId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<InvoiceDto.Response> generateFromContract(
            @PathVariable Long agencyId,
            @PathVariable Long contractId,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.generateFromContract(agencyId, contractId, currentUser));
    }

    @PostMapping("/api/agencies/{agencyId}/invoices/deposit/{contractId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<InvoiceDto.Response> generateDeposit(
            @PathVariable Long agencyId,
            @PathVariable Long contractId,
            @RequestParam BigDecimal percent,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.generateDepositInvoice(agencyId, contractId, percent, currentUser));
    }

    @GetMapping("/api/agencies/{agencyId}/invoices")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<InvoiceDto.Summary>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(required = false) Invoice.InvoiceStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return ResponseEntity.ok(invoiceService.findByStatus(agencyId, status, pageable));
        }
        return ResponseEntity.ok(invoiceService.findAll(agencyId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/invoices/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<InvoiceDto.InvoiceStats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(invoiceService.getStats(agencyId));
    }

    @GetMapping("/api/agencies/{agencyId}/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<InvoiceDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long invoiceId
    ) {
        return ResponseEntity.ok(invoiceService.findById(agencyId, invoiceId));
    }

    @PostMapping("/api/agencies/{agencyId}/invoices/{invoiceId}/send")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<InvoiceDto.Response> send(
            @PathVariable Long agencyId,
            @PathVariable Long invoiceId
    ) throws Exception {
        return ResponseEntity.ok(invoiceService.send(agencyId, invoiceId));
    }

    @PostMapping("/api/agencies/{agencyId}/invoices/{invoiceId}/record-payment")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<InvoiceDto.Response> recordPayment(
            @PathVariable Long agencyId,
            @PathVariable Long invoiceId,
            @Valid @RequestBody InvoiceDto.PaymentRequest dto
    ) throws Exception {
        return ResponseEntity.ok(invoiceService.recordPayment(
                agencyId, invoiceId, dto.getAmount(), dto.getTransactionId()));
    }

    @GetMapping("/api/agencies/{agencyId}/invoices/{invoiceId}/pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long agencyId,
            @PathVariable Long invoiceId
    ) throws IOException {
        byte[] pdf = invoiceService.getPdf(agencyId, invoiceId);
        InvoiceDto.Response invoice = invoiceService.findById(agencyId, invoiceId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                .body(pdf);
    }

    @DeleteMapping("/api/agencies/{agencyId}/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long invoiceId
    ) {
        invoiceService.delete(agencyId, invoiceId);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════════════
    //  PORTAIL CLIENT — /api/portal/invoices/**  (public, token UUID)
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/portal/invoices/{token}")
    public ResponseEntity<InvoiceDto.Response> viewInvoice(@PathVariable String token) {
        return ResponseEntity.ok(invoiceService.findByToken(token));
    }
}
