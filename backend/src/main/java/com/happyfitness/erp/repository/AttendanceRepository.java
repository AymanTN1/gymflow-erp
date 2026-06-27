package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findTopByClientIdAndStatusOrderByCheckInTimeDesc(Long clientId, String status);
    List<Attendance> findByStatus(String status);
    long countByStatus(String status);
    List<Attendance> findByClientIdOrderByCheckInTimeDesc(Long clientId);
    List<Attendance> findByClientIdAndCheckInTimeBetween(Long clientId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
