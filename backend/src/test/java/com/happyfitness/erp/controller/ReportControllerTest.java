package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository transactionRepository;

    @BeforeEach
    public void setUp() {
        transactionRepository.deleteAll();

        // Income current month
        Transaction t1 = new Transaction("INCOME", "ABONNEMENT", 1500.0, "Premium yearly membership");
        t1.setDateTransaction(LocalDateTime.now());
        transactionRepository.save(t1);

        // Expense current month
        Transaction t2 = new Transaction("EXPENSE", "SALAIRE", 500.0, "Part time coach salary");
        t2.setDateTransaction(LocalDateTime.now());
        transactionRepository.save(t2);

        // Income last month
        Transaction t3 = new Transaction("INCOME", "ABONNEMENT", 1000.0, "Last month membership");
        t3.setDateTransaction(LocalDateTime.now().minusMonths(1));
        transactionRepository.save(t3);
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetFinancialEvolution() throws Exception {
        mockMvc.perform(get("/api/reports/evolution"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].Revenus", notNullValue()))
                .andExpect(jsonPath("$[0].Dépenses", notNullValue()))
                .andExpect(jsonPath("$[0].Benefice", notNullValue()));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testExportCsv() throws Exception {
        mockMvc.perform(get("/api/reports/export/csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("rapport_financier.csv")))
                .andExpect(content().string(containsString("Montant (DH)")))
                .andExpect(content().string(containsString("ABONNEMENT")));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testExportPdf() throws Exception {
        mockMvc.perform(get("/api/reports/export/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }
}
