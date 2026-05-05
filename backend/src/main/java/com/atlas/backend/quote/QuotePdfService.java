package com.atlas.backend.quote;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
public class QuotePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final DeviceRgb COLOR_PRIMARY     = new DeviceRgb(34, 97, 36);
    private static final DeviceRgb COLOR_SECONDARY   = new DeviceRgb(240, 247, 240);
    private static final DeviceRgb COLOR_GRAND_TOTAL = new DeviceRgb(34, 97, 36);
    private static final DeviceRgb COLOR_GRAY        = new DeviceRgb(100, 100, 100);

    public byte[] generateQuotePdf(Quote quote) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter writer   = new PdfWriter(out);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document  = new Document(pdfDoc, PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        PdfFont fontRegular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont fontBold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        addHeader(document, quote, quote.getAgency(), fontRegular, fontBold);
        document.add(new LineSeparator(new SolidLine(1f)).setMarginTop(8).setMarginBottom(8));
        addClientBlock(document, quote, quote.getClient(), fontRegular, fontBold);
        document.add(new Paragraph(" ").setMarginBottom(4));
        addItemsTable(document, quote.getItems(), quote.getCurrency(), fontRegular, fontBold);
        document.add(new Paragraph(" ").setMarginBottom(4));
        addTotalsBlock(document, quote, fontRegular, fontBold);
        document.add(new Paragraph(" ").setMarginBottom(8));
        addFooter(document, quote, quote.getAgency(), fontRegular, fontBold);

        document.close();

        log.info("[PDF] Devis genere quoteNumber='{}' taille={}o",
                quote.getQuoteNumber(), out.size());

        return out.toByteArray();
    }

    private void addHeader(Document doc, Quote quote, Agency agency,
                           PdfFont regular, PdfFont bold) throws IOException {

        Table table = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell agencyCell = new Cell().setBorder(Border.NO_BORDER);
        agencyCell.add(new Paragraph(agency.getName())
                .setFont(bold).setFontSize(16).setFontColor(COLOR_PRIMARY));
        if (agency.getAddressLine() != null)
            agencyCell.add(new Paragraph(agency.getAddressLine()).setFont(regular).setFontSize(9));
        if (agency.getCity() != null)
            agencyCell.add(new Paragraph(
                    agency.getCity() + (agency.getCountry() != null ? ", " + agency.getCountry() : ""))
                    .setFont(regular).setFontSize(9));
        if (agency.getPhoneNumber() != null)
            agencyCell.add(new Paragraph("Tel: " + agency.getPhoneNumber())
                    .setFont(regular).setFontSize(9));
        if (agency.getEmail() != null)
            agencyCell.add(new Paragraph(agency.getEmail()).setFont(regular).setFontSize(9));
        if (agency.getRccm() != null)
            agencyCell.add(new Paragraph("RCCM: " + agency.getRccm())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));
        if (agency.getIfu() != null)
            agencyCell.add(new Paragraph("IFU: " + agency.getIfu())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));

        Cell titleCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);
        titleCell.add(new Paragraph("DEVIS")
                .setFont(bold).setFontSize(22).setFontColor(COLOR_PRIMARY));
        titleCell.add(new Paragraph(quote.getQuoteNumber())
                .setFont(bold).setFontSize(13).setFontColor(COLOR_GRAY));
        if (quote.getCreatedAt() != null)
            titleCell.add(new Paragraph("Date: " + quote.getCreatedAt().format(DATE_FMT))
                    .setFont(regular).setFontSize(9));
        if (quote.getValidUntil() != null) {
            DeviceRgb validColor = quote.isExpired() ? new DeviceRgb(200, 0, 0) : COLOR_PRIMARY;
            titleCell.add(new Paragraph("Valable jusqu'au: " + quote.getValidUntil().format(DATE_FMT))
                    .setFont(bold).setFontSize(9).setFontColor(validColor));
        }

        table.addCell(agencyCell);
        table.addCell(titleCell);
        doc.add(table);
    }

    private void addClientBlock(Document doc, Quote quote, Client client,
                                PdfFont regular, PdfFont bold) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell billTo = new Cell().setBackgroundColor(COLOR_SECONDARY).setPadding(10)
                .setBorder(Border.NO_BORDER);
        billTo.add(new Paragraph("FACTURE A")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_GRAY));
        billTo.add(new Paragraph(client.getName()).setFont(bold).setFontSize(11));
        if (client.getContactFirstName() != null)
            billTo.add(new Paragraph("A l'attention de: " + client.fullContactName())
                    .setFont(regular).setFontSize(9));
        if (client.getEmail() != null)
            billTo.add(new Paragraph(client.getEmail()).setFont(regular).setFontSize(9));
        if (client.getPhoneNumber() != null)
            billTo.add(new Paragraph(client.getPhoneNumber()).setFont(regular).setFontSize(9));
        if (client.getCity() != null)
            billTo.add(new Paragraph(client.getCity()).setFont(regular).setFontSize(9));
        if (client.getIfu() != null)
            billTo.add(new Paragraph("IFU: " + client.getIfu())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));

        Cell subjectCell = new Cell().setPadding(10).setBorder(Border.NO_BORDER);
        subjectCell.add(new Paragraph("OBJET")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_GRAY));
        subjectCell.add(new Paragraph(quote.getTitle()).setFont(bold).setFontSize(11));
        if (quote.getDescription() != null)
            subjectCell.add(new Paragraph(quote.getDescription())
                    .setFont(regular).setFontSize(9).setFontColor(COLOR_GRAY));

        table.addCell(billTo);
        table.addCell(subjectCell);
        doc.add(table);
    }

    private void addItemsTable(Document doc, List<QuoteItem> items,
                               String currency, PdfFont regular, PdfFont bold) {
        float[] cols = {4, 36, 7, 9, 14, 10, 14};
        Table table = new Table(UnitValue.createPercentArray(cols))
                .setWidth(UnitValue.createPercentValue(100));

        String[] headers = {"#", "Designation", "Qte", "Unite", "PU HT", "Remise", "Total HT"};
        for (String h : headers) {
            table.addHeaderCell(
                    new Cell().setBackgroundColor(COLOR_PRIMARY)
                            .add(new Paragraph(h).setFont(bold).setFontSize(9)
                                    .setFontColor(ColorConstants.WHITE))
                            .setPadding(6)
                            .setTextAlignment(h.equals("Designation") ? TextAlignment.LEFT : TextAlignment.RIGHT)
            );
        }

        boolean even = false;
        for (QuoteItem item : items) {
            addItemRow(table, item, currency, regular, bold, even ? COLOR_SECONDARY : null);
            even = !even;
        }

        doc.add(table);
    }

    private void addItemRow(Table table, QuoteItem item, String currency,
                            PdfFont regular, PdfFont bold, DeviceRgb bg) {
        Cell posCell = numCell(String.valueOf(item.getPosition()), regular, bg);

        Cell desCell = new Cell().setPadding(5);
        desCell.add(new Paragraph(item.getDesignation()).setFont(bold).setFontSize(9));
        if (item.getDescription() != null && !item.getDescription().isBlank())
            desCell.add(new Paragraph(item.getDescription())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));
        if (bg != null) desCell.setBackgroundColor(bg);

        String disc = item.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0
                ? item.getDiscountPercent().toPlainString() + "%" : "-";

        table.addCell(posCell)
                .addCell(desCell)
                .addCell(numCell(item.getQuantity().toPlainString(), regular, bg))
                .addCell(numCell(item.getUnit(), regular, bg))
                .addCell(numCell(fmt(item.getUnitPrice(), currency), regular, bg))
                .addCell(numCell(disc, regular, bg))
                .addCell(numCell(fmt(item.getLineTotal(), currency), bold, bg));
    }

    private Cell numCell(String text, PdfFont font, DeviceRgb bg) {
        Cell c = new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(9))
                .setPadding(5)
                .setTextAlignment(TextAlignment.RIGHT);
        if (bg != null) c.setBackgroundColor(bg);
        return c;
    }

    private void addTotalsBlock(Document doc, Quote quote, PdfFont regular, PdfFont bold) {
        Table outer = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100));

        outer.addCell(new Cell().setBorder(Border.NO_BORDER));

        Table inner = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .setWidth(UnitValue.createPercentValue(100));

        addTotalRow(inner, "Sous-total HT", fmt(quote.getSubtotal(), quote.getCurrency()), regular, null, false);

        if (quote.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(inner,
                    "Remise (" + quote.getDiscountPercent().toPlainString() + "%)",
                    "- " + fmt(quote.getDiscountAmount(), quote.getCurrency()),
                    regular, null, false);
        }

        if (quote.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(inner, "Base imposable",
                    fmt(quote.getTaxableAmount(), quote.getCurrency()), regular, COLOR_SECONDARY, false);
        }

        addTotalRow(inner,
                "TVA (" + quote.getTaxRate().toPlainString() + "%)",
                fmt(quote.getTaxAmount(), quote.getCurrency()), regular, null, false);

        addTotalRow(inner, "TOTAL TTC",
                fmt(quote.getTotalAmount(), quote.getCurrency()), bold, COLOR_GRAND_TOTAL, true);

        outer.addCell(new Cell().setBorder(Border.NO_BORDER).add(inner));
        doc.add(outer);
    }

    private void addTotalRow(Table table, String label, String value,
                             PdfFont font, DeviceRgb bg, boolean isGrandTotal) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(9))
                .setPadding(5).setTextAlignment(TextAlignment.LEFT);
        Cell valueCell = new Cell()
                .add(new Paragraph(value).setFont(font).setFontSize(9))
                .setPadding(5).setTextAlignment(TextAlignment.RIGHT);

        if (bg != null) {
            labelCell.setBackgroundColor(bg);
            valueCell.setBackgroundColor(bg);
        }
        if (isGrandTotal) {
            labelCell.setFontColor(ColorConstants.WHITE);
            valueCell.setFontColor(ColorConstants.WHITE);
        }

        table.addCell(labelCell).addCell(valueCell);
    }

    private void addFooter(Document doc, Quote quote, Agency agency,
                           PdfFont regular, PdfFont bold) {
        doc.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(6));

        if (quote.getPaymentTerms() != null && !quote.getPaymentTerms().isBlank()) {
            doc.add(new Paragraph("Conditions de paiement")
                    .setFont(bold).setFontSize(9).setFontColor(COLOR_PRIMARY));
            doc.add(new Paragraph(quote.getPaymentTerms())
                    .setFont(regular).setFontSize(9).setMarginBottom(6));
        }

        if (quote.getClientNotes() != null && !quote.getClientNotes().isBlank()) {
            doc.add(new Paragraph("Notes")
                    .setFont(bold).setFontSize(9).setFontColor(COLOR_PRIMARY));
            doc.add(new Paragraph(quote.getClientNotes())
                    .setFont(regular).setFontSize(9).setMarginBottom(6));
        }

        StringBuilder legal = new StringBuilder("Document genere par AgencyCRM.");
        if (agency.getRccm() != null) legal.append(" RCCM: ").append(agency.getRccm()).append(".");
        if (agency.getIfu() != null)  legal.append(" IFU: ").append(agency.getIfu()).append(".");
        legal.append(" Devis valable jusqu'au ")
                .append(quote.getValidUntil() != null ? quote.getValidUntil().format(DATE_FMT) : "N/A")
                .append(". Conformement au droit OHADA, tout litige sera soumis aux juridictions competentes.");

        doc.add(new Paragraph(legal.toString())
                .setFont(regular).setFontSize(7).setFontColor(COLOR_GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    private String fmt(BigDecimal amount, String currency) {
        if (amount == null) return "0 " + currency;
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.FRANCE);
        nf.setMinimumFractionDigits(0);
        nf.setMaximumFractionDigits(0);
        return nf.format(amount) + " " + currency;
    }
}