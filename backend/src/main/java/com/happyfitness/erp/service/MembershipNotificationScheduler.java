package com.happyfitness.erp.service;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MembershipNotificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MembershipNotificationScheduler.class);

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    // S'exécute tous les jours à 08h00 du matin
    // Pour les tests, on peut le faire tourner plus souvent si besoin, mais 08h00 est la norme.
    @Scheduled(cron = "0 0 8 * * *")
    public void sendExpiryWarnings() {
        logger.info("Début de la vérification des abonnements expirant dans 3 jours...");

        LocalDate targetDate = LocalDate.now().plusDays(3);
        List<Membership> expiringMemberships = membershipRepository.findAll(); // Idéalement via query personnalisée
        
        int count = 0;
        for (Membership membership : expiringMemberships) {
            if ("ACTIF".equals(membership.getStatut()) && membership.getDateFin().equals(targetDate)) {
                Client client = clientRepository.findById(membership.getClientId()).orElse(null);
                if (client != null && client.getEmail() != null) {
                    emailService.sendMembershipExpiryWarning(client.getEmail(), client.getNomComplet(), targetDate);
                    notificationService.sendNotification("RECEPTION", "L'abonnement de " + client.getNomComplet() + " expire dans 3 jours.", "WARNING");
                    count++;
                }
            }
        }
        
        logger.info("Vérification terminée. {} emails de relance envoyés.", count);
    }
}
