package com.atlas.backend.contract;

import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ContractMapper {

    public ContractDto.Response toResponse(Contract contract) {
        boolean expired = contract.getValidUntil() != null
                && LocalDate.now().isAfter(contract.getValidUntil());

        return ContractDto.Response.builder()
                .id(contract.getId())
                .contractNumber(contract.getContractNumber())
                .title(contract.getTitle())
                .content(contract.getContent())
                .status(contract.getStatus())
                .accessToken(contract.getAccessToken())
                .validUntil(contract.getValidUntil())
                .pdfUrl(contract.getPdfUrl())
                .sentAt(contract.getSentAt())
                .signedAt(contract.getSignedAt())
                .signatureHash(contract.getSignatureHash())
                .signerName(contract.getSignerName())
                .signerEmail(contract.getSignerEmail())
                .signerIpAddress(contract.getSignerIpAddress())
                .rejectionReason(contract.getRejectionReason())
                .clientId(contract.getClient().getId())
                .clientName(contract.getClient().getName())
                .quoteId(contract.getQuote() != null ? contract.getQuote().getId() : null)
                .quoteName(contract.getQuote() != null ? contract.getQuote().getQuoteNumber() : null)
                .createdById(contract.getCreatedBy() != null ? contract.getCreatedBy().getId() : null)
                .createdByName(contract.getCreatedBy() != null ? contract.getCreatedBy().fullName() : null)
                .expired(expired)
                .createdAt(contract.getCreatedAt())
                .lastModifiedDate(contract.getLastModifiedDate())
                .build();
    }

    public ContractDto.Summary toSummary(Contract contract) {
        return ContractDto.Summary.builder()
                .id(contract.getId())
                .contractNumber(contract.getContractNumber())
                .title(contract.getTitle())
                .clientName(contract.getClient().getName())
                .status(contract.getStatus())
                .signedAt(contract.getSignedAt())
                .createdAt(contract.getCreatedAt())
                .build();
    }
}
