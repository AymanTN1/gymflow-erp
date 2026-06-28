package com.happyfitness.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String email;
    private String motDePasse;
    private String role; // SUPER_ADMIN, RECEPTION, COACH, CLIENT
    private LocalDateTime dateCreation;
    private Double salaireBase;         // Salaire fixe mensuel en DH
    private Double commissionParCours;  // Commission par cours donné (coachs)

    @jakarta.persistence.Column(name = "photo_url")
    private String photoUrl;

    public User() {
        this.dateCreation = LocalDateTime.now();
        this.salaireBase = 0.0;
        this.commissionParCours = 0.0;
    }

    public User(String nom, String email, String motDePasse, String role) {
        this.nom = nom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = role;
        this.dateCreation = LocalDateTime.now();
        this.salaireBase = 0.0;
        this.commissionParCours = 0.0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public Double getSalaireBase() { return salaireBase; }
    public void setSalaireBase(Double salaireBase) { this.salaireBase = salaireBase; }

    public Double getCommissionParCours() { return commissionParCours; }
    public void setCommissionParCours(Double commissionParCours) { this.commissionParCours = commissionParCours; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
