package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByCourseIdAndDateReservation(Long courseId, LocalDate date);
    List<Reservation> findByClientId(Long clientId);
    List<Reservation> findByClientIdAndDateReservation(Long clientId, LocalDate date);
    List<Reservation> findByCourseIdAndDateReservationAndStatut(Long courseId, LocalDate date, String statut);
    long countByCourseIdAndDateReservationAndStatutNot(Long courseId, LocalDate date, String statut);
}
