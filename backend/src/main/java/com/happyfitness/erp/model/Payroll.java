package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payrolls")
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeId;
    private String nomEmploye;
    private Double salaireBase;
    private String typePaiement; // HEBDO, MENSUEL
    private Double cnss;
    private Double prime;
    private Double totalPaye;
    private String moisOuSemaine; // ex: "Juin 2026" ou "Semaine 24"
    private LocalDateTime datePaiement;

    public Payroll() {
        this.datePaiement = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getEmployeId() { return employeId; }
    public void setEmployeId(Long employeId) { this.employeId = employeId; }
    
    public String getNomEmploye() { return nomEmploye; }
    public void setNomEmploye(String nomEmploye) { this.nomEmploye = nomEmploye; }
    
    public Double getSalaireBase() { return salaireBase; }
    public void setSalaireBase(Double salaireBase) { this.salaireBase = salaireBase; }
    
    public String getTypePaiement() { return typePaiement; }
    public void setTypePaiement(String typePaiement) { this.typePaiement = typePaiement; }
    
    public Double getCnss() { return cnss; }
    public void setCnss(Double cnss) { this.cnss = cnss; }
    
    public Double getPrime() { return prime; }
    public void setPrime(Double prime) { this.prime = prime; }
    
    public Double getTotalPaye() { return totalPaye; }
    public void setTotalPaye(Double totalPaye) { this.totalPaye = totalPaye; }
    
    public String getMoisOuSemaine() { return moisOuSemaine; }
    public void setMoisOuSemaine(String moisOuSemaine) { this.moisOuSemaine = moisOuSemaine; }
    
    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }
}
