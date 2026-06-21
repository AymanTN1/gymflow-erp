package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;           // Ex: "Zumba", "CrossFit", "Yoga"
    private String coach;         // Ex: "Coach Yassine"
    private String jour;          // Ex: "LUNDI", "MARDI", etc.
    private LocalTime heureDebut; // Ex: 18:00
    private LocalTime heureFin;   // Ex: 19:00
    private Integer capaciteMax;  // Ex: 20 personnes
    private String salle;         // Ex: "Salle A", "Salle Cardio"
    private String couleur;       // Ex: "#FF6B35" pour l'affichage du planning
    private Boolean actif;

    public Course() {
        this.actif = true;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getCoach() { return coach; }
    public void setCoach(String coach) { this.coach = coach; }

    public String getJour() { return jour; }
    public void setJour(String jour) { this.jour = jour; }

    public LocalTime getHeureDebut() { return heureDebut; }
    public void setHeureDebut(LocalTime heureDebut) { this.heureDebut = heureDebut; }

    public LocalTime getHeureFin() { return heureFin; }
    public void setHeureFin(LocalTime heureFin) { this.heureFin = heureFin; }

    public Integer getCapaciteMax() { return capaciteMax; }
    public void setCapaciteMax(Integer capaciteMax) { this.capaciteMax = capaciteMax; }

    public String getSalle() { return salle; }
    public void setSalle(String salle) { this.salle = salle; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }

    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}
