package com.escrow.engine.arbitration.controller;

import com.escrow.engine.arbitration.dto.ArbitrationResult;
import com.escrow.engine.arbitration.service.DisputeArbitrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
public class DisputeArbitrationController {

    private final DisputeArbitrationService arbitrationService;

    @PostMapping("/{escrowId}/arbitrate")
    public ResponseEntity<ArbitrationResult> arbitrate(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ArbitrationResult result = arbitrationService.arbitrate(
                escrowId,
                userDetails.getUsername() // Passes the admin's email from the JWT
        );
        return ResponseEntity.ok(result);
    }
}