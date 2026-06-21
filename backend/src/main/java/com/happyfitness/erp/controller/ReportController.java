package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.TransactionRepository;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private TransactionRepository transactionRepository;

    // ============================================
    // 1. DONNÉES GRAPHIQUES (ÉVOLUTION)
    // ============================================
    @GetMapping("/evolution")
    public List<Map<String, Object>> getFinancialEvolution() {
        List<Transaction> transactions = transactionRepository.findAll();
        
        // Grouper par mois (Format: "2023-10")
        Map<String, double[]> monthlyData = new TreeMap<>(); // TreeMap pour trier par clé (date)

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Transaction t : transactions) {
            String month = t.getDateTransaction().format(formatter);
            monthlyData.putIfAbsent(month, new double[]{0.0, 0.0}); // [Revenus, Dépenses]
            
            if ("INCOME".equals(t.getType())) {
                monthlyData.get(month)[0] += t.getMontant();
            } else if ("EXPENSE".equals(t.getType())) {
                monthlyData.get(month)[1] += t.getMontant();
            }
        }

        // Convertir en format attendu par Recharts
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : monthlyData.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("month", entry.getKey());
            map.put("Revenus", entry.getValue()[0]);
            map.put("Dépenses", entry.getValue()[1]);
            map.put("Benefice", entry.getValue()[0] - entry.getValue()[1]);
            result.add(map);
        }
        
        return result;
    }

    // ============================================
    // 2. EXPORT CSV (Excel)
    // ============================================
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv() {
        List<Transaction> transactions = transactionRepository.findAllByOrderByDateTransactionDesc();
        
        StringBuilder csv = new StringBuilder();
        // En-tête (UTF-8 BOM pour Excel)
        csv.append('\ufeff');
        csv.append("ID,Date,Type,Catégorie,Description,Montant (DH)\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Transaction t : transactions) {
            csv.append(t.getId()).append(",")
               .append(t.getDateTransaction().format(formatter)).append(",")
               .append(t.getType()).append(",")
               .append(t.getCategorie()).append(",")
               .append("\"").append(t.getDescription() != null ? t.getDescription().replace("\"", "\"\"") : "").append("\",")
               .append(t.getMontant())
               .append("\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_financier.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));

        return new ResponseEntity<>(csv.toString(), headers, HttpStatus.OK);
    }

    // ============================================
    // 3. EXPORT PDF (iText7)
    // ============================================
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() {
        try {
            List<Transaction> transactions = transactionRepository.findAllByOrderByDateTransactionDesc();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Titre
            Paragraph title = new Paragraph("Rapport Financier - GymFlow")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(title);

            // Résumé Global
            double totalIncome = transactions.stream().filter(t -> "INCOME".equals(t.getType())).mapToDouble(Transaction::getMontant).sum();
            double totalExpense = transactions.stream().filter(t -> "EXPENSE".equals(t.getType())).mapToDouble(Transaction::getMontant).sum();
            
            document.add(new Paragraph("Résumé Global:").setBold());
            document.add(new Paragraph("Total Revenus : " + totalIncome + " DH").setFontColor(new DeviceRgb(0, 128, 0)));
            document.add(new Paragraph("Total Dépenses : " + totalExpense + " DH").setFontColor(new DeviceRgb(255, 0, 0)));
            document.add(new Paragraph("Bénéfice Net : " + (totalIncome - totalExpense) + " DH").setBold().setMarginBottom(20));

            // Tableau des transactions
            Table table = new Table(new float[]{1, 2, 2, 3, 2});
            table.setWidth(UnitValue.createPercentValue(100));
            
            // En-têtes
            table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Date").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Type/Cat").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Description").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Montant").setBold()));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            for (Transaction t : transactions) {
                table.addCell(new Paragraph(String.valueOf(t.getId())));
                table.addCell(new Paragraph(t.getDateTransaction().format(formatter)));
                
                Cell typeCell = new Cell().add(new Paragraph(t.getType() + " - " + t.getCategorie()));
                if ("INCOME".equals(t.getType())) {
                    typeCell.setFontColor(new DeviceRgb(0, 128, 0));
                } else {
                    typeCell.setFontColor(new DeviceRgb(255, 0, 0));
                }
                table.addCell(typeCell);
                
                table.addCell(new Paragraph(t.getDescription() != null ? t.getDescription() : ""));
                table.addCell(new Paragraph(t.getMontant() + " DH"));
            }

            document.add(table);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "rapport_financier.pdf");

            return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
