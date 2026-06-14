package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Payroll;
import com.happyfitness.erp.model.Transaction;
import com.happyfitness.erp.repository.PayrollRepository;
import com.happyfitness.erp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finances")
@CrossOrigin(origins = "*")
public class FinanceController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    // --- TRANSACTIONS ---
    
    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping("/transactions")
    public ResponseEntity<Transaction> addTransaction(@RequestBody Transaction transaction) {
        Transaction saved = transactionRepository.save(transaction);
        return ResponseEntity.ok(saved);
    }

    // --- PAYROLL (PAIE) ---

    @GetMapping("/payrolls")
    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    @PostMapping("/payrolls")
    public ResponseEntity<Payroll> addPayroll(@RequestBody Payroll payroll) {
        // Enregistrer la fiche de paie
        Payroll saved = payrollRepository.save(payroll);
        
        // Enregistrer automatiquement une transaction de dépense (EXPENSE) pour ce salaire
        Transaction transaction = new Transaction(
                "EXPENSE", 
                "SALAIRE", 
                saved.getTotalPaye(), 
                "Paie de " + saved.getNomEmploye() + " - " + saved.getMoisOuSemaine()
        );
        transactionRepository.save(transaction);
        
        return ResponseEntity.ok(saved);
    }
}
