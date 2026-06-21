package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales")
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private String productNom;
    private Integer quantite;
    private Double prixUnitaire;
    private Double total;
    private LocalDateTime dateVente;
    private String vendeur; // Nom du réceptionniste

    public Sale() {
        this.dateVente = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductNom() { return productNom; }
    public void setProductNom(String productNom) { this.productNom = productNom; }

    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public Double getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(Double prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public LocalDateTime getDateVente() { return dateVente; }
    public void setDateVente(LocalDateTime dateVente) { this.dateVente = dateVente; }

    public String getVendeur() { return vendeur; }
    public void setVendeur(String vendeur) { this.vendeur = vendeur; }
}
