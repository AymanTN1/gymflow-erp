package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Notification;
import com.happyfitness.erp.repository.NotificationRepository;
import com.happyfitness.erp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    // S'abonner au flux SSE
    @GetMapping("/stream")
    public SseEmitter streamNotifications(@RequestParam String role) {
        return notificationService.subscribe(role);
    }

    // Récupérer l'historique des notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam String role) {
        // SUPER_ADMIN voit les notifications SUPER_ADMIN
        List<Notification> notifs = notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role);
        return ResponseEntity.ok(notifs);
    }

    // Récupérer uniquement les non lues
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@RequestParam String role) {
        List<Notification> notifs = notificationRepository.findByRecipientRoleAndIsReadFalseOrderByCreatedAtDesc(role);
        return ResponseEntity.ok(notifs);
    }

    // Marquer comme lue
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Notification notif = notificationRepository.findById(id).orElse(null);
        if (notif != null) {
            notif.setRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }
    
    // Marquer TOUT comme lu
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestParam String role) {
        List<Notification> unread = notificationRepository.findByRecipientRoleAndIsReadFalseOrderByCreatedAtDesc(role);
        for(Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
