package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import com.happyfitness.erp.service.PdfInvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/client")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private PdfInvoiceService pdfInvoiceService;

    // Historique des abonnements / factures d'un client
    @GetMapping("/{clientId}/invoices")
    public ResponseEntity<?> getClientInvoices(@PathVariable Long clientId) {
        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return ResponseEntity.notFound().build();
        }

        List<Membership> memberships = membershipRepository.findByClientId(clientId);

        // Trier par date de début (plus récent en premier)
        memberships.sort(Comparator.comparing(Membership::getDateDebut, Comparator.nullsLast(Comparator.reverseOrder())));

        List<Map<String, Object>> invoices = memberships.stream().map(m -> {
            Map<String, Object> inv = new HashMap<>();
            inv.put("id", m.getId());
            inv.put("typeAbonnement", m.getTypeAbonnement());
            inv.put("prixPaye", m.getPrixPaye());
            inv.put("dateDebut", m.getDateDebut());
            inv.put("dateFin", m.getDateFin());
            inv.put("statut", m.getStatut());
            inv.put("numero", "FAC-" + m.getId() + "-" + (m.getDateDebut() != null ? m.getDateDebut().getYear() : ""));
            return inv;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(invoices);
    }

    // Télécharger le PDF d'une facture spécifique
    @GetMapping("/{clientId}/invoices/{membershipId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long clientId, @PathVariable Long membershipId) {
        Client client = clientRepository.findById(clientId).orElse(null);
        Membership membership = membershipRepository.findById(membershipId).orElse(null);

        if (client == null || membership == null || !membership.getClientId().equals(clientId)) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(client, membership);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "facture_" + membership.getId() + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    // Infos du profil client
    @GetMapping("/{clientId}/profile")
    public ResponseEntity<?> getClientProfile(@PathVariable Long clientId) {
        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) return ResponseEntity.notFound().build();

        List<Membership> memberships = membershipRepository.findByClientId(clientId);
        Membership activeMembership = memberships.stream()
                .filter(m -> "ACTIF".equals(m.getStatut()))
                .findFirst().orElse(null);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", client.getId());
        profile.put("nomComplet", client.getNomComplet());
        profile.put("email", client.getEmail());
        profile.put("telephone", client.getTelephone());
        profile.put("cin", client.getCin());
        profile.put("statut", client.getStatut());
        profile.put("dateInscription", client.getDateInscription());
        profile.put("abonnementActif", activeMembership);
        profile.put("totalAbonnements", memberships.size());

        return ResponseEntity.ok(profile);
    }
}
