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
import java.util.*;
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

    @GetMapping("/stats")
    public Map<String, Object> getCheckinStats() {
        List<Attendance> attendances = attendanceRepository.findAll();
        
        // 1. Répartition par heure (06h00 - 23h00)
        Map<Integer, Long> hourlyStats = new TreeMap<>();
        for (int h = 6; h <= 23; h++) {
            hourlyStats.put(h, 0L);
        }
        
        // 2. Répartition par jour de la semaine
        Map<String, Long> dailyStats = new LinkedHashMap<>();
        String[] days = {"LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"};
        for (String day : days) {
            dailyStats.put(day, 0L);
        }

        long totalCheckins = attendances.size();
        long totalDurationMinutes = 0;
        long durationCount = 0;

        for (Attendance a : attendances) {
            if (a.getCheckInTime() != null) {
                int hour = a.getCheckInTime().getHour();
                if (hour >= 6 && hour <= 23) {
                    hourlyStats.put(hour, hourlyStats.get(hour) + 1);
                }
                
                java.time.DayOfWeek dayOfWeek = a.getCheckInTime().getDayOfWeek();
                String dayFr = convertDayOfWeekToFr(dayOfWeek);
                if (dailyStats.containsKey(dayFr)) {
                    dailyStats.put(dayFr, dailyStats.get(dayFr) + 1);
                }
            }

            if (a.getCheckInTime() != null && a.getCheckOutTime() != null) {
                long minutes = java.time.Duration.between(a.getCheckInTime(), a.getCheckOutTime()).toMinutes();
                if (minutes > 0 && minutes < 360) {
                    totalDurationMinutes += minutes;
                    durationCount++;
                }
            }
        }

        double avgDuration = durationCount > 0 ? (double) totalDurationMinutes / durationCount : 0.0;
        avgDuration = Math.round(avgDuration * 100.0) / 100.0;

        List<Map<String, Object>> hourlyList = new ArrayList<>();
        for (Map.Entry<Integer, Long> entry : hourlyStats.entrySet()) {
            hourlyList.add(Map.of(
                "hour", String.format("%02dh00", entry.getKey()),
                "entrees", entry.getValue()
            ));
        }

        List<Map<String, Object>> dailyList = new ArrayList<>();
        for (Map.Entry<String, Long> entry : dailyStats.entrySet()) {
            dailyList.add(Map.of(
                "day", entry.getKey(),
                "entrees", entry.getValue()
            ));
        }

        return Map.of(
            "totalCheckins", totalCheckins,
            "avgDurationMinutes", avgDuration,
            "hourlyDistribution", hourlyList,
            "dailyDistribution", dailyList
        );
    }

    private String convertDayOfWeekToFr(java.time.DayOfWeek day) {
        switch (day) {
            case MONDAY: return "LUNDI";
            case TUESDAY: return "MARDI";
            case WEDNESDAY: return "MERCREDI";
            case THURSDAY: return "JEUDI";
            case FRIDAY: return "VENDREDI";
            case SATURDAY: return "SAMEDI";
            case SUNDAY: return "DIMANCHE";
            default: return "LUNDI";
        }
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
