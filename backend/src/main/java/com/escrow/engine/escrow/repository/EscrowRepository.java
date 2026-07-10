package com.escrow.engine.escrow.repository;

import com.escrow.engine.escrow.entity.EscrowTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EscrowRepository extends JpaRepository<EscrowTransaction, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EscrowTransaction e WHERE e.id = :id")
    Optional<EscrowTransaction> findByIdWithLock(@Param("id") Long id);

    List<EscrowTransaction> findByBuyerEmail(String email);

    List<EscrowTransaction> findBySellerEmail(String email);
}
