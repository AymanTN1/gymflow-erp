package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // INCOME, EXPENSE
    private String categorie; // REDAL, GAZ, MATERIEL, SALAIRE, AUTRE, ABONNEMENT
    private Double montant;
    private String description;
    private LocalDateTime dateTransaction;

    public Transaction() {
        this.dateTransaction = LocalDateTime.now();
    }

    public Transaction(String type, String categorie, Double montant, String description) {
        this.type = type;
        this.categorie = categorie;
        this.montant = montant;
        this.description = description;
        this.dateTransaction = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getDateTransaction() { return dateTransaction; }
    public void setDateTransaction(LocalDateTime dateTransaction) { this.dateTransaction = dateTransaction; }
}
