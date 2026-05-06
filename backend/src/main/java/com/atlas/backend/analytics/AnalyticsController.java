package com.atlas.backend.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // ════════════════════════════════════════════════════════════════
    //  /api/agencies/{agencyId}/analytics/**
    // ════════════════════════════════════════════════════════════════

    /**
     * Dashboard complet : revenus, devis, deals, clients, projets.
     * ?days=30  (défaut) | 7 | 90 | 365
     */
    @GetMapping("/api/agencies/{agencyId}/analytics/dashboard")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<AnalyticsDto.Dashboard> getDashboard(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(analyticsService.getDashboard(agencyId, days));
    }

    /**
     * Métriques revenus seules (MRR, encaissé, en attente, CA mensuel).
     */
    @GetMapping("/api/agencies/{agencyId}/analytics/revenue")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<AnalyticsDto.RevenueMetrics> getRevenue(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "30") int days
    ) {
        LocalDateTime from = LocalDateTime.now().minusDays(days);
        return ResponseEntity.ok(analyticsService.revenueMetrics(agencyId, from));
    }

    /**
     * Export CSV de tous les KPIs sur la période sélectionnée.
     */
    @GetMapping("/api/agencies/{agencyId}/analytics/export")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "30") int days
    ) {
        byte[] csv = analyticsService.exportCsv(agencyId, days);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"analytics-" + days + "d.csv\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(csv);
    }
}
