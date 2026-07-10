package com.escrow.engine.arbitration.controller;

import com.escrow.engine.arbitration.dto.ArbitrationResult;
import com.escrow.engine.arbitration.dto.ArbitrationEvent;
import com.escrow.engine.arbitration.service.DisputeArbitrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
public class DisputeArbitrationController {

    private final DisputeArbitrationService arbitrationService;

    @PostMapping("/{escrowId}/arbitrate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArbitrationResult> arbitrate(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(arbitrationService.arbitrate(escrowId, userDetails.getUsername()));
    }

    @PostMapping(value = "/{escrowId}/arbitrate/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Flux<ArbitrationEvent> arbitrateStream(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return arbitrationService.arbitrateStream(escrowId, userDetails.getUsername());
    }
}