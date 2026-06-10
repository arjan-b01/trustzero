package com.escrow.engine.wallet.service;

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

    public WalletResponse getMyWallet(String email) {
        User user = getUserByEmail(email);
        Wallet wallet = getWalletByUser(user);
        return mapToResponse(wallet);
    }

    @Transactional
    public WalletResponse deposit(String email, DepositRequest request) {
        User user = getUserByEmail(email);
        Wallet wallet = getWalletByUser(user);

        boolean paymentSuccessful = paymentProvider.processDeposit(user.getId(), request.amount());

        if (!paymentSuccessful) {
            throw new RuntimeException("Payment processing failed");
        }

        BigDecimal newBalance = wallet.getBalance().add(request.amount());
        wallet.setBalance(newBalance);

        Wallet savedWallet = walletRepository.save(wallet);
        return mapToResponse(savedWallet);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void debitWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds. Wallet balance: " + wallet.getBalance() + ", Required: " + amount);
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
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