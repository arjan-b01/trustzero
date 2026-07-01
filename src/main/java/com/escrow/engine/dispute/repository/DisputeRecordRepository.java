package com.escrow.engine.dispute.repository;

import com.escrow.engine.dispute.entity.DisputeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DisputeRecordRepository extends JpaRepository<DisputeRecord, Long> {
    Optional<DisputeRecord> findByEscrowId(Long escrowId);
}