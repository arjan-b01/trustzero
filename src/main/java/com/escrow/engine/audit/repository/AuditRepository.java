package com.escrow.engine.audit.repository;

import com.escrow.engine.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuditRepository extends JpaRepository<AuditLog, Long> {
    Optional<AuditLog> findByEscrowTransactionId(Long transactionId);
}
