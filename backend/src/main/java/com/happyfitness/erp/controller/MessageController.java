package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Message;
import com.happyfitness.erp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @GetMapping("/conversation")
    public List<Message> getConversation(
            @RequestParam String type1, @RequestParam Long id1,
            @RequestParam String type2, @RequestParam Long id2) {
        
        List<Message> messages = messageRepository.findConversation(type1, id1, type2, id2);
        
        // Marquer les messages comme lus pour celui qui les récupère
        // On suppose que l'appelant est (type1, id1) et qu'il lit les messages envoyés par (type2, id2)
        boolean changed = false;
        for (Message m : messages) {
            if (m.getReceiverType().equals(type1) && m.getReceiverId().equals(id1) && !m.getLu()) {
                m.setLu(true);
                changed = true;
            }
        }
        if (changed) {
            messageRepository.saveAll(messages);
        }
        
        return messages;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Message message) {
        Message saved = messageRepository.save(message);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadCount(@RequestParam String type, @RequestParam Long id) {
        List<Message> unread = messageRepository.findByReceiverTypeAndReceiverIdAndLuFalse(type, id);
        return ResponseEntity.ok(java.util.Map.of("count", unread.size()));
    }
}
