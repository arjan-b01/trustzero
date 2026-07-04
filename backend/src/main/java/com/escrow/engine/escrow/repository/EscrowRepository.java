package com.escrow.engine.escrow.repository;

import com.escrow.engine.escrow.entity.EscrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EscrowRepository extends JpaRepository<EscrowTransaction, Long> {
    Optional<EscrowTransaction> findByBuyerIdOrSellerId(Long buyerId, Long serllerId);
}
