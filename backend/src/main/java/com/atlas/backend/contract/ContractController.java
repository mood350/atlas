package com.atlas.backend.contract;

import jakarta.servlet.http.HttpServletRequest;
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

@RestController
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    // ════════════════════════════════════════════════════════════════
    //  AGENCE — /api/agencies/{agencyId}/contracts/**
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/api/agencies/{agencyId}/contracts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ContractDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody ContractDto.Request dto,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.create(agencyId, dto, currentUser));
    }

    @PostMapping("/api/agencies/{agencyId}/contracts/from-quote/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ContractDto.Response> convertFromQuote(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.convertFromQuote(agencyId, quoteId, currentUser));
    }

    @GetMapping("/api/agencies/{agencyId}/contracts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<ContractDto.Summary>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(required = false) Contract.ContractStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return ResponseEntity.ok(contractService.findByStatus(agencyId, status, pageable));
        }
        return ResponseEntity.ok(contractService.findAll(agencyId, pageable));
    }

    @GetMapping("/api/agencies/{agencyId}/contracts/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<ContractDto.ContractStats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(contractService.getStats(agencyId));
    }

    @GetMapping("/api/agencies/{agencyId}/contracts/{contractId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ContractDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long contractId
    ) {
        return ResponseEntity.ok(contractService.findById(agencyId, contractId));
    }

    @PutMapping("/api/agencies/{agencyId}/contracts/{contractId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ContractDto.Response> update(
            @PathVariable Long agencyId,
            @PathVariable Long contractId,
            @Valid @RequestBody ContractDto.Request dto
    ) throws IOException {
        return ResponseEntity.ok(contractService.update(agencyId, contractId, dto));
    }

    @PostMapping("/api/agencies/{agencyId}/contracts/{contractId}/send")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ContractDto.Response> send(
            @PathVariable Long agencyId,
            @PathVariable Long contractId
    ) throws Exception {
        return ResponseEntity.ok(contractService.send(agencyId, contractId));
    }

    @GetMapping("/api/agencies/{agencyId}/contracts/{contractId}/pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long agencyId,
            @PathVariable Long contractId
    ) throws IOException {
        byte[] pdf = contractService.getPdf(agencyId, contractId);
        ContractDto.Response contract = contractService.findById(agencyId, contractId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + contract.getContractNumber() + ".pdf\"")
                .body(pdf);
    }

    @DeleteMapping("/api/agencies/{agencyId}/contracts/{contractId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> cancel(
            @PathVariable Long agencyId,
            @PathVariable Long contractId,
            @RequestParam(required = false) String reason
    ) {
        contractService.cancel(agencyId, contractId, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/agencies/{agencyId}/contracts/{contractId}/verify")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Boolean> verifySignature(
            @PathVariable Long agencyId,
            @PathVariable Long contractId
    ) {
        return ResponseEntity.ok(contractService.verifySignatureIntegrity(agencyId, contractId));
    }

    // ════════════════════════════════════════════════════════════════
    //  PORTAIL CLIENT — /api/portal/contracts/**  (public, token UUID)
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/portal/contracts/{token}")
    public ResponseEntity<ContractDto.Response> viewContract(@PathVariable String token) {
        return ResponseEntity.ok(contractService.findByToken(token));
    }

    @PostMapping("/api/portal/contracts/{token}/sign")
    public ResponseEntity<ContractDto.Response> signContract(
            @PathVariable String token,
            @Valid @RequestBody ContractDto.SignRequest dto,
            HttpServletRequest request
    ) throws Exception {
        String ip        = resolveClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        return ResponseEntity.ok(contractService.sign(token, dto, ip, userAgent));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
