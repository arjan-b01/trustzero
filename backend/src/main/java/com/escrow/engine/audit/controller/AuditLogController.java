package com.escrow.engine.audit.controller;

import com.escrow.engine.audit.dto.AuditLogResponse;
import com.escrow.engine.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/escrow/{escrowId}")
    public ResponseEntity<List<AuditLogResponse>> getEscrowHistory(@PathVariable Long escrowId) {
        return ResponseEntity.ok(auditLogService.getEscrowHistory(escrowId));
    }

    @GetMapping("/wallet/{walletId}")
    public ResponseEntity<List<AuditLogResponse>> getWalletHistory(@PathVariable Long walletId) {
        return ResponseEntity.ok(auditLogService.getWalletHistory(walletId));
    }
}