package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Course;
import com.happyfitness.erp.model.Reservation;
import com.happyfitness.erp.model.StaffAttendance;
import com.happyfitness.erp.model.User;
import com.happyfitness.erp.repository.CourseRepository;
import com.happyfitness.erp.repository.ReservationRepository;
import com.happyfitness.erp.repository.StaffAttendanceRepository;
import com.happyfitness.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rh")
@CrossOrigin(origins = "*")
public class RhController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private StaffAttendanceRepository staffAttendanceRepository;

    // ============================
    // GESTION DU STAFF
    // ============================

    @GetMapping("/staff")
    public List<Map<String, Object>> getStaffList() {
        List<User> staff = userRepository.findAll().stream()
                .filter(u -> !"CLIENT".equals(u.getRole()))
                .collect(Collectors.toList());

        return staff.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nom", u.getNom());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("dateCreation", u.getDateCreation());
            map.put("salaireBase", u.getSalaireBase());
            map.put("commissionParCours", u.getCommissionParCours());
            return map;
        }).collect(Collectors.toList());
    }

    // Mettre à jour salaire et commission
    @PutMapping("/staff/{id}/compensation")
    public ResponseEntity<?> updateCompensation(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return userRepository.findById(id).map(user -> {
            if (payload.containsKey("salaireBase")) {
                user.setSalaireBase(Double.valueOf(payload.get("salaireBase").toString()));
            }
            if (payload.containsKey("commissionParCours")) {
                user.setCommissionParCours(Double.valueOf(payload.get("commissionParCours").toString()));
            }
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Compensation mise à jour"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ============================
    // CALCUL DE PAIE MENSUELLE
    // ============================

    @GetMapping("/staff/{id}/payroll")
    public ResponseEntity<?> getMonthlyPayroll(@PathVariable Long id, @RequestParam(required = false) String month) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        YearMonth ym = month != null ? YearMonth.parse(month) : YearMonth.now();
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        double salaireBase = user.getSalaireBase() != null ? user.getSalaireBase() : 0;
        double commissionUnit = user.getCommissionParCours() != null ? user.getCommissionParCours() : 0;

        // Compter les cours donnés ce mois-ci (cours dont le coach est ce user, et qui ont eu des réservations)
        int coursCount = 0;
        if ("COACH".equals(user.getRole()) && commissionUnit > 0) {
            List<Course> courses = courseRepository.findByCoachAndActifTrue(user.getNom());
            for (Course course : courses) {
                // Compter les jours distincts où ce cours a eu des réservations ce mois
                for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                    String jourDuDate = date.getDayOfWeek().name();
                    // Mapper les noms anglais vers les noms français
                    String jourFr = mapJourToFr(jourDuDate);
                    if (jourFr.equals(course.getJour())) {
                        long reservations = reservationRepository.countByCourseIdAndDateReservationAndStatutNot(
                                course.getId(), date, "ANNULEE");
                        if (reservations > 0) {
                            coursCount++;
                        }
                    }
                }
            }
        }

        double totalCommission = commissionUnit * coursCount;
        double totalPaie = salaireBase + totalCommission;

        Map<String, Object> payroll = new LinkedHashMap<>();
        payroll.put("userId", user.getId());
        payroll.put("nom", user.getNom());
        payroll.put("role", user.getRole());
        payroll.put("mois", ym.toString());
        payroll.put("salaireBase", salaireBase);
        payroll.put("commissionParCours", commissionUnit);
        payroll.put("nbCoursEffectues", coursCount);
        payroll.put("totalCommission", totalCommission);
        payroll.put("totalPaie", totalPaie);

        return ResponseEntity.ok(payroll);
    }

    // Paie de tous les membres du staff
    @GetMapping("/payroll")
    public List<Map<String, Object>> getAllPayroll(@RequestParam(required = false) String month) {
        List<User> staff = userRepository.findAll().stream()
                .filter(u -> !"CLIENT".equals(u.getRole()))
                .collect(Collectors.toList());

        return staff.stream().map(u -> {
            ResponseEntity<?> resp = getMonthlyPayroll(u.getId(), month);
            return (Map<String, Object>) resp.getBody();
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    private String mapJourToFr(String englishDay) {
        return switch (englishDay) {
            case "MONDAY" -> "LUNDI";
            case "TUESDAY" -> "MARDI";
            case "WEDNESDAY" -> "MERCREDI";
            case "THURSDAY" -> "JEUDI";
            case "FRIDAY" -> "VENDREDI";
            case "SATURDAY" -> "SAMEDI";
            case "SUNDAY" -> "DIMANCHE";
            default -> "";
        };
    }

    // ============================
    // POINTAGE DU STAFF
    // ============================

    @PostMapping("/attendance/checkin")
    public ResponseEntity<?> checkin(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String type = payload.getOrDefault("type", "IN").toString(); // IN ou OUT

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        StaffAttendance att = new StaffAttendance();
        att.setUserId(userId);
        att.setUserName(user.getNom());
        att.setType(type);
        staffAttendanceRepository.save(att);

        String label = "IN".equals(type) ? "Arrivée" : "Départ";
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", label + " enregistrée à " + att.getTimestamp().toLocalTime().toString().substring(0, 5),
            "timestamp", att.getTimestamp()
        ));
    }

    @GetMapping("/attendance/today")
    public List<StaffAttendance> getTodayAttendance() {
        return staffAttendanceRepository.findByDate(LocalDate.now());
    }

    @GetMapping("/attendance")
    public List<StaffAttendance> getAllAttendance() {
        return staffAttendanceRepository.findAllByOrderByTimestampDesc();
    }

    @GetMapping("/attendance/user/{userId}")
    public List<StaffAttendance> getUserAttendance(@PathVariable Long userId) {
        return staffAttendanceRepository.findByUserId(userId);
    }
}
