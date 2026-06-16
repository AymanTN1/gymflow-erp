package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Attendance;
import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.AttendanceRepository;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/checkin")
@CrossOrigin(origins = "*")
public class CheckinController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;

    // Liste des récepteurs SSE (les écrans de la Réception)
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping("/stream")
    public SseEmitter streamCheckins() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.emitters.add(emitter);
        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));
        emitter.onError((e) -> this.emitters.remove(emitter));
        return emitter;
    }

    @GetMapping("/active-count")
    public Map<String, Long> getActiveCount() {
        return Map.of("count", attendanceRepository.countByStatus("PRESENT"));
    }

    @PostMapping("/scan")
    public Map<String, Object> handleScan(@RequestBody Map<String, String> payload) {
        Long clientId = Long.valueOf(payload.getOrDefault("clientId", "1"));

        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return Map.of("success", false, "message", "Client non trouvé");
        }

        // Vérifier si le client est DÉJÀ PRÉSENT
        Optional<Attendance> currentAttendance = attendanceRepository.findTopByClientIdAndStatusOrderByCheckInTimeDesc(clientId, "PRESENT");
        
        if (currentAttendance.isPresent()) {
            // LOGIQUE DE SORTIE (CHECK-OUT)
            Attendance attendance = currentAttendance.get();
            attendance.setCheckOutTime(LocalDateTime.now());
            attendance.setStatus("LEFT");
            attendanceRepository.save(attendance);
            
            broadcastEvent("scanEvent", Map.of(
                "clientName", client.getNomComplet(),
                "status", "SUCCESS",
                "message", "Au revoir ! Sortie enregistrée.",
                "time", LocalDateTime.now().toString()
            ));
            broadcastCountUpdate();
            
            return Map.of("success", true, "status", "SUCCESS", "message", "Sortie enregistrée");
        }

        // LOGIQUE D'ENTRÉE (CHECK-IN)
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
                message = "Accès autorisé (Entrée)";
            }
        }

        if ("SUCCESS".equals(status) || "WARNING".equals(status)) {
            Attendance newAttendance = new Attendance();
            newAttendance.setClientId(clientId);
            newAttendance.setCheckInTime(LocalDateTime.now());
            newAttendance.setStatus("PRESENT");
            attendanceRepository.save(newAttendance);
        }

        broadcastEvent("scanEvent", Map.of(
            "clientName", client.getNomComplet(),
            "status", status,
            "message", message,
            "time", LocalDateTime.now().toString()
        ));
        broadcastCountUpdate();

        return Map.of("success", true, "status", status);
    }

    private void broadcastCountUpdate() {
        long count = attendanceRepository.countByStatus("PRESENT");
        broadcastEvent("countUpdate", Map.of("count", count));
    }

    private void broadcastEvent(String eventName, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
