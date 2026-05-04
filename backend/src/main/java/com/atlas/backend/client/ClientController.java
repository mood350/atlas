package com.atlas.backend.client;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Tous les endpoints sont préfixés par /api/agencies/{agencyId}
 * L'isolation multi-tenant est garantie par ClientService.getClientSecure().
 */
@RestController
@RequestMapping("/api/agencies/{agencyId}/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    // POST /api/agencies/{agencyId}/clients
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ClientDto.Response> create(
            @PathVariable Long agencyId,
            @Valid @RequestBody ClientDto.Request dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.create(agencyId, dto));
    }

    // GET /api/agencies/{agencyId}/clients?page=0&size=20&sort=name,asc
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<ClientDto.Response>> findAll(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "name") String sortBy
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(clientService.findAll(agencyId, pageable));
    }

    // GET /api/agencies/{agencyId}/clients/search?q=acme
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<ClientDto.Response>> search(
            @PathVariable Long agencyId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(clientService.search(agencyId, q, pageable));
    }

    // GET /api/agencies/{agencyId}/clients/{clientId}
    @GetMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ClientDto.Response> findById(
            @PathVariable Long agencyId,
            @PathVariable Long clientId
    ) {
        return ResponseEntity.ok(clientService.findById(agencyId, clientId));
    }

    // PUT /api/agencies/{agencyId}/clients/{clientId}
    @PutMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<ClientDto.Response> update(
            @PathVariable Long agencyId,
            @PathVariable Long clientId,
            @Valid @RequestBody ClientDto.Request dto
    ) {
        return ResponseEntity.ok(clientService.update(agencyId, clientId, dto));
    }

    // PATCH /api/agencies/{agencyId}/clients/{clientId}/status
    @PatchMapping("/{clientId}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<ClientDto.Response> updateStatus(
            @PathVariable Long agencyId,
            @PathVariable Long clientId,
            @RequestParam Client.ClientStatus status
    ) {
        return ResponseEntity.ok(clientService.updateStatus(agencyId, clientId, status));
    }

    // DELETE /api/agencies/{agencyId}/clients/{clientId}
    @DeleteMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long agencyId,
            @PathVariable Long clientId
    ) {
        clientService.delete(agencyId, clientId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/agencies/{agencyId}/clients/stats
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<ClientService.ClientStats> getStats(@PathVariable Long agencyId) {
        return ResponseEntity.ok(clientService.getStats(agencyId));
    }
}