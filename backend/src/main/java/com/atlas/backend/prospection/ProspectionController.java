package com.atlas.backend.prospection;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
public class ProspectionController {

    private final ProspectionService prospectionService;

    @GetMapping("/api/agencies/{agencyId}/prospection/search")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProspectionDto.SearchResponse> search(
            @PathVariable Long agencyId,
            @RequestParam String query,
            @RequestParam(required = false) String location
    ) {
        return ResponseEntity.ok(prospectionService.search(query, location));
    }

    @PostMapping("/api/agencies/{agencyId}/prospection/export/xlsx")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<byte[]> exportXlsx(
            @PathVariable Long agencyId,
            @RequestBody ProspectionDto.ExportRequest request
    ) {
        byte[] xlsx = prospectionService.exportXlsx(request.getLeads());

        String filename = (request.getFilename() != null && !request.getFilename().isBlank())
                ? request.getFilename() + ".xlsx"
                : "prospection-" + LocalDate.now() + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build());

        return ResponseEntity.ok().headers(headers).body(xlsx);
    }

    @PostMapping("/api/agencies/{agencyId}/prospection/import")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ProspectionDto.ImportResponse> importLeads(
            @PathVariable Long agencyId,
            @RequestBody ProspectionDto.ImportRequest request
    ) {
        return ResponseEntity.ok(prospectionService.importLeads(agencyId, request.getLeads()));
    }
}
