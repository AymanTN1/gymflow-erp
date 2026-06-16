package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/checkin")
@CrossOrigin(origins = "*")
public class CheckinController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    // Liste des récepteurs SSE (les écrans de la Réception)
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Endpoint pour la Réception : S'abonner aux événements de pointage
     */
    @GetMapping("/stream")
    public SseEmitter streamCheckins() {
        // Durée de vie infinie (ou très longue) pour garder la connexion ouverte
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.emitters.add(emitter);

        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));
        emitter.onError((e) -> this.emitters.remove(emitter));

        return emitter;
    }

    /**
     * Endpoint pour le Client : Envoyer un scan
     */
    @PostMapping("/scan")
    public Map<String, Object> handleScan(@RequestBody Map<String, String> payload) {
        String codeScanne = payload.get("code");
        // En vrai, clientId viendrait du Token JWT de l'app client. Ici on simule avec un ID.
        // Pour la démo, on simule que le client ID 1 a scanné.
        Long clientId = Long.valueOf(payload.getOrDefault("clientId", "1"));

        // Vérifier le client
        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return Map.of("success", false, "message", "Client non trouvé");
        }

        // Vérifier l'abonnement
        List<Membership> memberships = membershipRepository.findByClientId(clientId);
        String status = "DANGER";
        String message = "Aucun abonnement valide";

        if (!memberships.isEmpty()) {
            Membership lastMembership = memberships.get(memberships.size() - 1);
            LocalDateTime now = LocalDateTime.now();
            
            if (lastMembership.getDateFin().isBefore(now)) {
                status = "DANGER";
                message = "Abonnement expiré le " + lastMembership.getDateFin().toLocalDate();
            } else if (lastMembership.getDateFin().isBefore(now.plusDays(5))) {
                status = "WARNING";
                message = "Expire bientôt (" + lastMembership.getDateFin().toLocalDate() + ")";
            } else {
                status = "SUCCESS";
                message = "Accès autorisé";
            }
        }

        // Envoyer l'événement à tous les écrans de la Réception connectés
        Map<String, Object> eventData = Map.of(
            "clientName", client.getNomComplet(),
            "status", status,
            "message", message,
            "time", LocalDateTime.now().toString()
        );

        sendEventToReception(eventData);

        return Map.of("success", true, "status", status);
    }

    private void sendEventToReception(Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("scanEvent").data(data));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
