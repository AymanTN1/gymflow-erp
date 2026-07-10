package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Trouver les messages entre deux utilisateurs spécifiques
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderType = :type1 AND m.senderId = :id1 AND m.receiverType = :type2 AND m.receiverId = :id2) " +
           "OR " +
           "(m.senderType = :type2 AND m.senderId = :id2 AND m.receiverType = :type1 AND m.receiverId = :id1) " +
           "ORDER BY m.dateEnvoi ASC")
    List<Message> findConversation(@Param("type1") String type1, @Param("id1") Long id1, 
                                   @Param("type2") String type2, @Param("id2") Long id2);

    // Trouver les messages non lus pour un destinataire
    List<Message> findByReceiverTypeAndReceiverIdAndLuFalse(String receiverType, Long receiverId);
}
