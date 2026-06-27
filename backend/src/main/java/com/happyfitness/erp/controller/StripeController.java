package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import com.happyfitness.erp.service.EmailService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class StripeController {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EmailService emailService;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    // ============================
    // GRILLE TARIFAIRE
    // ============================

    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        return ResponseEntity.ok(new Object[]{
            Map.of(
                "id", "1_MOIS",
                "name", "1 Mois",
                "price", 300,
                "description", "Accès illimité pendant 1 mois",
                "features", new String[]{"Accès salle de musculation", "Vestiaires & douches", "Wi-Fi gratuit"}
            ),
            Map.of(
                "id", "3_MOIS",
                "name", "3 Mois",
                "price", 750,
                "description", "Économisez 15% sur 3 mois",
                "features", new String[]{"Tout du plan 1 Mois", "Accès cours collectifs", "1 séance coaching offerte"},
                "popular", true
            ),
            Map.of(
                "id", "1_AN",
                "name", "1 An",
                "price", 2500,
                "description", "Le meilleur rapport qualité-prix",
                "features", new String[]{"Tout du plan 3 Mois", "Coaching personnalisé mensuel", "Accès prioritaire cours", "Invité gratuit 1x/mois"}
            )
        });
    }

    // ============================
    // CRÉATION D'UNE SESSION STRIPE CHECKOUT
    // ============================

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckoutSession(@RequestBody Map<String, Object> payload) {
        Long clientId = Long.valueOf(payload.get("clientId").toString());
        String planId = payload.get("planId").toString();

        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Client introuvable"));
        }

        // Déterminer le prix
        long priceInCentimes;
        String planName;
        switch (planId) {
            case "1_MOIS":
                priceInCentimes = 30000; // 300 DH en centimes
                planName = "Abonnement 1 Mois";
                break;
            case "3_MOIS":
                priceInCentimes = 75000; // 750 DH
                planName = "Abonnement 3 Mois";
                break;
            case "1_AN":
                priceInCentimes = 250000; // 2500 DH
                planName = "Abonnement 1 An";
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Plan inconnu"));
        }

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(client.getEmail())
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("mad")
                                .setUnitAmount(priceInCentimes)
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(planName)
                                        .setDescription("GymFlow - Happy Fitness Club")
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .putMetadata("clientId", clientId.toString())
                .putMetadata("planId", planId)
                .build();

            Session session = Session.create(params);
            return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "url", session.getUrl()
            ));

        } catch (StripeException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Erreur Stripe: " + e.getMessage()
            ));
        }
    }

    // ============================
    // CONFIRMATION DU PAIEMENT (appelé par le frontend après succès)
    // ============================

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> payload) {
        String sessionId = payload.get("sessionId").toString();

        try {
            Session session = Session.retrieve(sessionId);

            if (!"complete".equals(session.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le paiement n'est pas complété"));
            }

            Long clientId = Long.valueOf(session.getMetadata().get("clientId"));
            String planId = session.getMetadata().get("planId");

            Client client = clientRepository.findById(clientId).orElse(null);
            if (client == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client introuvable"));
            }

            // Créer l'abonnement
            Membership membership = new Membership();
            membership.setClientId(clientId);
            membership.setDateDebut(LocalDateTime.now());
            membership.setStatut("ACTIF");

            double prixPaye;
            switch (planId) {
                case "1_MOIS":
                    membership.setTypeAbonnement("1 MOIS");
                    membership.setDateFin(LocalDateTime.now().plusMonths(1));
                    prixPaye = 300.0;
                    break;
                case "3_MOIS":
                    membership.setTypeAbonnement("3 MOIS");
                    membership.setDateFin(LocalDateTime.now().plusMonths(3));
                    prixPaye = 750.0;
                    break;
                case "1_AN":
                    membership.setTypeAbonnement("1 AN");
                    membership.setDateFin(LocalDateTime.now().plusYears(1));
                    prixPaye = 2500.0;
                    break;
                default:
                    return ResponseEntity.badRequest().body(Map.of("error", "Plan inconnu"));
            }

            membership.setPrixPaye(prixPaye);
            Membership saved = membershipRepository.save(membership);

            // Créer la transaction comptable
            Transaction transaction = new Transaction(
                "INCOME",
                "ABONNEMENT_EN_LIGNE",
                prixPaye,
                "Paiement Stripe - " + membership.getTypeAbonnement() + " - " + client.getNomComplet()
            );
            transactionRepository.save(transaction);

            // Activer le client si besoin
            client.setStatut("ACTIF");
            clientRepository.save(client);

            // Envoyer la facture par email
            try {
                emailService.sendInvoiceEmail(client, saved);
            } catch (Exception e) {
                System.err.println("Erreur envoi facture email: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Paiement confirmé ! Votre abonnement " + membership.getTypeAbonnement() + " est maintenant actif.",
                "membership", Map.of(
                    "type", membership.getTypeAbonnement(),
                    "dateDebut", membership.getDateDebut().toString(),
                    "dateFin", membership.getDateFin().toString(),
                    "prixPaye", membership.getPrixPaye()
                )
            ));

        } catch (StripeException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Erreur Stripe: " + e.getMessage()
            ));
        }
    }

    // ============================
    // SIMULATION (Mode Développement - sans vraie clé Stripe)
    // ============================

    @PostMapping("/simulate")
    public ResponseEntity<?> simulatePayment(@RequestBody Map<String, Object> payload) {
        Long clientId = Long.valueOf(payload.get("clientId").toString());
        String planId = payload.get("planId").toString();

        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Client introuvable"));
        }

        // Créer l'abonnement directement (simulation)
        Membership membership = new Membership();
        membership.setClientId(clientId);
        membership.setDateDebut(LocalDateTime.now());
        membership.setStatut("ACTIF");

        double prixPaye;
        switch (planId) {
            case "1_MOIS":
                membership.setTypeAbonnement("1 MOIS");
                membership.setDateFin(LocalDateTime.now().plusMonths(1));
                prixPaye = 300.0;
                break;
            case "3_MOIS":
                membership.setTypeAbonnement("3 MOIS");
                membership.setDateFin(LocalDateTime.now().plusMonths(3));
                prixPaye = 750.0;
                break;
            case "1_AN":
                membership.setTypeAbonnement("1 AN");
                membership.setDateFin(LocalDateTime.now().plusYears(1));
                prixPaye = 2500.0;
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Plan inconnu"));
        }

        membership.setPrixPaye(prixPaye);
        Membership saved = membershipRepository.save(membership);

        // Transaction comptable
        Transaction transaction = new Transaction(
            "INCOME",
            "ABONNEMENT_EN_LIGNE",
            prixPaye,
            "Paiement en ligne (Simulation) - " + membership.getTypeAbonnement() + " - " + client.getNomComplet()
        );
        transactionRepository.save(transaction);

        client.setStatut("ACTIF");
        clientRepository.save(client);

        // Envoyer la facture
        try {
            emailService.sendInvoiceEmail(client, saved);
        } catch (Exception e) {
            System.err.println("Erreur envoi facture email: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Paiement simulé avec succès ! Votre abonnement " + membership.getTypeAbonnement() + " est actif.",
            "membership", Map.of(
                "type", membership.getTypeAbonnement(),
                "dateDebut", membership.getDateDebut().toString(),
                "dateFin", membership.getDateFin().toString(),
                "prixPaye", membership.getPrixPaye()
            )
        ));
    }
}
