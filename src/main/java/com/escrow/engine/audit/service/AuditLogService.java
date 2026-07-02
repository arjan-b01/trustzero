package com.escrow.engine.audit.service;

import com.escrow.engine.audit.dto.AuditLogResponse;
import com.escrow.engine.audit.entity.AuditLog;
import com.escrow.engine.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void logFinancialAction(
            String action,
            Long performedById,
            Long walletId,
            Long escrowId,
            BigDecimal previousBalance,
            BigDecimal newBalance,
            String details) {

        AuditLog log = AuditLog.builder()
                .action(action)
                .performedById(performedById)
                .walletId(walletId)
                .escrowTransactionId(escrowId)
                .previousBalance(previousBalance)
                .newBalance(newBalance)
                .details(details)
                .build();

        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> getEscrowHistory(Long escrowId) {
        return auditLogRepository.findByEscrowTransactionIdOrderByTimestampAsc(escrowId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AuditLogResponse> getWalletHistory(Long walletId) {
        return auditLogRepository.findByWalletIdOrderByTimestampAsc(walletId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getAction(),
                log.getPerformedById(),
                log.getWalletId(),
                log.getEscrowTransactionId(),
                log.getPreviousBalance(),
                log.getNewBalance(),
                log.getDetails(),
                log.getTimestamp()
        );
    }

    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void logArbitrationEvent(String action, Long escrowId, Long adminId, String details) {
        com.escrow.engine.audit.entity.AuditLog log = com.escrow.engine.audit.entity.AuditLog.builder()
                .action(action)
                .performedById(adminId)
                .escrowTransactionId(escrowId)
                .details(details)
                // Leaving walletId and balance fields null since this isn't a direct financial movement
                .build();
        auditLogRepository.save(log);
    }
}