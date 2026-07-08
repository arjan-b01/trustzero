package com.escrow.engine.wallet.service;

import com.escrow.engine.audit.service.AuditLogService;
import com.escrow.engine.common.exception.InsufficientFundsException;
import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.payment.PaymentProvider;
import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.repository.UserRepository;
import com.escrow.engine.wallet.dto.DepositRequest;
import com.escrow.engine.wallet.dto.WalletResponse;
import com.escrow.engine.wallet.entity.Wallet;
import com.escrow.engine.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final PaymentProvider paymentProvider;
    private final AuditLogService auditLogService;

    public WalletResponse getMyWallet(String email) {
        User user = getUserByEmail(email);
        Wallet wallet = getWalletByUser(user);
        return mapToResponse(wallet);
    }

    public WalletResponse deposit(String email, DepositRequest request) {
        User user = getUserByEmail(email);
        BigDecimal amount = request.amount().setScale(2, java.math.RoundingMode.HALF_UP);

        // 1. Charge external provider FIRST — no DB lock held.
        if (!paymentProvider.processDeposit(user.getId(), amount)) {
            throw new RuntimeException("Payment processing failed");
        }

        // 2. Apply credit in a short locked transaction.
        return applyDeposit(user, amount);
    }

    @Transactional
    protected WalletResponse applyDeposit(User user, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdWithLock(user.getId())  // <-- LOCK
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        BigDecimal previousBalance = wallet.getBalance();
        BigDecimal newBalance = previousBalance.add(amount).setScale(2, java.math.RoundingMode.HALF_UP);
        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(wallet);

        auditLogService.logFinancialAction(
                "EXTERNAL_DEPOSIT", user.getId(), wallet.getId(), null,
                previousBalance, newBalance,
                "User deposited funds via external provider");

        return mapToResponse(saved);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void debitWallet(Long userId, BigDecimal amount, Long escrowId, String action, String details) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient funds: balance=" + wallet.getBalance() + ", required=" + amount);
        }

        BigDecimal previousBalance = wallet.getBalance();
        BigDecimal newBalance = previousBalance.subtract(amount);

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        auditLogService.logFinancialAction(action, userId, wallet.getId(), escrowId, previousBalance, newBalance, details);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void creditWallet(Long userId, BigDecimal amount, Long escrowId, String action, String details) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        BigDecimal previousBalance = wallet.getBalance();
        BigDecimal newBalance = previousBalance.add(amount);

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        auditLogService.logFinancialAction(action, userId, wallet.getId(), escrowId, previousBalance, newBalance, details);
    }


    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Wallet getWalletByUser(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user"));
    }

    private WalletResponse mapToResponse(Wallet wallet) {
        return new WalletResponse(
                wallet.getId(),
                wallet.getBalance(),
                wallet.getUpdatedAt()
        );
    }
}