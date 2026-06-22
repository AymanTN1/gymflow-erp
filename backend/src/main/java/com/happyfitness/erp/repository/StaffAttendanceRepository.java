package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.StaffAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {
    List<StaffAttendance> findByDate(LocalDate date);
    List<StaffAttendance> findByUserId(Long userId);
    List<StaffAttendance> findByUserIdAndDate(Long userId, LocalDate date);
    List<StaffAttendance> findByDateBetweenOrderByTimestampDesc(LocalDate start, LocalDate end);
    List<StaffAttendance> findAllByOrderByTimestampDesc();
}
