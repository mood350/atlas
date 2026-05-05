package com.atlas.backend.quote;

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
public class QuoteController {

    private final QuoteService quoteService;

    // ════════════════════════════════════════════════════════════════
    //  AGENCE — /api/agencies/{agencyId}/quotes/**
    // ════════════════════════════════════════════════════════════════

    // POST /api/agencies/{agencyId}/quotes
    @PostMapping("/api/agencies/{agencyId}/quotes")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<QuoteDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody QuoteDto.Request dto,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quoteService.create(agencyId, dto, currentUser));
    }

    // GET /api/agencies/{agencyId}/quotes
    @GetMapping("/api/agencies/{agencyId}/quotes")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<QuoteDto.Summary>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(required = false) Quote.QuoteStatus status,
            @RequestParam(defaultValue = "0")          int page,
            @RequestParam(defaultValue = "20")         int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return ResponseEntity.ok(quoteService.findByStatus(agencyId, status, pageable));
        }
        return ResponseEntity.ok(quoteService.findAll(agencyId, pageable));
    }

    // GET /api/agencies/{agencyId}/quotes/{quoteId}
    @GetMapping("/api/agencies/{agencyId}/quotes/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<QuoteDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId
    ) {
        return ResponseEntity.ok(quoteService.findById(agencyId, quoteId));
    }

    // PUT /api/agencies/{agencyId}/quotes/{quoteId}
    @PutMapping("/api/agencies/{agencyId}/quotes/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<QuoteDto.Response> update(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId,
            @Valid @RequestBody QuoteDto.Request dto
    ) throws IOException {
        return ResponseEntity.ok(quoteService.update(agencyId, quoteId, dto));
    }

    // POST /api/agencies/{agencyId}/quotes/{quoteId}/send
    @PostMapping("/api/agencies/{agencyId}/quotes/{quoteId}/send")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<QuoteDto.Response> send(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId
    ) throws Exception {
        return ResponseEntity.ok(quoteService.send(agencyId, quoteId));
    }

    // GET /api/agencies/{agencyId}/quotes/{quoteId}/pdf
    @GetMapping("/api/agencies/{agencyId}/quotes/{quoteId}/pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId
    ) throws IOException {
        byte[] pdf = quoteService.regeneratePdf(agencyId, quoteId);
        QuoteDto.Response quote = quoteService.findById(agencyId, quoteId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + quote.getQuoteNumber() + ".pdf\"")
                .body(pdf);
    }

    // DELETE /api/agencies/{agencyId}/quotes/{quoteId}
    @DeleteMapping("/api/agencies/{agencyId}/quotes/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long quoteId
    ) {
        quoteService.delete(agencyId, quoteId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/agencies/{agencyId}/quotes/stats
    @GetMapping("/api/agencies/{agencyId}/quotes/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<QuoteDto.Stats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(quoteService.getStats(agencyId));
    }

    // ════════════════════════════════════════════════════════════════
    //  PORTAIL CLIENT — /api/portal/quotes/**  (sans authentification)
    // ════════════════════════════════════════════════════════════════

    // GET /api/portal/quotes/{token}
    @GetMapping("/api/portal/quotes/{token}")
    public ResponseEntity<QuoteDto.Response> viewQuote(@PathVariable String token) {
        return ResponseEntity.ok(quoteService.markAsViewed(token));
    }

    // POST /api/portal/quotes/{token}/accept
    @PostMapping("/api/portal/quotes/{token}/accept")
    public ResponseEntity<QuoteDto.Response> acceptQuote(@PathVariable String token)
            throws Exception {
        return ResponseEntity.ok(quoteService.accept(token));
    }

    // POST /api/portal/quotes/{token}/reject
    @PostMapping("/api/portal/quotes/{token}/reject")
    public ResponseEntity<QuoteDto.Response> rejectQuote(
            @PathVariable String token,
            @RequestBody QuoteDto.RejectRequest request
    ) throws Exception {
        return ResponseEntity.ok(quoteService.reject(token, request.getReason()));
    }
}