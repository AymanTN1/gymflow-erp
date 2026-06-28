package com.happyfitness.erp.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path profileStorageLocation;
    private final Path documentStorageLocation;

    public FileStorageService() {
        // Dossier pour les photos de profil (public/accessible)
        this.profileStorageLocation = Paths.get("uploads", "profiles").toAbsolutePath().normalize();
        // Dossier pour les pièces d'identité (privé/restreint)
        this.documentStorageLocation = Paths.get("uploads", "documents").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.profileStorageLocation);
            Files.createDirectories(this.documentStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directories where the uploaded files will be stored.", ex);
        }
    }

    public String storeProfilePhoto(MultipartFile file, Long id) {
        return storeFile(file, profileStorageLocation, "profile_" + id);
    }

    public String storeDocument(MultipartFile file, Long id) {
        return storeFile(file, documentStorageLocation, "cin_" + id);
    }

    private String storeFile(MultipartFile file, Path location, String prefix) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // Générer un nom de fichier unique : prefix_UUID.ext
        String fileName = prefix + "_" + UUID.randomUUID().toString() + fileExtension;

        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }

            Path targetLocation = location.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}
