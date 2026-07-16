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

    @Autowired
    private com.happyfitness.erp.repository.ClientRepository clientRepository;

    @Autowired
    private com.happyfitness.erp.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private com.happyfitness.erp.repository.MembershipRepository membershipRepository;

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

            com.happyfitness.erp.model.Product cafe = new com.happyfitness.erp.model.Product();
            cafe.setNom("Café");
            cafe.setCategorie("BOISSON");
            cafe.setPrixVente(10.00);
            cafe.setPrixAchat(3.00);
            cafe.setStockActuel(200);
            cafe.setStockMin(20);
            cafe.setImage("☕");
            productRepository.save(cafe);

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

        // 3. Générer 10 clients avec abonnements et historiques de pointages si la table clients est vide
        if (clientRepository.count() == 0) {
            System.out.println("⏳ Génération des 10 clients de démonstration avec historique de fréquentation...");

            // Définir les profils
            String[][] profiles = {
                {"Ahmed Benali", "ahmed@gmail.com", "0612345678", "ACTIF", "5", "0", "30"}, // assidu, 5 visites/sem, dernière visite il y a 0j, abo reste 30j
                {"Fatima Zahra", "fatima@gmail.com", "0623456789", "ACTIF", "4", "1", "60"}, // assidu, 4 visites/sem, dernière visite il y a 1j, abo reste 60j
                {"Youssef Amrani", "youssef.amr@gmail.com", "0634567890", "ACTIF", "3", "2", "45"}, // régulier, 3 visites/sem, dernière visite il y a 2j, abo reste 45j
                {"Karim Tazi", "karim@gmail.com", "0645678901", "ACTIF", "2", "3", "90"}, // régulier, 2.5 visites/sem, dernière visite il y a 3j, abo reste 90j
                {"Salma Idrissi", "salma@gmail.com", "0656789012", "ACTIF", "2", "5", "15"}, // moyenne, 2 visites/sem, dernière visite il y a 5j, abo reste 15j
                {"Omar Bennani", "omar@gmail.com", "0667890123", "ACTIF", "1.5", "7", "120"}, // occasionnel, 1.5 visites/sem, dernière visite il y a 7j, abo reste 120j
                {"Nadia Filali", "nadia@gmail.com", "0678901234", "ACTIF", "0.5", "12", "10"}, // déclin, 0.5 visites/sem, dernière visite il y a 12j, abo reste 10j
                {"Hassan Ouazzani", "hassan@gmail.com", "0689012345", "ACTIF", "0.3", "15", "5"}, // déclin, 0.3 visites/sem, dernière visite il y a 15j, abo reste 5j
                {"Rachid Alaoui", "rachid@gmail.com", "0690123456", "ACTIF", "0.0", "25", "2"}, // fantôme, 0 visites, dernière visite il y a 25j, abo reste 2j
                {"Imane Chraibi", "imane@gmail.com", "0601234567", "INACTIF", "0.0", "35", "-10"} // fantôme, 0 visites, dernière visite il y a 35j, abo expiré de 10j
            };

            for (String[] prof : profiles) {
                com.happyfitness.erp.model.Client client = new com.happyfitness.erp.model.Client();
                client.setNomComplet(prof[0]);
                client.setEmail(prof[1]);
                client.setTelephone(prof[2]);
                client.setStatut(prof[3]);
                client.setDateInscription(LocalDateTime.now().minusMonths(6));
                client.setSoldeImpaye(0.0);
                client.setEmailVerified(true);
                client = clientRepository.save(client);

                // Ajouter l'abonnement
                com.happyfitness.erp.model.Membership membership = new com.happyfitness.erp.model.Membership();
                membership.setClientId(client.getId());
                membership.setTypeAbonnement("3 MOIS");
                membership.setPrixPaye(1000.0);
                membership.setDateDebut(LocalDateTime.now().minusDays(90 - Integer.parseInt(prof[6])));
                membership.setDateFin(LocalDateTime.now().plusDays(Integer.parseInt(prof[6])));
                membership.setStatut(Integer.parseInt(prof[6]) > 0 ? "ACTIF" : "EXPIRE");
                membershipRepository.save(membership);

                // Générer des pointages
                double visitsPerWeek = Double.parseDouble(prof[4]);
                int lastVisitDaysAgo = Integer.parseInt(prof[5]);

                if (visitsPerWeek > 0 || lastVisitDaysAgo <= 35) {
                    // Visite la plus récente
                    com.happyfitness.erp.model.Attendance latest = new com.happyfitness.erp.model.Attendance();
                    latest.setClientId(client.getId());
                    latest.setCheckInTime(LocalDateTime.now().minusDays(lastVisitDaysAgo).withHour(10).withMinute(0));
                    latest.setCheckOutTime(LocalDateTime.now().minusDays(lastVisitDaysAgo).withHour(11).withMinute(30));
                    latest.setStatus("LEFT");
                    attendanceRepository.save(latest);

                    // Générer le reste de l'historique sur les 60 derniers jours
                    java.util.Random rand = new java.util.Random();
                    int totalWeeks = 8;
                    for (int w = 0; w < totalWeeks; w++) {
                        // Nombre de visites cette semaine-là
                        int numVisits = (int) Math.round(visitsPerWeek);
                        if (prof[0].equals("Nadia Filali") || prof[0].equals("Hassan Ouazzani")) {
                            // Déclin : beaucoup plus de visites au début, moins à la fin
                            if (w < 4) numVisits = 3;
                            else if (w < 6) numVisits = 1;
                            else numVisits = 0;
                        } else if (prof[0].equals("Rachid Alaoui") || prof[0].equals("Imane Chraibi")) {
                            // Fantômes : quelques visites au début, aucune à la fin
                            if (w < 3) numVisits = 2;
                            else numVisits = 0;
                        }

                        for (int v = 0; v < numVisits; v++) {
                            int dayOffset = w * 7 + rand.nextInt(5) + 1 + lastVisitDaysAgo;
                            if (dayOffset >= 90) continue;

                            com.happyfitness.erp.model.Attendance att = new com.happyfitness.erp.model.Attendance();
                            att.setClientId(client.getId());
                            att.setCheckInTime(LocalDateTime.now().minusDays(dayOffset).withHour(8 + rand.nextInt(10)).withMinute(0));
                            att.setCheckOutTime(att.getCheckInTime().plusHours(1).plusMinutes(30));
                            att.setStatus("LEFT");
                            attendanceRepository.save(att);
                        }
                    }
                }
            }
            System.out.println("✅ 10 clients de démonstration et historiques de pointages générés !");
        }
    }
}
