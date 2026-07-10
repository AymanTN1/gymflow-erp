package com.happyfitness.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We can use a simple convention: "CLIENT:5" or "USER:2" to denote the sender/receiver type.
    // Or simpler: senderId and receiverId, and assume we only chat between Client and Coach (User).
    // Let's use senderType ("CLIENT" or "STAFF") and senderId, receiverType and receiverId.
    
    private String senderType; // "CLIENT" ou "STAFF"
    private Long senderId;
    
    private String receiverType; // "CLIENT" ou "STAFF"
    private Long receiverId;

    @Column(columnDefinition = "TEXT")
    private String content;
    
    private LocalDateTime dateEnvoi;
    private Boolean lu;

    public Message() {
        this.dateEnvoi = LocalDateTime.now();
        this.lu = false;
    }

    public Message(String senderType, Long senderId, String receiverType, Long receiverId, String content) {
        this.senderType = senderType;
        this.senderId = senderId;
        this.receiverType = receiverType;
        this.receiverId = receiverId;
        this.content = content;
        this.dateEnvoi = LocalDateTime.now();
        this.lu = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSenderType() { return senderType; }
    public void setSenderType(String senderType) { this.senderType = senderType; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getReceiverType() { return receiverType; }
    public void setReceiverType(String receiverType) { this.receiverType = receiverType; }

    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getDateEnvoi() { return dateEnvoi; }
    public void setDateEnvoi(LocalDateTime dateEnvoi) { this.dateEnvoi = dateEnvoi; }

    public Boolean getLu() { return lu; }
    public void setLu(Boolean lu) { this.lu = lu; }
}
