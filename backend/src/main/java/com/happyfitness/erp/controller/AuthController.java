package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.User;
import com.happyfitness.erp.repository.UserRepository;
import com.happyfitness.erp.security.JwtUtils;
import com.happyfitness.erp.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.get("email"), loginRequest.get("password")));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        String role = roles.get(0).replace("ROLE_", "");
        String redirect = "/login";
        if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) redirect = "/admin";
        else if ("RECEPTION".equals(role)) redirect = "/reception";
        else if ("COACH".equals(role)) redirect = "/coach";
        else if ("CLIENT".equals(role)) redirect = "/client";

        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "id", userDetails.getId(),
                "nom", userDetails.getNom(),
                "email", userDetails.getUsername(),
                "role", role,
                "redirect", redirect
        ));
    }

    @PostMapping("/setup-admin")
    public ResponseEntity<?> setupInitialAdmin() {
        if (userRepository.existsByEmail("admin@gymflow.com")) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'administrateur existe déjà."));
        }

        User user = new User("Admin GymFlow", "admin@gymflow.com", encoder.encode("admin123"), "SUPER_ADMIN");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Compte administrateur créé avec succès ! (Email: admin@gymflow.com, Password: admin123)"));
    }

    @PostMapping("/reset-demo-passwords")
    public ResponseEntity<?> resetDemoPasswords() {
        int updated = 0;
        
        var adminOpt = userRepository.findByEmail("admin@happyfitness.ma");
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            admin.setMotDePasse(encoder.encode("admin123"));
            userRepository.save(admin);
            updated++;
        }

        var coachOpt = userRepository.findByEmail("youssef@happyfitness.ma");
        if (coachOpt.isPresent()) {
            User coach = coachOpt.get();
            coach.setMotDePasse(encoder.encode("coach123"));
            userRepository.save(coach);
            updated++;
        }

        var recOpt = userRepository.findByEmail("sara@happyfitness.ma");
        if (recOpt.isPresent()) {
            User rec = recOpt.get();
            rec.setMotDePasse(encoder.encode("rec123"));
            userRepository.save(rec);
            updated++;
        }

        return ResponseEntity.ok(Map.of("message", updated + " mot(s) de passe réinitialisé(s) avec succès."));
    }
}
