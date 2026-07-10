package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.TrainingProgram;
import com.happyfitness.erp.repository.TrainingProgramRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
@CrossOrigin(origins = "*")
public class TrainingProgramController {

    @Autowired
    private TrainingProgramRepository programRepository;

    @GetMapping("/client/{clientId}")
    public List<TrainingProgram> getProgramsForClient(@PathVariable Long clientId) {
        return programRepository.findByClientId(clientId);
    }

    @GetMapping("/coach/{coachId}")
    public List<TrainingProgram> getProgramsByCoach(@PathVariable Long coachId) {
        return programRepository.findByCoachId(coachId);
    }

    @PostMapping
    public ResponseEntity<TrainingProgram> createProgram(@RequestBody TrainingProgram program) {
        return ResponseEntity.ok(programRepository.save(program));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProgram(@PathVariable Long id) {
        programRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }
}
