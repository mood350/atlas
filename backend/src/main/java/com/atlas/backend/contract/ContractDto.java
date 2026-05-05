package com.atlas.backend.contract;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ContractDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {

        @NotBlank(message = "Le titre est obligatoire")
        private String title;

        private String content;

        private LocalDate validUntil;

        @NotNull(message = "Le client est obligatoire")
        private Long clientId;

        private Long quoteId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long   id;
        private String contractNumber;
        private String title;
        private String content;

        private Contract.ContractStatus status;
        private String  accessToken;
        private LocalDate   validUntil;
        private String  pdfUrl;
        private LocalDateTime sentAt;
        private LocalDateTime signedAt;
        private String  signatureHash;
        private String  signerName;
        private String  signerEmail;
        private String  signerIpAddress;
        private String  rejectionReason;

        private Long   clientId;
        private String clientName;
        private Long   quoteId;
        private String quoteName;
        private Long   createdById;
        private String createdByName;

        private boolean expired;
        private LocalDateTime createdAt;
        private LocalDateTime lastModifiedDate;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long   id;
        private String contractNumber;
        private String title;
        private String clientName;
        private Contract.ContractStatus status;
        private LocalDateTime signedAt;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SignRequest {

        @NotBlank(message = "Le nom du signataire est obligatoire")
        private String signerName;

        @NotBlank(message = "L'email du signataire est obligatoire")
        @Email(message = "Email invalide")
        private String signerEmail;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ContractStats {
        private long totalContracts;
        private long drafts;
        private long sent;
        private long signed;
        private long cancelled;
    }
}
