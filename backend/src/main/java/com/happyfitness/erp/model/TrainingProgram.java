package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_programs")
public class TrainingProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long clientId;
    private Long coachId;

    private String titre;
    private String description;

    @Column(columnDefinition = "TEXT")
    private String contenuJSON; // Liste d'exercices structurée en JSON

    private LocalDateTime dateCreation;

    public TrainingProgram() {
        this.dateCreation = LocalDateTime.now();
    }

    public TrainingProgram(Long clientId, Long coachId, String titre, String description, String contenuJSON) {
        this.clientId = clientId;
        this.coachId = coachId;
        this.titre = titre;
        this.description = description;
        this.contenuJSON = contenuJSON;
        this.dateCreation = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getCoachId() { return coachId; }
    public void setCoachId(Long coachId) { this.coachId = coachId; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContenuJSON() { return contenuJSON; }
    public void setContenuJSON(String contenuJSON) { this.contenuJSON = contenuJSON; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
