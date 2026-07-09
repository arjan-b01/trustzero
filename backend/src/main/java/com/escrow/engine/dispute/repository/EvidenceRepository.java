package com.escrow.engine.dispute.repository;

import com.escrow.engine.dispute.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {
    List<Evidence> findByEscrowIdOrderByUploadedAtAsc(Long escrowId);
    List<Evidence> findByEscrowIdAndPartyOrderByUploadedAtAsc(Long escrowId, String party);
}