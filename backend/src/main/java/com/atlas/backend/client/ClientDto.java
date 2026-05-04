package com.atlas.backend.client;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

public class ClientDto {

    // ──────────────────────────────────────────────────────────────────────────
    //  REQUEST — création / mise à jour
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotBlank(message = "Le nom du client est obligatoire")
        private String name;

        private String contactFirstName;
        private String contactLastName;

        @Email(message = "Email invalide")
        private String email;

        private String phoneNumber;
        private String whatsappNumber;

        @NotNull(message = "Le type de client est obligatoire")
        private Client.ClientType type;

        private String country;
        private String city;
        private String rccm;
        private String ifu;
        private String industry;
        private Client.LeadSource leadSource;

        @lombok.Builder.Default
        private String notes = "";
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  RESPONSE — retourné à l'API
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private String name;
        private String contactFirstName;
        private String contactLastName;
        private String email;
        private String phoneNumber;
        private String whatsappNumber;
        private Client.ClientType   type;
        private Client.ClientStatus status;
        private String country;
        private String city;
        private String industry;
        private Client.LeadSource leadSource;
        private String notes;
        private int    dealsCount;       // Nombre de deals liés
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  SUMMARY — liste compacte (Kanban, autocomplete)
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long   id;
        private String name;
        private String email;
        private String phoneNumber;
        private Client.ClientType   type;
        private Client.ClientStatus status;
        private String city;
    }
}