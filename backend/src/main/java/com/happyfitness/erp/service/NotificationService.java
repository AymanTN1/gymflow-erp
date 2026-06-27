package com.happyfitness.erp.service;

import com.happyfitness.erp.model.Notification;
import com.happyfitness.erp.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // Map associant un rôle (ex: "RECEPTION") à une liste d'émetteurs SSE
    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String role) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.computeIfAbsent(role, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(role, emitter));
        emitter.onTimeout(() -> removeEmitter(role, emitter));
        emitter.onError((e) -> removeEmitter(role, emitter));

        // Envoi d'un événement initial pour s'assurer que la connexion est établie
        try {
            emitter.send(SseEmitter.event().name("init").data("Connected"));
        } catch (IOException e) {
            removeEmitter(role, emitter);
        }

        return emitter;
    }

    private void removeEmitter(String role, SseEmitter emitter) {
        List<SseEmitter> roleEmitters = emitters.get(role);
        if (roleEmitters != null) {
            roleEmitters.remove(emitter);
        }
    }

    public Notification sendNotification(String role, String message, String type) {
        // Sauvegarder en DB
        Notification notification = new Notification(role, message, type);
        Notification saved = notificationRepository.save(notification);

        // Diffuser en temps réel via SSE
        List<SseEmitter> roleEmitters = emitters.get(role);
        if (roleEmitters != null) {
            for (SseEmitter emitter : roleEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(saved));
                } catch (IOException e) {
                    roleEmitters.remove(emitter);
                }
            }
        }
        
        // Diffuser aussi à SUPER_ADMIN si la notif n'est pas déjà pour eux
        if (!"SUPER_ADMIN".equals(role)) {
            List<SseEmitter> adminEmitters = emitters.get("SUPER_ADMIN");
            if (adminEmitters != null) {
                for (SseEmitter emitter : adminEmitters) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("notification")
                                .data(saved));
                    } catch (IOException e) {
                        adminEmitters.remove(emitter);
                    }
                }
            }
        }

        return saved;
    }
}
