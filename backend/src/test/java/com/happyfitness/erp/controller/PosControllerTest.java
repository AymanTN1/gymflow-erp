package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Product;
import com.happyfitness.erp.model.Sale;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.ProductRepository;
import com.happyfitness.erp.repository.SaleRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private Gson gson = new Gson();
    private Product savedProduct;

    @BeforeEach
    public void setUp() {
        saleRepository.deleteAll();
        productRepository.deleteAll();
        transactionRepository.deleteAll();

        Product product = new Product();
        product.setNom("Proteine Barre");
        product.setCategorie("SUPPLEMENT");
        product.setPrixAchat(10.0);
        product.setPrixVente(18.0);
        product.setStockActuel(50);
        product.setStockMin(5);
        product.setActif(true);
        savedProduct = productRepository.save(product);
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testGetAllProducts() throws Exception {
        mockMvc.perform(get("/api/pos/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nom", is("Proteine Barre")))
                .andExpect(jsonPath("$[0].actif", is(true)));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testCreateProductWithStockGeneratesExpense() throws Exception {
        Product p = new Product();
        p.setNom("Bouteille Eau");
        p.setCategorie("BOISSON");
        p.setPrixAchat(2.0);
        p.setPrixVente(6.0);
        p.setStockActuel(100);
        p.setStockMin(10);
        p.setActif(true);

        String json = gson.toJson(p);

        mockMvc.perform(post("/api/pos/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.nom", is("Bouteille Eau")));

        // Check product count is 2
        assertEquals(2, productRepository.count());

        // Check transaction generated (100 * 2.0 = 200.0 EXPENSE)
        List<Transaction> transactions = transactionRepository.findAll();
        assertEquals(1, transactions.size());
        Transaction t = transactions.get(0);
        assertEquals("EXPENSE", t.getType());
        assertEquals("ACHAT_STOCK", t.getCategorie());
        assertEquals(200.0, t.getMontant());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testUpdateProduct() throws Exception {
        Product updateData = new Product();
        updateData.setNom("Proteine Barre V2");
        updateData.setCategorie("SUPPLEMENT");
        updateData.setPrixAchat(12.0);
        updateData.setPrixVente(20.0);
        updateData.setStockActuel(40);
        updateData.setStockMin(3);

        String json = gson.toJson(updateData);

        mockMvc.perform(put("/api/pos/products/" + savedProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom", is("Proteine Barre V2")))
                .andExpect(jsonPath("$.prixVente", is(20.0)));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testDeleteProduct() throws Exception {
        mockMvc.perform(delete("/api/pos/products/" + savedProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Product should not be deleted from DB, just marked as inactive
        Product p = productRepository.findById(savedProduct.getId()).orElse(null);
        assertFalse(p.getActif());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testRestockProductGeneratesExpense() throws Exception {
        Map<String, Integer> payload = new HashMap<>();
        payload.put("quantite", 20);
        String json = gson.toJson(payload);

        mockMvc.perform(post("/api/pos/products/" + savedProduct.getId() + "/restock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.newStock", is(70)));

        // Verify database stock
        Product p = productRepository.findById(savedProduct.getId()).orElse(null);
        assertEquals(70, p.getStockActuel());

        // Verify transaction generated (20 * 10.0 = 200.0 EXPENSE)
        List<Transaction> transactions = transactionRepository.findAll();
        assertEquals(1, transactions.size());
        Transaction t = transactions.get(0);
        assertEquals("EXPENSE", t.getType());
        assertEquals("ACHAT_STOCK", t.getCategorie());
        assertEquals(200.0, t.getMontant());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testSellProductSuccess() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", savedProduct.getId());
        payload.put("quantite", 2);
        payload.put("vendeur", "Test Vendeur");
        String json = gson.toJson(payload);

        mockMvc.perform(post("/api/pos/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.stockRestant", is(48)));

        // Verify database stock decrement
        Product p = productRepository.findById(savedProduct.getId()).orElse(null);
        assertEquals(48, p.getStockActuel());

        // Verify Sale created
        List<Sale> sales = saleRepository.findAll();
        assertEquals(1, sales.size());
        Sale sale = sales.get(0);
        assertEquals(2, sale.getQuantite());
        assertEquals(36.0, sale.getTotal());

        // Verify Transaction created (36.0 INCOME VENTE_BUVETTE)
        List<Transaction> transactions = transactionRepository.findAll();
        assertEquals(1, transactions.size());
        Transaction t = transactions.get(0);
        assertEquals("INCOME", t.getType());
        assertEquals("VENTE_BUVETTE", t.getCategorie());
        assertEquals(36.0, t.getMontant());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testSellProductInsufficientStock() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", savedProduct.getId());
        payload.put("quantite", 100); // 100 > 50 stock
        String json = gson.toJson(payload);

        mockMvc.perform(post("/api/pos/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("insuffisant")));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testRegisterDayPassSuccess() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clientName", "Omar Tantani");
        payload.put("prix", 50.0);
        payload.put("vendeur", "Test Vendeur");
        payload.put("telephone", "0612121212");
        String json = gson.toJson(payload);

        mockMvc.perform(post("/api/pos/day-pass")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.saleId", notNullValue()));

        // Verify Sale created
        List<Sale> sales = saleRepository.findAll();
        assertEquals(1, sales.size());
        Sale sale = sales.get(0);
        assertNull(sale.getProductId());
        assertEquals("Pass Journée - Omar Tantani", sale.getProductNom());

        // Verify Transaction created (50.0 INCOME PASS_JOURNEE)
        List<Transaction> transactions = transactionRepository.findAll();
        assertEquals(1, transactions.size());
        Transaction t = transactions.get(0);
        assertEquals("INCOME", t.getType());
        assertEquals("PASS_JOURNEE", t.getCategorie());
        assertEquals(50.0, t.getMontant());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
    public void testRegisterDayPassInvalidPrice() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clientName", "Omar Tantani");
        payload.put("prix", -10.0); // negative price
        String json = gson.toJson(payload);

        mockMvc.perform(post("/api/pos/day-pass")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("supérieur à 0")));
    }
}
