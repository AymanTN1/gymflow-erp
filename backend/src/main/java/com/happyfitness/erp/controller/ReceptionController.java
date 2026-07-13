package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import com.happyfitness.erp.service.EmailService;
import com.happyfitness.erp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reception")
@CrossOrigin(origins = "*")
public class ReceptionController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    // --- CLIENTS ---
    
    @GetMapping("/clients")
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @PostMapping("/clients")
    public ResponseEntity<?> addClient(@RequestBody Client client) {
        // Si le client a un email, on génère un code de vérification
        if (client.getEmail() != null && !client.getEmail().isEmpty()) {
            String code = emailService.generateVerificationCode();
            client.setVerificationCode(code);
            client.setEmailVerified(false);
            client.setStatut("EN_ATTENTE");
            
            Client saved = clientRepository.save(client);
            
            // Envoyer l'email avec le code de vérification
            try {
                emailService.sendVerificationCode(client.getEmail(), client.getNomComplet(), code);
            } catch (Exception e) {
                // Log l'erreur mais ne bloque pas la création du client
                System.err.println("Erreur d'envoi email de vérification: " + e.getMessage());
            }
            
            notificationService.sendNotification("SUPER_ADMIN", "Nouveau client inscrit : " + saved.getNomComplet(), "INFO");
            
            return ResponseEntity.ok(saved);
        } else {
            // Pas d'email, on active directement
            client.setStatut("ACTIF");
            client.setEmailVerified(false);
            Client saved = clientRepository.save(client);
            
            notificationService.sendNotification("SUPER_ADMIN", "Nouveau client inscrit : " + saved.getNomComplet(), "INFO");
            
            return ResponseEntity.ok(saved);
        }
    }

    @PostMapping("/clients/{id}/verify-email")
    public ResponseEntity<?> verifyEmail(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String code = payload.get("code");
        
        Client client = clientRepository.findById(id).orElse(null);
        if (client == null) {
            return ResponseEntity.notFound().build();
        }
        
        if (client.getVerificationCode() != null && client.getVerificationCode().equals(code)) {
            client.setEmailVerified(true);
            client.setStatut("ACTIF");
            client.setVerificationCode(null); // Supprimer le code après vérification
            clientRepository.save(client);
            return ResponseEntity.ok(Map.of("success", true, "message", "Email vérifié avec succès !"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Code incorrect. Veuillez réessayer."));
        }
    }

    @PostMapping("/clients/{id}/resend-code")
    public ResponseEntity<?> resendCode(@PathVariable Long id) {
        Client client = clientRepository.findById(id).orElse(null);
        if (client == null) {
            return ResponseEntity.notFound().build();
        }
        
        String code = emailService.generateVerificationCode();
        client.setVerificationCode(code);
        clientRepository.save(client);
        
        try {
            emailService.sendVerificationCode(client.getEmail(), client.getNomComplet(), code);
            return ResponseEntity.ok(Map.of("success", true, "message", "Code renvoyé !"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Erreur d'envoi de l'email"));
        }
    }

    // --- ABONNEMENTS (MEMBERSHIPS) ---

    @GetMapping("/memberships")
    public List<Membership> getAllMemberships() {
        return membershipRepository.findAll();
    }
    
    @GetMapping("/memberships/client/{clientId}")
    public List<Membership> getMembershipsByClient(@PathVariable Long clientId) {
        return membershipRepository.findByClientId(clientId);
    }

    @PostMapping("/memberships")
    public ResponseEntity<Membership> addMembership(@RequestBody Membership membership) {
        // Calculer la date de fin
        membership.setDateDebut(LocalDateTime.now());
        if ("1 MOIS".equals(membership.getTypeAbonnement())) {
            membership.setDateFin(LocalDateTime.now().plusMonths(1));
        } else if ("3 MOIS".equals(membership.getTypeAbonnement())) {
            membership.setDateFin(LocalDateTime.now().plusMonths(3));
        } else if ("1 AN".equals(membership.getTypeAbonnement())) {
            membership.setDateFin(LocalDateTime.now().plusYears(1));
        } else {
            membership.setDateFin(LocalDateTime.now().plusMonths(1)); // Default
        }
        
        membership.setStatut("ACTIF");
        Membership saved = membershipRepository.save(membership);
        
        // Créer automatiquement une transaction (INCOME) pour ce paiement
        Client client = clientRepository.findById(saved.getClientId()).orElse(null);
        String clientName = client != null ? client.getNomComplet() : "Client #" + saved.getClientId();
        
        Transaction transaction = new Transaction(
            "INCOME",
            "ABONNEMENT",
            saved.getPrixPaye(),
            "Abonnement " + saved.getTypeAbonnement() + " - " + clientName
        );
        transactionRepository.save(transaction);
        
        // Envoyer la facture par email si le client a un email vérifié
        if (client != null && client.getEmail() != null && !client.getEmail().isEmpty()) {
            try {
                emailService.sendInvoiceEmail(client, saved);
            } catch (Exception e) {
                System.err.println("Erreur d'envoi de la facture email: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(saved);
    }

    // --- DETTES ---

    @PostMapping("/clients/{id}/debt")
    public ResponseEntity<?> addDebt(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Client client = clientRepository.findById(id).orElse(null);
        if (client == null) return ResponseEntity.notFound().build();
        
        Double amount = payload.get("amount");
        if (amount != null && amount > 0) {
            client.setSoldeImpaye(client.getSoldeImpaye() + amount);
            clientRepository.save(client);
        }
        return ResponseEntity.ok(client);
    }

    @PostMapping("/clients/{id}/pay-debt")
    public ResponseEntity<?> payDebt(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Client client = clientRepository.findById(id).orElse(null);
        if (client == null) return ResponseEntity.notFound().build();
        
        Double amount = payload.get("amount");
        if (amount != null && amount > 0) {
            double currentDebt = client.getSoldeImpaye();
            double newDebt = Math.max(0, currentDebt - amount);
            client.setSoldeImpaye(newDebt);
            clientRepository.save(client);
            
            // Transaction INCOME pour le remboursement
            Transaction transaction = new Transaction(
                "INCOME",
                "REMBOURSEMENT",
                amount,
                "Remboursement dette - " + client.getNomComplet()
            );
            transactionRepository.save(transaction);
        }
        return ResponseEntity.ok(client);
    }
}
