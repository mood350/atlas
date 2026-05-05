package com.atlas.backend.contract;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.client.Client;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class ContractPdfService {

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private static final DeviceRgb COLOR_PRIMARY   = new DeviceRgb(34, 97, 36);
    private static final DeviceRgb COLOR_SECONDARY = new DeviceRgb(240, 247, 240);
    private static final DeviceRgb COLOR_GRAY      = new DeviceRgb(100, 100, 100);
    private static final DeviceRgb COLOR_SIGN_BG   = new DeviceRgb(240, 255, 240);
    private static final DeviceRgb COLOR_WATERMARK = new DeviceRgb(210, 235, 210);

    public byte[] generateContractPdf(Contract contract) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter   writer  = new PdfWriter(out);
        PdfDocument pdfDoc  = new PdfDocument(writer);
        Document    document = new Document(pdfDoc, PageSize.A4);
        document.setMargins(40, 40, 50, 40);

        PdfFont fontRegular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont fontBold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        if (contract.isSigned()) {
            pdfDoc.addEventHandler(PdfDocumentEvent.END_PAGE,
                    new WatermarkHandler("SIGNE", fontBold));
        }

        addHeader(document, contract, contract.getAgency(), fontRegular, fontBold);
        document.add(new LineSeparator(new SolidLine(1f)).setMarginTop(8).setMarginBottom(8));
        addPartiesBlock(document, contract.getAgency(), contract.getClient(), fontRegular, fontBold);
        document.add(new Paragraph(" ").setMarginBottom(4));
        addContentBlock(document, contract, fontRegular, fontBold);

        if (contract.isSigned()) {
            document.add(new Paragraph(" ").setMarginBottom(8));
            addSignatureBlock(document, contract, fontRegular, fontBold);
        }

        document.add(new Paragraph(" ").setMarginBottom(4));
        addFooter(document, contract.getAgency(), fontRegular);

        document.close();

        log.info("[CONTRACT] PDF genere contractNumber='{}' taille={}o signed={}",
                contract.getContractNumber(), out.size(), contract.isSigned());

        return out.toByteArray();
    }

    private void addHeader(Document doc, Contract contract, Agency agency,
                           PdfFont regular, PdfFont bold) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell agencyCell = new Cell().setBorder(Border.NO_BORDER);
        agencyCell.add(new Paragraph(agency.getName())
                .setFont(bold).setFontSize(16).setFontColor(COLOR_PRIMARY));
        if (agency.getAddressLine() != null)
            agencyCell.add(new Paragraph(agency.getAddressLine())
                    .setFont(regular).setFontSize(9));
        if (agency.getCity() != null)
            agencyCell.add(new Paragraph(
                    agency.getCity() + (agency.getCountry() != null ? ", " + agency.getCountry() : ""))
                    .setFont(regular).setFontSize(9));
        if (agency.getPhoneNumber() != null)
            agencyCell.add(new Paragraph("Tel: " + agency.getPhoneNumber())
                    .setFont(regular).setFontSize(9));
        if (agency.getEmail() != null)
            agencyCell.add(new Paragraph(agency.getEmail())
                    .setFont(regular).setFontSize(9));
        if (agency.getRccm() != null)
            agencyCell.add(new Paragraph("RCCM: " + agency.getRccm())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));
        if (agency.getIfu() != null)
            agencyCell.add(new Paragraph("IFU: " + agency.getIfu())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));

        Cell titleCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);
        titleCell.add(new Paragraph("CONTRAT")
                .setFont(bold).setFontSize(22).setFontColor(COLOR_PRIMARY));
        titleCell.add(new Paragraph(contract.getContractNumber())
                .setFont(bold).setFontSize(13).setFontColor(COLOR_GRAY));
        if (contract.getCreatedAt() != null)
            titleCell.add(new Paragraph("Date: " + contract.getCreatedAt().format(DATE_FMT))
                    .setFont(regular).setFontSize(9));
        if (contract.getValidUntil() != null)
            titleCell.add(new Paragraph("Valable jusqu'au: " + contract.getValidUntil().format(DATE_FMT))
                    .setFont(bold).setFontSize(9).setFontColor(COLOR_PRIMARY));

        table.addCell(agencyCell);
        table.addCell(titleCell);
        doc.add(table);
    }

    private void addPartiesBlock(Document doc, Agency agency, Client client,
                                 PdfFont regular, PdfFont bold) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell agencyCell = new Cell().setBackgroundColor(COLOR_SECONDARY).setPadding(10)
                .setBorder(Border.NO_BORDER);
        agencyCell.add(new Paragraph("PARTIE 1 - PRESTATAIRE")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_GRAY));
        agencyCell.add(new Paragraph(agency.getName()).setFont(bold).setFontSize(11));
        if (agency.getAddressLine() != null)
            agencyCell.add(new Paragraph(agency.getAddressLine()).setFont(regular).setFontSize(9));
        if (agency.getCity() != null)
            agencyCell.add(new Paragraph(agency.getCity()).setFont(regular).setFontSize(9));
        if (agency.getRccm() != null)
            agencyCell.add(new Paragraph("RCCM: " + agency.getRccm())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));
        if (agency.getIfu() != null)
            agencyCell.add(new Paragraph("IFU: " + agency.getIfu())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));

        Cell clientCell = new Cell().setPadding(10).setBorder(Border.NO_BORDER);
        clientCell.add(new Paragraph("PARTIE 2 - CLIENT")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_GRAY));
        clientCell.add(new Paragraph(client.getName()).setFont(bold).setFontSize(11));
        if (client.getEmail() != null)
            clientCell.add(new Paragraph(client.getEmail()).setFont(regular).setFontSize(9));
        if (client.getPhoneNumber() != null)
            clientCell.add(new Paragraph(client.getPhoneNumber()).setFont(regular).setFontSize(9));
        if (client.getCity() != null)
            clientCell.add(new Paragraph(client.getCity()).setFont(regular).setFontSize(9));
        if (client.getIfu() != null)
            clientCell.add(new Paragraph("IFU: " + client.getIfu())
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));

        table.addCell(agencyCell);
        table.addCell(clientCell);
        doc.add(table);
    }

    private void addContentBlock(Document doc, Contract contract,
                                 PdfFont regular, PdfFont bold) {
        doc.add(new Paragraph(contract.getTitle())
                .setFont(bold).setFontSize(14).setFontColor(COLOR_PRIMARY)
                .setMarginBottom(8));

        if (contract.getContent() != null && !contract.getContent().isBlank()) {
            for (String para : contract.getContent().split("\n\n")) {
                doc.add(new Paragraph(para.trim())
                        .setFont(regular).setFontSize(10)
                        .setMarginBottom(6)
                        .setTextAlignment(TextAlignment.JUSTIFIED));
            }
        }
    }

    private void addSignatureBlock(Document doc, Contract contract,
                                   PdfFont regular, PdfFont bold) {
        doc.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(8));

        Cell sigCell = new Cell().setBackgroundColor(COLOR_SIGN_BG).setPadding(12)
                .setBorder(Border.NO_BORDER);
        sigCell.add(new Paragraph("SIGNATURE ELECTRONIQUE")
                .setFont(bold).setFontSize(10).setFontColor(COLOR_PRIMARY));
        sigCell.add(new Paragraph("Signe par: " + contract.getSignerName())
                .setFont(bold).setFontSize(9));
        sigCell.add(new Paragraph("Email: " + contract.getSignerEmail())
                .setFont(regular).setFontSize(9));
        sigCell.add(new Paragraph("Adresse IP: " + contract.getSignerIpAddress())
                .setFont(regular).setFontSize(9));
        if (contract.getSignedAt() != null)
            sigCell.add(new Paragraph("Date et heure: " + contract.getSignedAt().format(DATETIME_FMT))
                    .setFont(bold).setFontSize(9));
        if (contract.getSignatureHash() != null) {
            String shortHash = contract.getSignatureHash().length() > 16
                    ? contract.getSignatureHash().substring(0, 16) + "..."
                    : contract.getSignatureHash();
            sigCell.add(new Paragraph("Empreinte SHA-256: " + shortHash)
                    .setFont(regular).setFontSize(8).setFontColor(COLOR_GRAY));
        }

        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{100}))
                .setWidth(UnitValue.createPercentValue(100));
        sigTable.addCell(sigCell);
        doc.add(sigTable);
    }

    private void addFooter(Document doc, Agency agency, PdfFont regular) {
        doc.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(6));

        StringBuilder legal = new StringBuilder("Contrat genere par AgencyCRM.");
        if (agency.getRccm() != null) legal.append(" RCCM: ").append(agency.getRccm()).append(".");
        if (agency.getIfu() != null)  legal.append(" IFU: ").append(agency.getIfu()).append(".");
        legal.append(" Conformement au droit OHADA, tout litige sera soumis aux juridictions competentes.");

        doc.add(new Paragraph(legal.toString())
                .setFont(regular).setFontSize(7).setFontColor(COLOR_GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    private static class WatermarkHandler implements IEventHandler {

        private final String  text;
        private final PdfFont font;

        WatermarkHandler(String text, PdfFont font) {
            this.text = text;
            this.font = font;
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf  = docEvent.getDocument();
            PdfPage     page = docEvent.getPage();
            Rectangle   size = page.getPageSize();

            float angle = (float) Math.toRadians(45);
            float cos   = (float) Math.cos(angle);
            float sin   = (float) Math.sin(angle);
            float cx    = size.getWidth()  / 2;
            float cy    = size.getHeight() / 2;

            PdfCanvas pdfCanvas = new PdfCanvas(
                    page.newContentStreamBefore(), page.getResources(), pdf);
            pdfCanvas.saveState();
            pdfCanvas.concatMatrix(cos, sin, -sin, cos, cx, cy);

            Paragraph watermark = new Paragraph(text)
                    .setFont(font)
                    .setFontSize(80)
                    .setFontColor(COLOR_WATERMARK);

            Canvas canvas = new Canvas(pdfCanvas,
                    new Rectangle(-cx, -cy, size.getWidth(), size.getHeight()));
            canvas.showTextAligned(watermark, 0, 0, TextAlignment.CENTER, VerticalAlignment.MIDDLE);
            canvas.close();

            pdfCanvas.restoreState();
        }
    }
}
