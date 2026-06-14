package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    List<Membership> findByClientId(Long clientId);
    List<Membership> findByStatut(String statut);
}
