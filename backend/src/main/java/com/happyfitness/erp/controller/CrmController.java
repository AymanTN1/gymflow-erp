package com.happyfitness.erp.controller;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import com.happyfitness.erp.repository.ClientRepository;
import com.happyfitness.erp.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm")
@CrossOrigin(origins = "*")
public class CrmController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @GetMapping("/winback")
    public List<Map<String, Object>> getWinBackClients() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Client> allClients = clientRepository.findAll();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime warningDate = now.plusDays(5);

        for (Client client : allClients) {
            List<Membership> memberships = membershipRepository.findByClientId(client.getId());
            if (memberships.isEmpty()) continue;
            
            // Trouver le dernier abonnement (le plus récent)
            Membership lastMembership = memberships.get(memberships.size() - 1);
            
            String status = "ACTIF";
            if (lastMembership.getDateFin().isBefore(now)) {
                status = "EXPIRE";
            } else if (lastMembership.getDateFin().isBefore(warningDate)) {
                status = "EXPIRE_BIENTOT";
            }

            // Seulement retourner ceux qui nécessitent une action CRM
            if (!status.equals("ACTIF")) {
                Map<String, Object> map = new HashMap<>();
                map.put("client", client);
                map.put("membership", lastMembership);
                map.put("crmStatus", status);
                result.add(map);
            }
        }
        
        return result;
    }
}
