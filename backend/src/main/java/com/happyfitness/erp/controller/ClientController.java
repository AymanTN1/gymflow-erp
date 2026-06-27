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

    // ============================
    // STATISTIQUES AVANCÉES DU CLIENT
    // ============================

    @Autowired
    private com.happyfitness.erp.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private com.happyfitness.erp.repository.ReservationRepository reservationRepository;

    @GetMapping("/{clientId}/stats")
    public ResponseEntity<?> getClientStats(@PathVariable Long clientId) {
        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) return ResponseEntity.notFound().build();

        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // 1. Visites du mois (attendances ce mois-ci)
        java.time.LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        java.time.LocalDateTime endOfMonth = now.withDayOfMonth(now.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59);
        List<com.happyfitness.erp.model.Attendance> monthAttendances = attendanceRepository.findByClientIdAndCheckInTimeBetween(clientId, startOfMonth, endOfMonth);
        int visitesCeMois = monthAttendances.size();

        // 2. Total des visites (all time)
        List<com.happyfitness.erp.model.Attendance> allAttendances = attendanceRepository.findByClientIdOrderByCheckInTimeDesc(clientId);
        int totalVisites = allAttendances.size();

        // 3. Streak de jours consécutifs
        int streak = 0;
        if (!allAttendances.isEmpty()) {
            java.util.Set<java.time.LocalDate> visitDates = new java.util.TreeSet<>(java.util.Collections.reverseOrder());
            for (com.happyfitness.erp.model.Attendance a : allAttendances) {
                visitDates.add(a.getCheckInTime().toLocalDate());
            }
            java.time.LocalDate checkDate = java.time.LocalDate.now();
            for (java.time.LocalDate d : visitDates) {
                if (d.equals(checkDate) || d.equals(checkDate.minusDays(1))) {
                    streak++;
                    checkDate = d.minusDays(1);
                } else if (d.isBefore(checkDate)) {
                    break;
                }
            }
        }

        // 4. Cours suivis (réservations avec statut PRESENT)
        List<com.happyfitness.erp.model.Reservation> reservations = reservationRepository.findByClientId(clientId);
        long coursSuivis = reservations.stream().filter(r -> "PRESENT".equals(r.getStatut())).count();
        long coursReserves = reservations.stream().filter(r -> !"ANNULEE".equals(r.getStatut())).count();

        // 5. Historique des 6 derniers mois (pour le graphique)
        List<Map<String, Object>> historiqueVisites = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDateTime moisDebut = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            java.time.LocalDateTime moisFin = moisDebut.plusMonths(1).minusSeconds(1);
            List<com.happyfitness.erp.model.Attendance> moisAtt = attendanceRepository.findByClientIdAndCheckInTimeBetween(clientId, moisDebut, moisFin);
            
            String[] nomsDesMois = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"};
            Map<String, Object> entry = new HashMap<>();
            entry.put("mois", nomsDesMois[moisDebut.getMonthValue() - 1]);
            entry.put("annee", moisDebut.getYear());
            entry.put("visites", moisAtt.size());
            historiqueVisites.add(entry);
        }

        // 6. Durée moyenne de session (si checkout disponible)
        double dureeMoyenneMinutes = allAttendances.stream()
                .filter(a -> a.getCheckOutTime() != null)
                .mapToLong(a -> java.time.Duration.between(a.getCheckInTime(), a.getCheckOutTime()).toMinutes())
                .average()
                .orElse(0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("visitesCeMois", visitesCeMois);
        stats.put("totalVisites", totalVisites);
        stats.put("streak", streak);
        stats.put("coursSuivis", coursSuivis);
        stats.put("coursReserves", coursReserves);
        stats.put("dureeMoyenneMinutes", Math.round(dureeMoyenneMinutes));
        stats.put("historiqueVisites", historiqueVisites);

        return ResponseEntity.ok(stats);
    }
}
