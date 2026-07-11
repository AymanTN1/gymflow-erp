package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.User;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.UserRepository;
import com.happyfitness.erp.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    // Endpoint pour uploader photo et CIN d'un client. RESTREINT AU STAFF
    @PostMapping("/client/{clientId}")
    public ResponseEntity<?> uploadClientDocuments(
            @PathVariable Long clientId,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "cin", required = false) MultipartFile cinDocument) {

        Client client = clientRepository.findById(clientId).orElse(null);
        if (client == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, String> response = new HashMap<>();

        try {
            if (photo != null && !photo.isEmpty()) {
                String photoName = fileStorageService.storeProfilePhoto(photo, clientId);
                String photoUrl = "/uploads/profiles/" + photoName;
                client.setPhotoUrl(photoUrl);
                response.put("photoUrl", photoUrl);
            }

            if (cinDocument != null && !cinDocument.isEmpty()) {
                String cinName = fileStorageService.storeDocument(cinDocument, clientId);
                client.setCinDocumentUrl(cinName);
                response.put("cinDocumentUrl", cinName);
            }

            clientRepository.save(client);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'upload : " + e.getMessage()));
        }
    }

    // Endpoint pour uploader la photo de profil d'un collaborateur (Staff)
    @PostMapping("/user/{userId}")
    public ResponseEntity<?> uploadUserPhoto(
            @PathVariable Long userId,
            @RequestParam("photo") MultipartFile photo) {

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            if (photo != null && !photo.isEmpty()) {
                String photoName = fileStorageService.storeProfilePhoto(photo, userId);
                String photoUrl = "/uploads/profiles/" + photoName;
                user.setPhotoUrl(photoUrl);
                userRepository.save(user);
                
                return ResponseEntity.ok(Map.of("photoUrl", photoUrl));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'upload photo : " + e.getMessage()));
        }
    }
}
