package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByEmployeId(Long employeId);
}
