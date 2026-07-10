package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.TrainingProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Long> {
    List<TrainingProgram> findByClientId(Long clientId);
    List<TrainingProgram> findByCoachId(Long coachId);
}
