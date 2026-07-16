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

        // 3. Générer 60 clients avec abonnements et historiques de pointages si la table clients est vide
        if (clientRepository.count() == 0) {
            System.out.println("⏳ Génération de 60 clients de démonstration avec historique réaliste...");

            String[] firstNames = {"Amine", "Youssef", "Tarik", "Ahmed", "Omar", "Hamza", "Karim", "Fatima", "Salma", "Kenza", "Meriem", "Rachid", "Hassan", "Imane", "Khalid", "Ali", "Saad", "Anas", "Othmane", "Zineb", "Leyla", "Hajar", "Sami", "Driss", "Nabil", "Ghita", "Nisrine", "Reda"};
            String[] lastNames = {"Benali", "Tazi", "Alaoui", "Filali", "Bennani", "Amrani", "Idrissi", "Ouazzani", "Berrada", "Cherkaoui", "Naciri", "Mansouri", "Jabri", "Rifi", "Chraibi", "El Fassi", "Tahiri", "Sabri"};

            java.util.Random rand = new java.util.Random();
            java.util.List<String> generatedNames = new java.util.ArrayList<>();

            int totalClients = 60;
            for (int i = 0; i < totalClients; i++) {
                // Generer un nom unique
                String nomComplet = "";
                while (nomComplet.isEmpty() || generatedNames.contains(nomComplet)) {
                    nomComplet = firstNames[rand.nextInt(firstNames.length)] + " " + lastNames[rand.nextInt(lastNames.length)];
                }
                generatedNames.add(nomComplet);

                String email = nomComplet.toLowerCase().replace(" ", ".") + "@gmail.com";
                String telephone = "06" + String.format("%08d", rand.nextInt(100000000));

                // Choisir le profil : 0=loyal (40%), 1=regular (30%), 2=declining (15%), 3=ghost (15%)
                double p = rand.nextDouble();
                String profile = "regular";
                double visitsPerWeek = 2.0;
                int lastVisitDaysAgo = 2;
                int aboDaysLeft = 30;

                if (p < 0.40) {
                    profile = "loyal";
                    visitsPerWeek = 3.5 + rand.nextDouble() * 2.0; // 3.5 to 5.5
                    lastVisitDaysAgo = rand.nextInt(3); // 0 to 2
                    aboDaysLeft = 15 + rand.nextInt(180); // 15 to 195
                } else if (p < 0.70) {
                    profile = "regular";
                    visitsPerWeek = 1.5 + rand.nextDouble() * 1.5; // 1.5 to 3.0
                    lastVisitDaysAgo = 1 + rand.nextInt(7); // 1 to 7
                    aboDaysLeft = 5 + rand.nextInt(90); // 5 to 95
                } else if (p < 0.85) {
                    profile = "declining";
                    visitsPerWeek = 0.5 + rand.nextDouble() * 0.5; // 0.5 to 1.0
                    lastVisitDaysAgo = 8 + rand.nextInt(8); // 8 to 15
                    aboDaysLeft = -5 + rand.nextInt(20); // -5 to 15 (expired recently or about to expire)
                } else {
                    profile = "ghost";
                    visitsPerWeek = 0.0;
                    lastVisitDaysAgo = 16 + rand.nextInt(30); // 16 to 45
                    aboDaysLeft = -45 + rand.nextInt(50); // -45 to 5
                }

                // Créer le client
                com.happyfitness.erp.model.Client client = new com.happyfitness.erp.model.Client();
                client.setNomComplet(nomComplet);
                client.setEmail(email);
                client.setTelephone(telephone);
                client.setStatut(aboDaysLeft > 0 ? "ACTIF" : "EXPIRE");
                client.setDateInscription(LocalDateTime.now().minusMonths(6));
                client.setSoldeImpaye(0.0);
                client.setEmailVerified(true);
                client = clientRepository.save(client);

                // Déterminer type abonnement et prix
                String typeAbonnement;
                double prixPaye;
                int durationDays;
                
                // Selectionner au hasard une offre cohérente avec aboDaysLeft
                int offerSelect = rand.nextInt(4);
                if (offerSelect == 0) {
                    typeAbonnement = "1 MOIS";
                    prixPaye = 250.0;
                    durationDays = 30;
                } else if (offerSelect == 1) {
                    typeAbonnement = "3 MOIS";
                    prixPaye = 600.0;
                    durationDays = 90;
                } else if (offerSelect == 2) {
                    typeAbonnement = "6 MOIS";
                    prixPaye = 900.0;
                    durationDays = 180;
                } else {
                    typeAbonnement = "1 AN";
                    prixPaye = 1500.0;
                    durationDays = 365;
                }

                // Créer l'abonnement
                com.happyfitness.erp.model.Membership membership = new com.happyfitness.erp.model.Membership();
                membership.setClientId(client.getId());
                membership.setTypeAbonnement(typeAbonnement);
                membership.setPrixPaye(prixPaye);
                
                LocalDateTime dateFin = LocalDateTime.now().plusDays(aboDaysLeft);
                LocalDateTime dateDebut = dateFin.minusDays(durationDays);
                
                membership.setDateDebut(dateDebut);
                membership.setDateFin(dateFin);
                membership.setStatut(aboDaysLeft > 0 ? "ACTIF" : "EXPIRE");
                membershipRepository.save(membership);

                // Enregistrer le paiement de l'abonnement comme transaction REVENU
                Transaction t = new Transaction("INCOME", "ABONNEMENT", prixPaye, "Abonnement " + typeAbonnement + " - " + client.getNomComplet());
                t.setDateTransaction(dateDebut);
                transactionRepository.save(t);

                // Générer des pointages
                if (visitsPerWeek > 0 || lastVisitDaysAgo <= 45) {
                    // 1. Visite la plus récente
                    if (lastVisitDaysAgo < 60) {
                        com.happyfitness.erp.model.Attendance latest = new com.happyfitness.erp.model.Attendance();
                        latest.setClientId(client.getId());
                        
                        // Pic de 18:00 - 21:00 (18h + rand.nextInt(3) = 18h, 19h ou 20h)
                        int checkinHour = 18 + rand.nextInt(3);
                        if (rand.nextDouble() < 0.25) {
                            checkinHour = 7 + rand.nextInt(2); // pic matin
                        } else if (rand.nextDouble() < 0.15) {
                            checkinHour = 10 + rand.nextInt(6); // journée
                        }
                        
                        latest.setCheckInTime(LocalDateTime.now().minusDays(lastVisitDaysAgo).withHour(checkinHour).withMinute(rand.nextInt(60)));
                        latest.setCheckOutTime(latest.getCheckInTime().plusMinutes(60 + rand.nextInt(60)));
                        latest.setStatus("LEFT");
                        attendanceRepository.save(latest);
                    }

                    // 2. Historique sur les 60 derniers jours
                    int totalWeeks = 8;
                    for (int w = 0; w < totalWeeks; w++) {
                        int numVisits = (int) Math.round(visitsPerWeek);
                        
                        if (profile.equals("declining")) {
                            if (w < 4) numVisits = 3;
                            else if (w < 6) numVisits = 1;
                            else numVisits = 0;
                        } else if (profile.equals("ghost")) {
                            if (w < 3) numVisits = 2;
                            else numVisits = 0;
                        }

                        for (int v = 0; v < numVisits; v++) {
                            int dayOffset = w * 7 + rand.nextInt(5) + 1 + lastVisitDaysAgo;
                            if (dayOffset >= 90) continue;

                            com.happyfitness.erp.model.Attendance att = new com.happyfitness.erp.model.Attendance();
                            att.setClientId(client.getId());
                            
                            // Déterminer l'heure de checkin selon les pics de fréquentation
                            int checkinHour = 19;
                            double randHour = rand.nextDouble();
                            if (randHour < 0.60) {
                                checkinHour = 18 + rand.nextInt(3); // 18:00 - 20:00 (Pic soir)
                            } else if (randHour < 0.85) {
                                checkinHour = 7 + rand.nextInt(2);  // 07:00 - 08:00 (Pic matin)
                            } else {
                                checkinHour = 9 + rand.nextInt(8);   // 09:00 - 17:00 (Reste de la journée)
                            }

                            att.setCheckInTime(LocalDateTime.now().minusDays(dayOffset).withHour(checkinHour).withMinute(rand.nextInt(60)));
                            att.setCheckOutTime(att.getCheckInTime().plusMinutes(60 + rand.nextInt(60)));
                            att.setStatus("LEFT");
                            attendanceRepository.save(att);
                        }
                    }
                }
            }
            System.out.println("✅ 60 clients de démonstration avec abonnements configurés et historiques de pointages générés !");
        }
    }
}
