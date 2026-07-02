package com.escrow.engine.escrow.service;

import com.escrow.engine.dispute.repository.DisputeRecordRepository;
import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.escrow.dto.CreateEscrowRequest;
import com.escrow.engine.dispute.dto.DisputeRequest;
import com.escrow.engine.escrow.dto.EscrowResponse;
import com.escrow.engine.escrow.dto.ResolveDisputeRequest;
import com.escrow.engine.escrow.entity.EscrowTransaction;
import com.escrow.engine.escrow.enums.DisputeResolution;
import com.escrow.engine.escrow.enums.TransactionStatus;
import com.escrow.engine.escrow.repository.EscrowRepository;
import com.escrow.engine.escrow.service.fsm.EscrowStateValidator;
import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.enums.UserRole;
import com.escrow.engine.user.repository.UserRepository;
import com.escrow.engine.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final UserRepository userRepository;
    private final EscrowStateValidator stateValidator;
    private final WalletService walletService;
    private final DisputeRecordRepository disputeRecordRepository;

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

    @Transactional
    public EscrowResponse fundEscrow(String buyerEmail, Long escrowId) {

        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));
        User buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        if (!tx.getBuyer().getId().equals(buyer.getId())) {
            throw new RuntimeException("Unauthorized: You are not the buyer of this transaction");
        }

        stateValidator.validate(tx.getStatus(), TransactionStatus.FUNDED);

        walletService.debitWallet(buyer.getId(), tx.getAmount(), tx.getId(), "ESCROW_FUNDED", "Buyer locked funds into escrow contract");

        tx.setStatus(TransactionStatus.FUNDED);
        EscrowTransaction savedTx = escrowRepository.save(tx);

        return mapToResponse(savedTx);
    }

    @Transactional
    public EscrowResponse releaseFunds(String buyerEmail, Long escrowId) {
        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));
        User buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        if (!tx.getBuyer().getId().equals(buyer.getId())) {
            throw new RuntimeException("Unauthorized: Only the buyer can release funds");
        }

        stateValidator.validate(tx.getStatus(), TransactionStatus.RELEASED);

        walletService.creditWallet(tx.getSeller().getId(), tx.getAmount(), tx.getId(), "ESCROW_RELEASED", "Funds released to seller by buyer");

        tx.setStatus(TransactionStatus.RELEASED);
        EscrowTransaction savedTx = escrowRepository.save(tx);

        return mapToResponse(savedTx);
    }

    @Transactional
    public EscrowResponse openDispute(String userEmail, Long escrowId, DisputeRequest request) {
        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));
        User requestingUser = userRepository.findByEmail(userEmail).orElseThrow();

        boolean isBuyer = tx.getBuyer().getId().equals(requestingUser.getId());
        boolean isSeller = tx.getSeller().getId().equals(requestingUser.getId());

        if (!isBuyer && !isSeller) {
            throw new RuntimeException("Unauthorized: You are not a participant in this transaction");
        }

        stateValidator.validate(tx.getStatus(), TransactionStatus.DISPUTED);

        tx.setStatus(TransactionStatus.DISPUTED);
        tx.setDisputeReason("Structured dispute opened by " + (isBuyer ? "BUYER" : "SELLER"));

        // Saving the structured data for the AI to read later
        com.escrow.engine.dispute.entity.DisputeRecord record = com.escrow.engine.dispute.entity.DisputeRecord.builder()
                .escrow(tx)
                .buyerClaim(request.buyerClaim())
                .sellerResponse(request.sellerResponse())
                .deliveryProofSubmitted(request.deliveryProofSubmitted())
                .deadlineMet(request.deadlineMet())
                .evidenceUrl(request.evidenceUrl())
                .agreedDeliveryTerms(request.agreedDeliveryTerms())
                .build();
        disputeRecordRepository.save(record);

        EscrowTransaction savedTx = escrowRepository.save(tx);
        return mapToResponse(savedTx);
    }

    @Transactional
    public EscrowResponse resolveDispute(String adminEmail, Long escrowId, ResolveDisputeRequest request) {
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();

        if (admin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Unauthorized: Only administrators can resolve disputes");
        }

        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));

        TransactionStatus targetStatus = (request.resolution() == DisputeResolution.RELEASE_TO_SELLER)
                ? TransactionStatus.RELEASED
                : TransactionStatus.REFUNDED;

        stateValidator.validate(tx.getStatus(), targetStatus);

        if (request.resolution() == DisputeResolution.RELEASE_TO_SELLER) {
            walletService.creditWallet(tx.getSeller().getId(), tx.getAmount(), tx.getId(), "DISPUTE_RELEASED", "Admin released funds to seller. Notes: " + request.adminNotes());
        } else if (request.resolution() == DisputeResolution.REFUND_TO_BUYER) {
            walletService.creditWallet(tx.getBuyer().getId(), tx.getAmount(), tx.getId(), "DISPUTE_REFUNDED", "Admin refunded buyer. Notes: " + request.adminNotes());
        }

        tx.setStatus(targetStatus);
        tx.setDisputeReason("DISPUTE RESOLVED: " + request.adminNotes() + " | Original Reason: " + tx.getDisputeReason());

        EscrowTransaction savedTx = escrowRepository.save(tx);
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

    @Transactional
    public void resolveDisputeByAI(Long escrowId, String verdict, String reasoning) {
        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow transaction not found"));

        TransactionStatus targetStatus = verdict.equals("RELEASE")
                ? TransactionStatus.RELEASED
                : TransactionStatus.REFUNDED;

        stateValidator.validate(tx.getStatus(), targetStatus);

        if (verdict.equals("RELEASE")) {
            walletService.creditWallet(
                    tx.getSeller().getId(), tx.getAmount(), tx.getId(),
                    "AI_DISPUTE_RELEASED",
                    "AI Arbitration released funds to seller. Reasoning: " + reasoning
            );
        } else {
            walletService.creditWallet(
                    tx.getBuyer().getId(), tx.getAmount(), tx.getId(),
                    "AI_DISPUTE_REFUNDED",
                    "AI Arbitration refunded buyer. Reasoning: " + reasoning
            );
        }

        tx.setStatus(targetStatus);
        tx.setDisputeReason("AI-RESOLVED: " + reasoning + " | Original: " + tx.getDisputeReason());
        escrowRepository.save(tx);
    }
}