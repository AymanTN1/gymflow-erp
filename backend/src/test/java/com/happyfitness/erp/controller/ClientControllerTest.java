package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.*;
import com.happyfitness.erp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ClientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    private Client savedClient;
    private Membership activeMembership;
    private Membership expiredMembership;

    @BeforeEach
    public void setUp() {
        // Nettoyage de la base de données de test H2
        attendanceRepository.deleteAll();
        reservationRepository.deleteAll();
        membershipRepository.deleteAll();
        clientRepository.deleteAll();

        // Insertion d'un client de test
        Client client = new Client("Test Client JUnit", "junit@happyfitness.ma", "0612345678");
        client.setCin("AB12345");
        client.setStatut("ACTIF");
        savedClient = clientRepository.save(client);

        // Insertion d'un abonnement actif
        activeMembership = new Membership();
        activeMembership.setClientId(savedClient.getId());
        activeMembership.setTypeAbonnement("3 MOIS");
        activeMembership.setPrixPaye(600.0);
        activeMembership.setDateDebut(LocalDateTime.now().minusDays(10));
        activeMembership.setDateFin(LocalDateTime.now().plusDays(80));
        activeMembership.setStatut("ACTIF");
        membershipRepository.save(activeMembership);

        // Insertion d'un abonnement expiré historique
        expiredMembership = new Membership();
        expiredMembership.setClientId(savedClient.getId());
        expiredMembership.setTypeAbonnement("1 MOIS");
        expiredMembership.setPrixPaye(250.0);
        expiredMembership.setDateDebut(LocalDateTime.now().minusDays(45));
        expiredMembership.setDateFin(LocalDateTime.now().minusDays(15));
        expiredMembership.setStatut("EXPIRE");
        membershipRepository.save(expiredMembership);

        // Insertion de visites (attendances)
        Attendance att1 = new Attendance();
        att1.setClientId(savedClient.getId());
        att1.setCheckInTime(LocalDateTime.now().minusDays(2).withHour(10).withMinute(0));
        att1.setCheckOutTime(LocalDateTime.now().minusDays(2).withHour(11).withMinute(30));
        att1.setStatus("LEFT");
        attendanceRepository.save(att1);

        Attendance att2 = new Attendance();
        att2.setClientId(savedClient.getId());
        att2.setCheckInTime(LocalDateTime.now().minusDays(1).withHour(18).withMinute(30));
        att2.setStatus("PRESENT");
        attendanceRepository.save(att2);

        // Insertion de réservations
        Reservation res = new Reservation();
        res.setClientId(savedClient.getId());
        res.setCourseId(101L);
        res.setDateReservation(LocalDate.now());
        res.setStatut("PRESENT");
        reservationRepository.save(res);
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientProfile_Found() throws Exception {
        mockMvc.perform(get("/api/client/" + savedClient.getId() + "/profile"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(savedClient.getId().intValue())))
                .andExpect(jsonPath("$.nomComplet", is("Test Client JUnit")))
                .andExpect(jsonPath("$.email", is("junit@happyfitness.ma")))
                .andExpect(jsonPath("$.statut", is("ACTIF")))
                .andExpect(jsonPath("$.totalAbonnements", is(2)))
                .andExpect(jsonPath("$.abonnementActif.typeAbonnement", is("3 MOIS")));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientProfile_NotFound() throws Exception {
        mockMvc.perform(get("/api/client/999999/profile"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientInvoices_Found() throws Exception {
        mockMvc.perform(get("/api/client/" + savedClient.getId() + "/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].typeAbonnement", anyOf(is("3 MOIS"), is("1 MOIS"))))
                .andExpect(jsonPath("$[1].prixPaye", anyOf(is(600.0), is(250.0))));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientInvoices_NotFound() throws Exception {
        mockMvc.perform(get("/api/client/999999/invoices"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientStats_Found() throws Exception {
        mockMvc.perform(get("/api/client/" + savedClient.getId() + "/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVisites", is(2)))
                .andExpect(jsonPath("$.visitesCeMois", is(2)))
                .andExpect(jsonPath("$.coursSuivis", is(1)))
                .andExpect(jsonPath("$.dureeMoyenneMinutes", is(90)));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetClientStats_NotFound() throws Exception {
        mockMvc.perform(get("/api/client/999999/stats"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testDownloadInvoicePdf_Success() throws Exception {
        mockMvc.perform(get("/api/client/" + savedClient.getId() + "/invoices/" + activeMembership.getId() + "/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testDownloadInvoicePdf_NotFound() throws Exception {
        mockMvc.perform(get("/api/client/" + savedClient.getId() + "/invoices/999999/pdf"))
                .andExpect(status().isNotFound());
    }
}
