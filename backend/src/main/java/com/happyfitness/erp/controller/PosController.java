package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Product;
import com.happyfitness.erp.model.Sale;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.ProductRepository;
import com.happyfitness.erp.repository.SaleRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*")
public class PosController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    // ============================
    // GESTION DES PRODUITS
    // ============================

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findByActifTrue();
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product saved = productRepository.save(product);
        if (saved.getStockActuel() > 0) {
            Transaction transaction = new Transaction(
                "EXPENSE",
                "ACHAT_STOCK",
                saved.getPrixAchat() * saved.getStockActuel(),
                "Stock Initial: " + saved.getStockActuel() + "x " + saved.getNom()
            );
            transactionRepository.save(transaction);
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product data) {
        return productRepository.findById(id).map(p -> {
            p.setNom(data.getNom());
            p.setCategorie(data.getCategorie());
            p.setPrixVente(data.getPrixVente());
            p.setPrixAchat(data.getPrixAchat());
            p.setStockActuel(data.getStockActuel());
            p.setStockMin(data.getStockMin());
            p.setImage(data.getImage());
            return ResponseEntity.ok(productRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(p -> {
            p.setActif(false);
            productRepository.save(p);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Réapprovisionnement
    @PostMapping("/products/{id}/restock")
    public ResponseEntity<?> restockProduct(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        int qty = payload.getOrDefault("quantite", 0);
        return productRepository.findById(id).map(p -> {
            p.setStockActuel(p.getStockActuel() + qty);
            productRepository.save(p);
            
            if (qty > 0) {
                Transaction transaction = new Transaction(
                    "EXPENSE",
                    "ACHAT_STOCK",
                    p.getPrixAchat() * qty,
                    "Réapprovisionnement: " + qty + "x " + p.getNom()
                );
                transactionRepository.save(transaction);
            }
            
            return ResponseEntity.ok(Map.of("success", true, "newStock", p.getStockActuel()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Alertes de stock bas
    @GetMapping("/products/alertes")
    public List<Product> getStockAlerts() {
        List<Product> products = productRepository.findByActifTrue();
        return products.stream()
                .filter(p -> p.getStockActuel() <= p.getStockMin())
                .collect(Collectors.toList());
    }

    // ============================
    // VENTES (CAISSE RAPIDE)
    // ============================

    @PostMapping("/sell")
    public ResponseEntity<?> sellProduct(@RequestBody Map<String, Object> payload) {
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantite = Integer.parseInt(payload.get("quantite").toString());
        String vendeur = payload.getOrDefault("vendeur", "Réception").toString();

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Produit introuvable"));
        }

        if (product.getStockActuel() < quantite) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Stock insuffisant ! (" + product.getStockActuel() + " restants)"));
        }

        // Décrémenter le stock
        product.setStockActuel(product.getStockActuel() - quantite);
        productRepository.save(product);

        // Enregistrer la vente
        Sale sale = new Sale();
        sale.setProductId(productId);
        sale.setProductNom(product.getNom());
        sale.setQuantite(quantite);
        sale.setPrixUnitaire(product.getPrixVente());
        sale.setTotal(product.getPrixVente() * quantite);
        sale.setVendeur(vendeur);
        saleRepository.save(sale);

        // Créer une transaction INCOME pour la comptabilité
        Transaction transaction = new Transaction(
            "INCOME",
            "VENTE_BUVETTE",
            sale.getTotal(),
            "Vente: " + quantite + "x " + product.getNom()
        );
        transactionRepository.save(transaction);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Vente enregistrée ! " + quantite + "x " + product.getNom() + " = " + sale.getTotal() + " DH",
            "stockRestant", product.getStockActuel()
        ));
    }

    // Ventes du jour
    @GetMapping("/sales/today")
    public ResponseEntity<?> getTodaySales() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<Sale> sales = saleRepository.findByDateVenteBetween(startOfDay, endOfDay);
        double totalJour = sales.stream().mapToDouble(Sale::getTotal).sum();

        return ResponseEntity.ok(Map.of(
            "ventes", sales,
            "totalJour", totalJour,
            "nbVentes", sales.size()
        ));
    }

    // Historique des ventes
    @GetMapping("/sales")
    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    // ============================
    // PASS JOURNÉE (Séance unique)
    // ============================

    @PostMapping("/day-pass")
    public ResponseEntity<?> registerDayPass(@RequestBody Map<String, Object> payload) {
        String clientName = payload.getOrDefault("clientName", "Client de passage").toString();
        double prix;
        try {
            prix = Double.parseDouble(payload.get("prix").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Prix invalide"));
        }

        if (prix <= 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Le prix doit être supérieur à 0"));
        }

        String vendeur = payload.getOrDefault("vendeur", "Réception").toString();
        String telephone = payload.getOrDefault("telephone", "").toString();

        // Enregistrer comme vente
        Sale sale = new Sale();
        sale.setProductId(null); // Pas de produit physique
        sale.setProductNom("Pass Journée - " + clientName);
        sale.setQuantite(1);
        sale.setPrixUnitaire(prix);
        sale.setTotal(prix);
        sale.setVendeur(vendeur);
        saleRepository.save(sale);

        // Créer une transaction INCOME pour la comptabilité
        Transaction transaction = new Transaction(
            "INCOME",
            "PASS_JOURNEE",
            prix,
            "Pass Journée: " + clientName + (telephone.isEmpty() ? "" : " (Tél: " + telephone + ")")
        );
        transactionRepository.save(transaction);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Pass Journée enregistré pour " + clientName + " — " + prix + " DH",
            "saleId", sale.getId()
        ));
    }

    // Pass Journée du jour
    @GetMapping("/day-pass/today")
    public ResponseEntity<?> getTodayDayPasses() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<Sale> sales = saleRepository.findByDateVenteBetween(startOfDay, endOfDay);
        List<Sale> dayPasses = sales.stream()
                .filter(s -> s.getProductNom() != null && s.getProductNom().startsWith("Pass Journée"))
                .collect(Collectors.toList());

        double totalJour = dayPasses.stream().mapToDouble(Sale::getTotal).sum();

        return ResponseEntity.ok(Map.of(
            "passes", dayPasses,
            "totalJour", totalJour,
            "nbPasses", dayPasses.size()
        ));
    }
}
