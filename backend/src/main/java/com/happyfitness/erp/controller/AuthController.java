package com.happyfitness.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        // Logique fictive pour le scaffolding
        if ("admin@happyfitness.com".equals(email) && "admin123".equals(password)) {
            return ResponseEntity.ok(Map.of(
                "token", "fake-jwt-token-admin",
                "role", "ADMIN",
                "redirect", "/admin"
            ));
        } else if ("reception@happyfitness.com".equals(email)) {
            return ResponseEntity.ok(Map.of(
                "token", "fake-jwt-token-reception",
                "role", "RECEPTIONIST",
                "redirect", "/reception"
            ));
        } else if ("coach@happyfitness.com".equals(email)) {
            return ResponseEntity.ok(Map.of(
                "token", "fake-jwt-token-coach",
                "role", "COACH",
                "redirect", "/coach"
            ));
        } else if ("client@happyfitness.com".equals(email)) {
            return ResponseEntity.ok(Map.of(
                "token", "fake-jwt-token-client",
                "role", "CLIENT",
                "redirect", "/client"
            ));
        }

        return ResponseEntity.status(401).body(Map.of("message", "Identifiants invalides"));
    }
}
