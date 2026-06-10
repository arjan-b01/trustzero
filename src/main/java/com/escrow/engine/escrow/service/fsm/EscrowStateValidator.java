package com.escrow.engine.escrow.service.fsm;

import com.escrow.engine.common.exception.InvalidStateTransactionException;
import com.escrow.engine.escrow.enums.TransactionStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class EscrowStateValidator {
    private static final Map<TransactionStatus, Set<TransactionStatus>> ALLOWED_STATES = Map.of(
            TransactionStatus.CREATED, Set.of(TransactionStatus.FUNDED),
            TransactionStatus.FUNDED, Set.of(TransactionStatus.RELEASED, TransactionStatus.DISPUTED),
            TransactionStatus.DISPUTED, Set.of(TransactionStatus.RELEASED, TransactionStatus.REFUNDED)
    );

    public void validate(TransactionStatus current, TransactionStatus target){
        Set<TransactionStatus> allowed = ALLOWED_STATES.getOrDefault(current, Set.of());

        if(!allowed.contains(target)){
            throw new InvalidStateTransactionException("Illegal State Transition: cannot move from " + current + " to " + target + ".");
        }
    }
}
