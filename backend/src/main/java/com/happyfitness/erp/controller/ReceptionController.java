package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

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

    // --- CLIENTS ---
    
    @GetMapping("/clients")
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @PostMapping("/clients")
    public ResponseEntity<Client> addClient(@RequestBody Client client) {
        Client saved = clientRepository.save(client);
        return ResponseEntity.ok(saved);
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
        
        return ResponseEntity.ok(saved);
    }
}
