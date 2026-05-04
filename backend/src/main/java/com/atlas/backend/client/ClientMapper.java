package com.atlas.backend.client;

import org.springframework.stereotype.Component;

@Component
public class ClientMapper {

    public Client toEntity(ClientDto.Request dto) {
        return Client.builder()
                .name(dto.getName())
                .contactFirstName(dto.getContactFirstName())
                .contactLastName(dto.getContactLastName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .whatsappNumber(dto.getWhatsappNumber())
                .type(dto.getType())
                .country(dto.getCountry())
                .city(dto.getCity())
                .rccm(dto.getRccm())
                .ifu(dto.getIfu())
                .industry(dto.getIndustry())
                .leadSource(dto.getLeadSource())
                .notes(dto.getNotes())
                .build();
    }

    public ClientDto.Response toResponse(Client client) {
        return ClientDto.Response.builder()
                .id(client.getId())
                .name(client.getName())
                .contactFirstName(client.getContactFirstName())
                .contactLastName(client.getContactLastName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .whatsappNumber(client.getWhatsappNumber())
                .type(client.getType())
                .status(client.getStatus())
                .country(client.getCountry())
                .city(client.getCity())
                .industry(client.getIndustry())
                .leadSource(client.getLeadSource())
                .notes(client.getNotes())
                .dealsCount(client.getDeals() != null ? client.getDeals().size() : 0)
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getLastModifiedDate())
                .build();
    }

    public ClientDto.Summary toSummary(Client client) {
        return ClientDto.Summary.builder()
                .id(client.getId())
                .name(client.getName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .type(client.getType())
                .status(client.getStatus())
                .city(client.getCity())
                .build();
    }

    public void updateEntity(Client client, ClientDto.Request dto) {
        client.setName(dto.getName());
        client.setContactFirstName(dto.getContactFirstName());
        client.setContactLastName(dto.getContactLastName());
        client.setEmail(dto.getEmail());
        client.setPhoneNumber(dto.getPhoneNumber());
        client.setWhatsappNumber(dto.getWhatsappNumber());
        client.setType(dto.getType());
        client.setCountry(dto.getCountry());
        client.setCity(dto.getCity());
        client.setRccm(dto.getRccm());
        client.setIfu(dto.getIfu());
        client.setIndustry(dto.getIndustry());
        client.setLeadSource(dto.getLeadSource());
        client.setNotes(dto.getNotes());
    }
}