package com.atlas.backend.invoice;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InvoiceMapper {

    public InvoiceDto.Response toResponse(Invoice invoice) {
        return InvoiceDto.Response.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .title(invoice.getTitle())
                .clientId(invoice.getClient().getId())
                .clientName(invoice.getClient().getName())
                .contractId(invoice.getContract() != null ? invoice.getContract().getId() : null)
                .contractNumber(invoice.getContract() != null ? invoice.getContract().getContractNumber() : null)
                .quoteId(invoice.getQuote() != null ? invoice.getQuote().getId() : null)
                .quoteNumber(invoice.getQuote() != null ? invoice.getQuote().getQuoteNumber() : null)
                .createdById(invoice.getCreatedBy() != null ? invoice.getCreatedBy().getId() : null)
                .createdByName(invoice.getCreatedBy() != null ? invoice.getCreatedBy().fullName() : null)
                .type(invoice.getType())
                .depositPercent(invoice.getDepositPercent())
                .items(toItemResponseList(invoice.getItems()))
                .subtotal(invoice.getSubtotal())
                .discountPercent(invoice.getDiscountPercent())
                .discountAmount(invoice.getDiscountAmount())
                .taxableAmount(invoice.getTaxableAmount())
                .taxRate(invoice.getTaxRate())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .currency(invoice.getCurrency())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .paidAmount(invoice.getPaidAmount())
                .remainingAmount(invoice.getRemainingAmount())
                .paidAt(invoice.getPaidAt())
                .sentAt(invoice.getSentAt())
                .pdfUrl(invoice.getPdfUrl())
                .createdAt(invoice.getCreatedAt())
                .lastModifiedDate(invoice.getLastModifiedDate())
                .build();
    }

    public InvoiceDto.Summary toSummary(Invoice invoice) {
        return InvoiceDto.Summary.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .clientName(invoice.getClient().getName())
                .totalAmount(invoice.getTotalAmount())
                .paidAmount(invoice.getPaidAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus())
                .type(invoice.getType())
                .dueDate(invoice.getDueDate())
                .createdAt(invoice.getCreatedAt())
                .build();
    }

    public InvoiceDto.ItemResponse toItemResponse(InvoiceItem item) {
        return InvoiceDto.ItemResponse.builder()
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

    public List<InvoiceDto.ItemResponse> toItemResponseList(List<InvoiceItem> items) {
        return items.stream().map(this::toItemResponse).toList();
    }

    public InvoiceItem toItemEntity(InvoiceDto.ItemRequest dto) {
        InvoiceItem item = InvoiceItem.builder()
                .designation(dto.getDesignation())
                .description(dto.getDescription())
                .type(dto.getType() != null ? dto.getType() : InvoiceItem.ItemType.SERVICE)
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
