package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByType(String type);
    List<Transaction> findByDateTransactionBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<Transaction> findAllByOrderByDateTransactionDesc();
}
