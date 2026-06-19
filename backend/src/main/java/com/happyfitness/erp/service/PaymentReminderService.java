package com.happyfitness.erp.service;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentReminderService {

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Tâche planifiée : vérifie chaque jour à 9h00 les abonnements 
     * expirant dans les 3 prochains jours et envoie un rappel par email.
     */
    @Scheduled(cron = "0 0 9 * * *") // Tous les jours à 9h00
    public void sendExpirationReminders() {
        System.out.println("🔔 [RAPPEL] Vérification des abonnements expirant bientôt...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysFromNow = now.plusDays(3);

        // Trouver les abonnements ACTIFS qui expirent dans les 3 prochains jours
        List<Membership> expiringMemberships = membershipRepository
                .findByStatutAndDateFinBetween("ACTIF", now, threeDaysFromNow);

        int emailsSent = 0;

        for (Membership membership : expiringMemberships) {
            Client client = clientRepository.findById(membership.getClientId()).orElse(null);
            
            if (client != null && client.getEmail() != null && !client.getEmail().isEmpty()) {
                try {
                    emailService.sendPaymentReminderEmail(client, membership);
                    emailsSent++;
                    System.out.println("📧 Rappel envoyé à : " + client.getEmail() + " (expire le " + membership.getDateFin() + ")");
                } catch (Exception e) {
                    System.err.println("❌ Erreur envoi rappel à " + client.getEmail() + ": " + e.getMessage());
                }
            }
        }

        System.out.println("🔔 [RAPPEL] Terminé : " + emailsSent + " rappels envoyés sur " + expiringMemberships.size() + " abonnements expirant bientôt.");
    }
}
