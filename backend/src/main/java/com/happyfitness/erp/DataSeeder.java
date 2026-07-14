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

    @Autowired
    private com.happyfitness.erp.repository.ProductRepository productRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        // 0. Initialiser les produits POS par défaut s'ils n'existent pas
        if (productRepository.count() == 0) {
            com.happyfitness.erp.model.Product eau = new com.happyfitness.erp.model.Product();
            eau.setNom("Eau Bouteille");
            eau.setCategorie("BOISSON");
            eau.setPrixVente(6.00);
            eau.setPrixAchat(2.00);
            eau.setStockActuel(150);
            eau.setStockMin(10);
            eau.setImage("💧");
            productRepository.save(eau);

            com.happyfitness.erp.model.Product prot = new com.happyfitness.erp.model.Product();
            prot.setNom("Protéine");
            prot.setCategorie("SUPPLEMENT");
            prot.setPrixVente(30.00);
            prot.setPrixAchat(18.00);
            prot.setStockActuel(60);
            prot.setStockMin(5);
            prot.setImage("🥤");
            productRepository.save(prot);

            com.happyfitness.erp.model.Product coach = new com.happyfitness.erp.model.Product();
            coach.setNom("Coach Privé");
            coach.setCategorie("SERVICE");
            coach.setPrixVente(150.00);
            coach.setPrixAchat(0.00);
            coach.setStockActuel(9999);
            coach.setStockMin(0);
            coach.setImage("🏋️");
            productRepository.save(coach);

            System.out.println("✅ Produits par défaut créés avec succès !");
        }
        // 1. Ajouter les utilisateurs de démonstration si la base est vide
        if (userRepository.count() == 0) {
            // Ajouter l'Admin (Owner)
            User admin = new User();
            admin.setNom("M. Ayman (Propriétaire)");
            admin.setEmail("admin@happyfitness.ma");
            admin.setMotDePasse(encoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);

            // Ajouter quelques employés pour la HR et la Paie
            User coach1 = new User();
            coach1.setNom("Youssef (Coach)");
            coach1.setEmail("youssef@happyfitness.ma");
            coach1.setMotDePasse(encoder.encode("coach123"));
            coach1.setRole("COACH");
            userRepository.save(coach1);

            User reception = new User();
            reception.setNom("Sara (Réception)");
            reception.setEmail("sara@happyfitness.ma");
            reception.setMotDePasse(encoder.encode("rec123"));
            reception.setRole("RECEPTION");
            userRepository.save(reception);

            // Ajouter une fiche de Paie (Historique de Paie)
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
            
            System.out.println("✅ Utilisateurs de démonstration créés avec succès !");
        }

        // 2. Générer 5 ans d'historique de transactions dynamique (si vide ou données périmées de plus d'un mois)
        boolean hasNoTransactions = transactionRepository.count() == 0;
        boolean needsRefresh = false;

        if (!hasNoTransactions) {
            // Regarder la date de la dernière transaction
            var latestTx = transactionRepository.findAll().stream()
                    .max((t1, t2) -> t1.getDateTransaction().compareTo(t2.getDateTransaction()));
            if (latestTx.isPresent()) {
                LocalDateTime latestDate = latestTx.get().getDateTransaction();
                // Si la dernière transaction date de plus d'un mois, on rafraîchit pour coller au mois en cours
                if (latestDate.isBefore(LocalDateTime.now().minusDays(30))) {
                    needsRefresh = true;
                }
            }
        }

        if (hasNoTransactions || needsRefresh) {
            System.out.println("⏳ Génération dynamique de 5 ans de données financières (Transactions)...");
            transactionRepository.deleteAll();

            java.util.Random random = new java.util.Random();
            LocalDateTime startDate = LocalDateTime.now().minusMonths(60);
            LocalDateTime endDate = LocalDateTime.now();

            LocalDateTime currentDate = startDate;
            while (currentDate.isBefore(endDate)) {
                int year = currentDate.getYear();
                int month = currentDate.getMonthValue();

                // Calcul du facteur de croissance sur 5 ans (de 1.0 à 1.8)
                int monthsElapsed = (year - startDate.getYear()) * 12 + (month - startDate.getMonthValue());
                double growthFactor = 1.0 + (monthsElapsed / 60.0) * 0.8;

                // Saisonnalité
                double seasonality = 1.0;
                if (month == 1 || month == 2) seasonality = 1.2;
                else if (month == 9 || month == 10) seasonality = 1.15;
                else if (month == 7 || month == 8) seasonality = 0.8;

                // --- REVENUS ---
                double baseSub = 70000 * growthFactor * seasonality;
                double subAmount = Math.round((baseSub * (0.95 + random.nextDouble() * 0.1)) * 100.0) / 100.0;
                Transaction tSub = new Transaction("INCOME", "ABONNEMENT", subAmount, "Abonnements membres - " + String.format("%02d", month) + "/" + year);
                tSub.setDateTransaction(currentDate.withDayOfMonth(5).withHour(10));
                transactionRepository.save(tSub);

                double baseBoutique = 5000 * growthFactor * (java.util.List.of(6, 7, 8).contains(month) ? 1.2 : 1.0);
                double boutiqueAmount = Math.round((baseBoutique * (0.85 + random.nextDouble() * 0.3)) * 100.0) / 100.0;
                Transaction tBoutique = new Transaction("INCOME", "BOUTIQUE", boutiqueAmount, "Ventes boutique - " + String.format("%02d", month) + "/" + year);
                tBoutique.setDateTransaction(currentDate.withDayOfMonth(28).withHour(18));
                transactionRepository.save(tBoutique);

                // --- DÉPENSES ---
                double rentAmount = year < (startDate.getYear() + 3) ? 12000 : 14000;
                Transaction tRent = new Transaction("EXPENSE", "LOYER", rentAmount, "Loyer mensuel local - " + String.format("%02d", month) + "/" + year);
                tRent.setDateTransaction(currentDate.withDayOfMonth(1).withHour(9));
                transactionRepository.save(tRent);

                double baseSalaries = 18000 * (1.0 + (monthsElapsed / 60.0) * 0.5);
                double salariesAmount = Math.round((baseSalaries * (0.98 + random.nextDouble() * 0.04)) * 100.0) / 100.0;
                Transaction tSalaries = new Transaction("EXPENSE", "SALAIRE", salariesAmount, "Salaires staff & coachs - " + String.format("%02d", month) + "/" + year);
                tSalaries.setDateTransaction(currentDate.withDayOfMonth(28).withHour(17));
                transactionRepository.save(tSalaries);

                double baseRedal = java.util.List.of(6, 7, 8, 9).contains(month) ? 3500 : 2200;
                double redalAmount = Math.round((baseRedal * (0.9 + random.nextDouble() * 0.2)) * 100.0) / 100.0;
                Transaction tRedal = new Transaction("EXPENSE", "REDAL", redalAmount, "Facture électricité et eau - " + String.format("%02d", month) + "/" + year);
                tRedal.setDateTransaction(currentDate.withDayOfMonth(15).withHour(11));
                transactionRepository.save(tRedal);

                double baseMkt = 3000 * (java.util.List.of(9, 1).contains(month) ? 1.3 : 0.8);
                double mktAmount = Math.round((baseMkt * (0.8 + random.nextDouble() * 0.4)) * 100.0) / 100.0;
                Transaction tMkt = new Transaction("EXPENSE", "MARKETING", mktAmount, "Campagne marketing mensuelle - " + String.format("%02d", month) + "/" + year);
                tMkt.setDateTransaction(currentDate.withDayOfMonth(10).withHour(14));
                transactionRepository.save(tMkt);

                double maintAmount = Math.round((1500 + random.nextDouble() * 3000) * 100.0) / 100.0;
                Transaction tMaint = new Transaction("EXPENSE", "MAINTENANCE", maintAmount, "Maintenance équipements - " + String.format("%02d", month) + "/" + year);
                tMaint.setDateTransaction(currentDate.withDayOfMonth(18).withHour(10));
                transactionRepository.save(tMaint);

                double baseGaz = java.util.List.of(6, 7, 8).contains(month) ? 450 : 750;
                double gazAmount = Math.round((baseGaz * (0.9 + random.nextDouble() * 0.2)) * 100.0) / 100.0;
                Transaction tGaz = new Transaction("EXPENSE", "GAZ", gazAmount, "Recharge bouteilles de gaz - " + String.format("%02d", month) + "/" + year);
                tGaz.setDateTransaction(currentDate.withDayOfMonth(22).withHour(15));
                transactionRepository.save(tGaz);

                currentDate = currentDate.plusMonths(1);
            }
            System.out.println("✅ Données financières de démonstration rafraîchies sur 5 ans (Jusqu'au mois en cours).");
        }
    }
}
