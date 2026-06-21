package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long clientId;
    private Long courseId;
    private LocalDate dateReservation; // La date précise du cours réservé
    private LocalDateTime createdAt;
    private String statut;             // CONFIRMEE, ANNULEE, PRESENT, ABSENT
    
    public Reservation() {
        this.createdAt = LocalDateTime.now();
        this.statut = "CONFIRMEE";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public LocalDate getDateReservation() { return dateReservation; }
    public void setDateReservation(LocalDate dateReservation) { this.dateReservation = dateReservation; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
