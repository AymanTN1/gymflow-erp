package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String role);
    List<Notification> findByRecipientRoleAndIsReadFalseOrderByCreatedAtDesc(String role);
}
