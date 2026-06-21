package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByDateVenteBetween(LocalDateTime start, LocalDateTime end);
    List<Sale> findByProductId(Long productId);
}
