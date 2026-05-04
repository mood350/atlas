package com.atlas.backend.client;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AgencyRepository agencyRepository;
    private final ClientMapper     clientMapper;

    // ─── Créer un client ─────────────────────────────────────────────────────

    @Transactional
    public ClientDto.Response create(Long agencyId, ClientDto.Request dto) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable : " + agencyId));

        Client client = clientMapper.toEntity(dto);
        client.setAgency(agency);

        Client saved = clientRepository.save(client);
        log.info("[CRM] Client créé — agence={} client={} name='{}'",
                agencyId, saved.getId(), saved.getName());

        return clientMapper.toResponse(saved);
    }

    // ─── Lister les clients d'une agence (paginé) ────────────────────────────

    @Transactional(readOnly = true)
    public Page<ClientDto.Response> findAll(Long agencyId, Pageable pageable) {
        return clientRepository.findAllByAgencyId(agencyId, pageable)
                .map(clientMapper::toResponse);
    }

    // ─── Recherche textuelle ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ClientDto.Response> search(Long agencyId, String query, Pageable pageable) {
        return clientRepository.search(agencyId, query, pageable)
                .map(clientMapper::toResponse);
    }

    // ─── Récupérer un client par ID ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClientDto.Response findById(Long agencyId, Long clientId) {
        Client client = getClientSecure(agencyId, clientId);
        return clientMapper.toResponse(client);
    }

    // ─── Modifier un client ──────────────────────────────────────────────────

    @Transactional
    public ClientDto.Response update(Long agencyId, Long clientId, ClientDto.Request dto) {
        Client client = getClientSecure(agencyId, clientId);
        clientMapper.updateEntity(client, dto);
        return clientMapper.toResponse(clientRepository.save(client));
    }

    // ─── Changer le statut ───────────────────────────────────────────────────

    @Transactional
    public ClientDto.Response updateStatus(Long agencyId, Long clientId, Client.ClientStatus newStatus) {
        Client client = getClientSecure(agencyId, clientId);
        client.setStatus(newStatus);
        log.info("[CRM] Statut client modifié — client={} status={}", clientId, newStatus);
        return clientMapper.toResponse(clientRepository.save(client));
    }

    // ─── Supprimer un client ─────────────────────────────────────────────────

    @Transactional
    public void delete(Long agencyId, Long clientId) {
        Client client = getClientSecure(agencyId, clientId);
        clientRepository.delete(client);
        log.info("[CRM] Client supprimé — agence={} client={}", agencyId, clientId);
    }

    // ─── Statistiques rapides ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClientStats getStats(Long agencyId) {
        return ClientStats.builder()
                .total(clientRepository.countByAgencyId(agencyId))
                .active(clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.ACTIVE))
                .prospects(clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.PROSPECT))
                .inactive(clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.INACTIVE))
                .build();
    }

    // ─── Méthode utilitaire sécurisée (vérifie appartenance à l'agence) ──────

    public Client getClientSecure(Long agencyId, Long clientId) {
        return clientRepository.findByIdAndAgencyId(clientId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client introuvable ou accès non autorisé : " + clientId));
    }

    // ─── DTO stats ────────────────────────────────────────────────────────────

    @lombok.Value
    @lombok.Builder
    public static class ClientStats {
        long total;
        long active;
        long prospects;
        long inactive;
    }
}