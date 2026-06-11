package com.escrow.engine.audit.repository;

import com.escrow.engine.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByWalletIdOrderByTimestampAsc(Long walletId);
    List<AuditLog> findByEscrowTransactionIdOrderByTimestampAsc(Long escrowTransactionId);
}

