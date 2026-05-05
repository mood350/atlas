package com.atlas.backend.quote;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class QuoteMapper {

    public QuoteDto.Response toResponse(Quote quote) {
        return QuoteDto.Response.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .clientId(quote.getClient().getId())
                .clientName(quote.getClient().getName())
                .clientEmail(quote.getClient().getEmail())
                .clientCity(quote.getClient().getCity())
                .dealId(quote.getDeal() != null ? quote.getDeal().getId() : null)
                .dealTitle(quote.getDeal() != null ? quote.getDeal().getTitle() : null)
                .createdById(quote.getCreatedBy() != null ? quote.getCreatedBy().getId() : null)
                .createdByName(quote.getCreatedBy() != null ? quote.getCreatedBy().fullName() : null)
                .title(quote.getTitle())
                .description(quote.getDescription())
                .items(toItemResponseList(quote.getItems()))
                .subtotal(quote.getSubtotal())
                .discountPercent(quote.getDiscountPercent())
                .discountAmount(quote.getDiscountAmount())
                .taxableAmount(quote.getTaxableAmount())
                .taxRate(quote.getTaxRate())
                .taxAmount(quote.getTaxAmount())
                .totalAmount(quote.getTotalAmount())
                .currency(quote.getCurrency())
                .validUntil(quote.getValidUntil())
                .paymentTerms(quote.getPaymentTerms())
                .clientNotes(quote.getClientNotes())
                .status(quote.getStatus())
                .sentAt(quote.getSentAt())
                .viewedAt(quote.getViewedAt())
                .respondedAt(quote.getRespondedAt())
                .rejectionReason(quote.getRejectionReason())
                .pdfUrl(quote.getPdfUrl())
                .expired(quote.isExpired())
                .createdAt(quote.getCreatedAt())
                .lastModifiedDate(quote.getLastModifiedDate())
                .build();
    }

    public QuoteDto.Summary toSummary(Quote quote) {
        return QuoteDto.Summary.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .title(quote.getTitle())
                .clientName(quote.getClient().getName())
                .totalAmount(quote.getTotalAmount())
                .currency(quote.getCurrency())
                .status(quote.getStatus())
                .validUntil(quote.getValidUntil())
                .expired(quote.isExpired())
                .createdAt(quote.getCreatedAt())
                .build();
    }

    public QuoteDto.ItemResponse toItemResponse(QuoteItem item) {
        return QuoteDto.ItemResponse.builder()
                .id(item.getId())
                .position(item.getPosition())
                .designation(item.getDesignation())
                .description(item.getDescription())
                .type(item.getType())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .unitPrice(item.getUnitPrice())
                .discountPercent(item.getDiscountPercent())
                .discountAmount(item.getDiscountAmount())
                .lineTotal(item.getLineTotal())
                .build();
    }

    public List<QuoteDto.ItemResponse> toItemResponseList(List<QuoteItem> items) {
        return items.stream().map(this::toItemResponse).toList();
    }

    public QuoteItem toItemEntity(QuoteDto.ItemRequest dto) {
        QuoteItem item = QuoteItem.builder()
                .designation(dto.getDesignation())
                .description(dto.getDescription())
                .type(dto.getType() != null ? dto.getType() : QuoteItem.ItemType.SERVICE)
                .quantity(dto.getQuantity())
                .unit(dto.getUnit() != null ? dto.getUnit() : "Forfait")
                .unitPrice(dto.getUnitPrice())
                .discountPercent(dto.getDiscountPercent())
                .position(dto.getPosition())
                .build();
        item.calculateLineTotal();
        return item;
    }
}