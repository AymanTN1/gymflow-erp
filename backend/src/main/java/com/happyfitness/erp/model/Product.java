package com.happyfitness.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;          // Ex: "Eau Minérale", "Café"
    private String categorie;    // Ex: "BOISSON", "SNACK", "SUPPLEMENT"
    private Double prixVente;    // Prix de vente unitaire en DH
    private Double prixAchat;    // Prix d'achat (pour calcul de marge)
    private Integer stockActuel; // Quantité en stock
    private Integer stockMin;    // Seuil d'alerte de réapprovisionnement
    private String image;        // Emoji ou icône
    private Boolean actif;

    public Product() {
        this.actif = true;
        this.stockActuel = 0;
        this.stockMin = 5;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }

    public Double getPrixVente() { return prixVente; }
    public void setPrixVente(Double prixVente) { this.prixVente = prixVente; }

    public Double getPrixAchat() { return prixAchat; }
    public void setPrixAchat(Double prixAchat) { this.prixAchat = prixAchat; }

    public Integer getStockActuel() { return stockActuel; }
    public void setStockActuel(Integer stockActuel) { this.stockActuel = stockActuel; }

    public Integer getStockMin() { return stockMin; }
    public void setStockMin(Integer stockMin) { this.stockMin = stockMin; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}
