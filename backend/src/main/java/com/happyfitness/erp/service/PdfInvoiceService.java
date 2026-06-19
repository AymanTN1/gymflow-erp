package com.happyfitness.erp.service;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PdfInvoiceService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DeviceRgb GOLD = new DeviceRgb(255, 204, 0);
    private static final DeviceRgb DARK = new DeviceRgb(26, 26, 26);
    private static final DeviceRgb GRAY = new DeviceRgb(100, 100, 100);

    public byte[] generateInvoicePdf(Client client, Membership membership) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(40, 40, 40, 40);

            PdfFont font = PdfFontFactory.createFont();
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");

            // ====== HEADER ======
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();

            // Left: Company info
            Cell leftCell = new Cell().setBorder(Border.NO_BORDER);
            leftCell.add(new Paragraph("GymFlow").setFont(boldFont).setFontSize(28).setFontColor(DARK));
            leftCell.add(new Paragraph("123 Avenue du Sport, Casablanca").setFont(font).setFontSize(9).setFontColor(GRAY));
            leftCell.add(new Paragraph("Tél : 05 22 00 00 00").setFont(font).setFontSize(9).setFontColor(GRAY));
            headerTable.addCell(leftCell);

            // Right: Invoice info
            Cell rightCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
            rightCell.add(new Paragraph("FACTURE").setFont(boldFont).setFontSize(22).setFontColor(DARK));
            rightCell.add(new Paragraph("N° : FAC-" + membership.getId() + "-" + LocalDateTime.now().getYear())
                    .setFont(font).setFontSize(10));
            rightCell.add(new Paragraph("Date : " + LocalDateTime.now().format(DATE_FMT))
                    .setFont(font).setFontSize(10));
            headerTable.addCell(rightCell);

            doc.add(headerTable);

            // Separator line
            doc.add(new Paragraph("").setBorderBottom(new SolidBorder(DARK, 2)).setMarginBottom(20).setMarginTop(10));

            // ====== CLIENT INFO ======
            doc.add(new Paragraph("Facturé à :").setFont(boldFont).setFontSize(12).setFontColor(DARK)
                    .setBorderBottom(new SolidBorder(new DeviceRgb(200, 200, 200), 1)).setPaddingBottom(5));
            doc.add(new Paragraph(client.getNomComplet()).setFont(boldFont).setFontSize(16).setMarginTop(8));
            doc.add(new Paragraph("Téléphone : " + (client.getTelephone() != null ? client.getTelephone() : "N/A")).setFont(font).setFontSize(10).setFontColor(GRAY));
            if (client.getCin() != null && !client.getCin().isEmpty()) {
                doc.add(new Paragraph("CIN : " + client.getCin()).setFont(font).setFontSize(10).setFontColor(GRAY));
            }
            if (client.getEmail() != null && !client.getEmail().isEmpty()) {
                doc.add(new Paragraph("Email : " + client.getEmail()).setFont(font).setFontSize(10).setFontColor(GRAY));
            }

            doc.add(new Paragraph("").setMarginBottom(20));

            // ====== ITEMS TABLE ======
            Table itemTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2})).useAllAvailableWidth();

            // Header row
            Cell descHeader = new Cell().setBackgroundColor(DARK).setPadding(10);
            descHeader.add(new Paragraph("Description").setFont(boldFont).setFontSize(11).setFontColor(ColorConstants.WHITE));
            itemTable.addHeaderCell(descHeader);

            Cell dateHeader = new Cell().setBackgroundColor(DARK).setPadding(10);
            dateHeader.add(new Paragraph("Date d'Expiration").setFont(boldFont).setFontSize(11).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER));
            itemTable.addHeaderCell(dateHeader);

            Cell totalHeader = new Cell().setBackgroundColor(DARK).setPadding(10);
            totalHeader.add(new Paragraph("Montant (TTC)").setFont(boldFont).setFontSize(11).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.RIGHT));
            itemTable.addHeaderCell(totalHeader);

            // Data row
            itemTable.addCell(new Cell().setPadding(12).add(
                    new Paragraph("Abonnement Fitness - " + membership.getTypeAbonnement()).setFont(font).setFontSize(11)));
            itemTable.addCell(new Cell().setPadding(12).add(
                    new Paragraph(membership.getDateFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFont(font).setFontSize(11).setTextAlignment(TextAlignment.CENTER)));
            itemTable.addCell(new Cell().setPadding(12).add(
                    new Paragraph(String.format("%.2f DH", membership.getPrixPaye())).setFont(boldFont).setFontSize(13).setTextAlignment(TextAlignment.RIGHT)));

            doc.add(itemTable);

            doc.add(new Paragraph("").setMarginBottom(20));

            // ====== TOTAL ======
            Table totalTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                    .setWidth(UnitValue.createPercentValue(50))
                    .setHorizontalAlignment(HorizontalAlignment.RIGHT);

            totalTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(8)
                    .add(new Paragraph("Sous-total").setFont(font).setFontSize(11)));
            totalTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(8).setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph(String.format("%.2f DH", membership.getPrixPaye())).setFont(font).setFontSize(11)));

            totalTable.addCell(new Cell().setBorderTop(new SolidBorder(DARK, 2)).setBorderBottom(Border.NO_BORDER).setBorderLeft(Border.NO_BORDER).setBorderRight(Border.NO_BORDER).setPadding(10)
                    .add(new Paragraph("TOTAL PAYÉ").setFont(boldFont).setFontSize(14)));
            totalTable.addCell(new Cell().setBorderTop(new SolidBorder(DARK, 2)).setBorderBottom(Border.NO_BORDER).setBorderLeft(Border.NO_BORDER).setBorderRight(Border.NO_BORDER).setPadding(10).setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph(String.format("%.2f DH", membership.getPrixPaye())).setFont(boldFont).setFontSize(14).setFontColor(new DeviceRgb(40, 167, 69))));

            doc.add(totalTable);

            doc.add(new Paragraph("").setMarginBottom(40));

            // ====== FOOTER ======
            doc.add(new Paragraph("").setBorderTop(new SolidBorder(new DeviceRgb(200, 200, 200), 1)).setMarginTop(20));
            doc.add(new Paragraph("Merci de votre confiance !").setFont(font).setFontSize(10).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER).setMarginTop(10));
            doc.add(new Paragraph("Ce document tient lieu de justificatif de paiement.").setFont(font).setFontSize(9).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF de facture", e);
        }
    }
}
