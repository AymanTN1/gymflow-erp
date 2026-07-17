package com.happyfitness.erp;

import com.happyfitness.erp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class DataSeederTest {

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    public void cleanUp() {
        attendanceRepository.deleteAll();
        membershipRepository.deleteAll();
        clientRepository.deleteAll();
        transactionRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    public void testDataSeedingSucceedsAndGeneratesCorrectQuantities() throws Exception {
        // Given: Empty database
        assertEquals(0, clientRepository.count());
        assertEquals(0, membershipRepository.count());
        assertEquals(0, attendanceRepository.count());
        assertEquals(0, transactionRepository.count());
        assertEquals(0, productRepository.count());

        // When: Run seeder
        dataSeeder.run();

        // Then: Defaults are populated
        assertTrue(productRepository.count() > 0, "Products should be seeded");
        assertTrue(clientRepository.count() >= 60, "At least 60 clients should be seeded");
        assertTrue(membershipRepository.count() > 0, "Memberships should be seeded");
        assertTrue(attendanceRepository.count() > 0, "Attendances should be seeded");
        assertTrue(transactionRepository.count() > 0, "Transactions should be seeded");

        // Verify realistic attendance hours peak (18:00 - 21:00 should have records)
        long eveningVisits = attendanceRepository.findAll().stream()
                .filter(a -> a.getCheckInTime().getHour() >= 18 && a.getCheckInTime().getHour() <= 21)
                .count();
        assertTrue(eveningVisits > 0, "There should be visits during evening peak hours");
    }
}
