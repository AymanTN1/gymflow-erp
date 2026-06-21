package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Course;
import com.happyfitness.erp.model.Reservation;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.CourseRepository;
import com.happyfitness.erp.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ClientRepository clientRepository;

    // ============================
    // GESTION DES COURS (Admin)
    // ============================

    @GetMapping
    public List<Course> getAllCourses() {
        return courseRepository.findByActifTrue();
    }

    @GetMapping("/all")
    public List<Course> getAllCoursesIncludingInactive() {
        return courseRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourse(@PathVariable Long id) {
        return courseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        Course saved = courseRepository.save(course);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course courseData) {
        return courseRepository.findById(id).map(course -> {
            course.setNom(courseData.getNom());
            course.setCoach(courseData.getCoach());
            course.setJour(courseData.getJour());
            course.setHeureDebut(courseData.getHeureDebut());
            course.setHeureFin(courseData.getHeureFin());
            course.setCapaciteMax(courseData.getCapaciteMax());
            course.setSalle(courseData.getSalle());
            course.setCouleur(courseData.getCouleur());
            course.setActif(courseData.getActif());
            return ResponseEntity.ok(courseRepository.save(course));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        return courseRepository.findById(id).map(course -> {
            course.setActif(false); // Soft delete
            courseRepository.save(course);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cours désactivé"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ============================
    // PLANNING HEBDOMADAIRE
    // ============================

    @GetMapping("/planning")
    public Map<String, List<Course>> getWeeklyPlanning() {
        List<Course> courses = courseRepository.findByActifTrue();
        String[] jours = {"LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"};
        
        Map<String, List<Course>> planning = new LinkedHashMap<>();
        for (String jour : jours) {
            planning.put(jour, courses.stream()
                    .filter(c -> jour.equals(c.getJour()))
                    .sorted(Comparator.comparing(Course::getHeureDebut))
                    .collect(Collectors.toList()));
        }
        return planning;
    }

    // ============================
    // RÉSERVATIONS (Client)
    // ============================

    @GetMapping("/{courseId}/reservations")
    public ResponseEntity<?> getReservationsForCourse(@PathVariable Long courseId, @RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<Reservation> reservations = reservationRepository.findByCourseIdAndDateReservation(courseId, localDate);
        
        // Enrichir avec les noms des clients
        List<Map<String, Object>> enriched = reservations.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("clientId", r.getClientId());
            map.put("courseId", r.getCourseId());
            map.put("dateReservation", r.getDateReservation());
            map.put("statut", r.getStatut());
            map.put("clientNom", clientRepository.findById(r.getClientId())
                    .map(Client::getNomComplet).orElse("Inconnu"));
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/{courseId}/places-disponibles")
    public ResponseEntity<?> getAvailablePlaces(@PathVariable Long courseId, @RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) return ResponseEntity.notFound().build();
        
        long reserved = reservationRepository.countByCourseIdAndDateReservationAndStatutNot(courseId, localDate, "ANNULEE");
        long placesRestantes = course.getCapaciteMax() - reserved;
        
        return ResponseEntity.ok(Map.of(
            "capaciteMax", course.getCapaciteMax(),
            "reservees", reserved,
            "placesRestantes", Math.max(0, placesRestantes),
            "complet", placesRestantes <= 0
        ));
    }

    @PostMapping("/{courseId}/reserver")
    public ResponseEntity<?> reserverCours(@PathVariable Long courseId, @RequestBody Map<String, Object> payload) {
        Long clientId = Long.valueOf(payload.get("clientId").toString());
        LocalDate date = LocalDate.parse(payload.get("date").toString());
        
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Cours introuvable"));
        }
        
        // Vérifier les places
        long reserved = reservationRepository.countByCourseIdAndDateReservationAndStatutNot(courseId, date, "ANNULEE");
        if (reserved >= course.getCapaciteMax()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ce cours est complet !"));
        }
        
        // Vérifier si le client a déjà réservé ce cours ce jour-là
        List<Reservation> existing = reservationRepository.findByCourseIdAndDateReservation(courseId, date);
        boolean alreadyBooked = existing.stream()
                .anyMatch(r -> r.getClientId().equals(clientId) && !"ANNULEE".equals(r.getStatut()));
        if (alreadyBooked) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vous avez déjà réservé ce cours !"));
        }
        
        Reservation reservation = new Reservation();
        reservation.setClientId(clientId);
        reservation.setCourseId(courseId);
        reservation.setDateReservation(date);
        reservationRepository.save(reservation);
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Réservation confirmée ! 🎉"));
    }

    @PostMapping("/reservations/{resId}/annuler")
    public ResponseEntity<?> annulerReservation(@PathVariable Long resId) {
        return reservationRepository.findById(resId).map(reservation -> {
            reservation.setStatut("ANNULEE");
            reservationRepository.save(reservation);
            return ResponseEntity.ok(Map.of("success", true, "message", "Réservation annulée"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reservations/client/{clientId}")
    public List<Reservation> getClientReservations(@PathVariable Long clientId) {
        return reservationRepository.findByClientId(clientId);
    }

    // ============================
    // POINTAGE PAR COURS (Réception/Coach)
    // ============================

    @PostMapping("/reservations/{resId}/pointer")
    public ResponseEntity<?> pointerPresence(@PathVariable Long resId, @RequestBody Map<String, String> payload) {
        String statut = payload.get("statut"); // PRESENT ou ABSENT
        return reservationRepository.findById(resId).map(reservation -> {
            reservation.setStatut(statut);
            reservationRepository.save(reservation);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pointage enregistré : " + statut));
        }).orElse(ResponseEntity.notFound().build());
    }
}
