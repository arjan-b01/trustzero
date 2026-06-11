package com.escrow.engine.escrow.controller;

import com.escrow.engine.escrow.dto.CreateEscrowRequest;
import com.escrow.engine.escrow.dto.DisputeRequest;
import com.escrow.engine.escrow.dto.EscrowResponse;
import com.escrow.engine.escrow.service.EscrowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
public class EscrowController {

    private final EscrowService escrowService;

    @PostMapping
    public ResponseEntity<EscrowResponse> createEscrow(
            @Valid @RequestBody CreateEscrowRequest request,
            Principal principal) {
        //PRINCIPAL JAVA KI KISI LIBRARY SE UTHAYA HAI. GEMINI BOL RAHA KI ISSEY CURRENTLY LOGGED USER KO DENOTE KAR SAKTE HAIN
        // principal.getName() securely grabs the email of the currently logged-in Buyer
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(escrowService.createEscrow(principal.getName(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EscrowResponse> getEscrow(@PathVariable Long id) {
        return ResponseEntity.ok(escrowService.getEscrowById(id));
    }

    @PostMapping("/{id}/fund")
    public ResponseEntity<EscrowResponse> fundEscrow(@PathVariable Long id, Principal principal){
        return ResponseEntity.ok(escrowService.fundEscrow(principal.getName(), id));
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<EscrowResponse> releaseFunds(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(escrowService.releaseFunds(principal.getName(), id));
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<EscrowResponse> openDispute(
            @PathVariable Long id,
            @Valid @RequestBody DisputeRequest request,
            Principal principal) {
        return ResponseEntity.ok(escrowService.openDispute(principal.getName(), id, request));
    }
}
