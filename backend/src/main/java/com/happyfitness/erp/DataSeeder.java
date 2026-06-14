package com.happyfitness.erp;

import com.happyfitness.erp.model.Payroll;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.model.User;
import com.happyfitness.erp.repository.PayrollRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import com.happyfitness.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seulement injecter des données si la base de données est vide
        if (userRepository.count() == 0) {
            
            // 1. Ajouter l'Admin (Owner)
            User admin = new User();
            admin.setNom("M. Ayman (Propriétaire)");
            admin.setEmail("admin@happyfitness.ma");
            admin.setMotDePasse("admin123");
            admin.setRole("ADMIN");
            userRepository.save(admin);

            // 2. Ajouter quelques employés pour la HR et la Paie
            User coach1 = new User();
            coach1.setNom("Youssef (Coach)");
            coach1.setEmail("youssef@happyfitness.ma");
            coach1.setMotDePasse("coach123");
            coach1.setRole("COACH");
            userRepository.save(coach1);

            User reception = new User();
            reception.setNom("Sara (Réception)");
            reception.setEmail("sara@happyfitness.ma");
            reception.setMotDePasse("rec123");
            reception.setRole("RECEPTION");
            userRepository.save(reception);

            // 3. Simuler des Transactions (Dashboard Finance)
            transactionRepository.save(new Transaction("EXPENSE", "REDAL", 2500.00, "Facture d'eau et électricité du mois de Mai"));
            transactionRepository.save(new Transaction("EXPENSE", "GAZ", 450.00, "10 bouteilles de gaz pour les douches"));
            transactionRepository.save(new Transaction("INCOME", "ABONNEMENT", 124500.00, "Revenus des abonnements globaux du mois en cours"));
            transactionRepository.save(new Transaction("EXPENSE", "MAINTENANCE", 1200.00, "Réparation de 2 tapis de course"));

            // 4. Simuler une fiche de Paie (Historique de Paie)
            Payroll payroll = new Payroll();
            payroll.setEmployeId(coach1.getId());
            payroll.setNomEmploye(coach1.getNom());
            payroll.setSalaireBase(4000.00);
            payroll.setCnss(250.00);
            payroll.setPrime(500.00);
            payroll.setTotalPaye(4250.00);
            payroll.setTypePaiement("MENSUEL");
            payroll.setMoisOuSemaine("Juin 2026");
            payroll.setDatePaiement(LocalDateTime.now().minusDays(2));
            payrollRepository.save(payroll);
            
            // Enregistrer automatiquement la transaction pour la paie simulée
            transactionRepository.save(new Transaction("EXPENSE", "SALAIRE", 4250.00, "Paie de " + coach1.getNom() + " - Juin 2026"));

            System.out.println("✅ Données de démonstration injectées avec succès !");
        }
    }
}
