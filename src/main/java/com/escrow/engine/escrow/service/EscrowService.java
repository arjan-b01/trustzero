package com.escrow.engine.escrow.service;

import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.escrow.dto.CreateEscrowRequest;
import com.escrow.engine.escrow.dto.EscrowResponse;
import com.escrow.engine.escrow.entity.EscrowTransaction;
import com.escrow.engine.escrow.enums.TransactionStatus;
import com.escrow.engine.escrow.repository.EscrowRepository;
import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.enums.UserRole;
import com.escrow.engine.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final UserRepository userRepository;

    @Transactional
    public EscrowResponse createEscrow(String buyerEmail, CreateEscrowRequest request) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));

        User seller = userRepository.findById(request.sellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID: " + request.sellerId()));

        if (buyer.getId().equals(seller.getId())) {
            throw new IllegalArgumentException("You cannot create an escrow transaction with yourself.");
        }
        if (seller.getRole() != UserRole.SELLER) {
            throw new IllegalArgumentException("The target user does not have a SELLER role.");
        }

        EscrowTransaction transaction = EscrowTransaction.builder()
                .title(request.title())
                .description(request.description())
                .amount(request.amount())
                .buyer(buyer)
                .seller(seller)
                .status(TransactionStatus.CREATED)
                .build();

        EscrowTransaction savedTx = escrowRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    public EscrowResponse getEscrowById(Long id) {
        EscrowTransaction tx = escrowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));
        return mapToResponse(tx);
    }

    private EscrowResponse mapToResponse(EscrowTransaction tx) {
        return new EscrowResponse(
                tx.getId(),
                tx.getTitle(),
                tx.getDescription(),
                tx.getAmount(),
                tx.getStatus().name(),
                tx.getBuyer().getId(),
                tx.getBuyer().getName(),
                tx.getSeller().getId(),
                tx.getSeller().getName(),
                tx.getDisputeReason(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}