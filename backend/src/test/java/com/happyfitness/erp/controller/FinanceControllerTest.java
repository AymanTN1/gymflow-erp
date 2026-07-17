package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Payroll;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.PayrollRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FinanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        transactionRepository.deleteAll();
        payrollRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetAllTransactions() throws Exception {
        Transaction t = new Transaction("INCOME", "ABONNEMENT", 300.0, "Membership");
        transactionRepository.save(t);

        mockMvc.perform(get("/api/finances/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].montant", is(300.0)))
                .andExpect(jsonPath("$[0].type", is("INCOME")));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testAddTransaction() throws Exception {
        String json = "{\"type\":\"EXPENSE\",\"categorie\":\"MATERIEL\",\"montant\":1200.0,\"description\":\"New dumbbells purchase\"}";

        mockMvc.perform(post("/api/finances/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.montant", is(1200.0)))
                .andExpect(jsonPath("$.categorie", is("MATERIEL")));

        assertEquals(1, transactionRepository.count());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetAllPayrolls() throws Exception {
        Payroll payroll = new Payroll();
        payroll.setNomEmploye("JUnit Coach");
        payroll.setMoisOuSemaine("2026-07");
        payroll.setTotalPaye(4500.0);
        payrollRepository.save(payroll);

        mockMvc.perform(get("/api/finances/payrolls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nomEmploye", is("JUnit Coach")))
                .andExpect(jsonPath("$[0].totalPaye", is(4500.0)));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testAddPayrollGeneratesTransaction() throws Exception {
        String json = "{\"nomEmploye\":\"Amine Coach\",\"moisOuSemaine\":\"2026-07\",\"totalPaye\":5000.0}";

        mockMvc.perform(post("/api/finances/payrolls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.nomEmploye", is("Amine Coach")));

        // Verify that a payroll was saved
        assertEquals(1, payrollRepository.count());

        // Verify that a corresponding expense transaction was automatically created
        assertEquals(1, transactionRepository.count());
        Transaction expense = transactionRepository.findAll().get(0);
        assertEquals("EXPENSE", expense.getType());
        assertEquals("SALAIRE", expense.getCategorie());
        assertEquals(5000.0, expense.getMontant());
        assertTrue(expense.getDescription().contains("Amine Coach"));
    }
}
