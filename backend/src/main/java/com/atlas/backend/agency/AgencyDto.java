package com.atlas.backend.agency;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

public class AgencyDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotBlank(message = "Le nom de l'agence est obligatoire")
        private String name;

        @NotBlank(message = "Le sous-domaine est obligatoire")
        @Pattern(
                regexp = "^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$",
                message = "Sous-domaine invalide (lettres minuscules, chiffres et tirets uniquement)"
        )
        private String subdomain;

        @Email(message = "Email invalide")
        private String email;

        private String phoneNumber;
        private String whatsappNumber;
        private String website;
        private String addressLine;
        private String city;
        private String country;
        private String rccm;
        private String ifu;
        private String description;

        // Paramètres de facturation
        private String currency;        // XOF, XAF, EUR...
        private double taxRate;         // ex: 18.0
        private int    invoiceDueDays;  // ex: 30
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private String name;
        private String subdomain;
        private String logoUrl;
        private String email;
        private String phoneNumber;
        private String website;
        private String city;
        private String country;
        private String currency;
        private double taxRate;
        private int    invoiceDueDays;
        private Agency.AgencyPlan plan;
        private boolean active;
        private int     membersCount;
    }
}