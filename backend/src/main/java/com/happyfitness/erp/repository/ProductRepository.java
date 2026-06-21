package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActifTrue();
    List<Product> findByCategorieAndActifTrue(String categorie);
    List<Product> findByStockActuelLessThanEqualAndActifTrue(Integer stockMin);
}
