package com.escrow.engine.wallet.controller;

import com.escrow.engine.wallet.dto.DepositRequest;
import com.escrow.engine.wallet.dto.WalletResponse;
import com.escrow.engine.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ResponseEntity<WalletResponse> getMyWallet(Principal principal) {

        return ResponseEntity.ok(walletService.getMyWallet(principal.getName()));
    }

    @PostMapping("/deposit")
    public ResponseEntity<WalletResponse> depositFunds(
            @Valid @RequestBody DepositRequest request,
            Principal principal) {
        return ResponseEntity.ok(walletService.deposit(principal.getName(), request));
    }
}