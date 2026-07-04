package com.escrow.engine.escrow.service.fsm;

import com.escrow.engine.common.exception.InvalidStateTransactionException;
import com.escrow.engine.escrow.enums.TransactionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EscrowStateValidatorTest {

    private final EscrowStateValidator validator = new EscrowStateValidator();

    @Test
    @DisplayName("FSM: Should allow strictly defined legal transitions")
    void testValidTransitions() {
        assertDoesNotThrow(() -> validator.validate(TransactionStatus.CREATED, TransactionStatus.FUNDED));
        assertDoesNotThrow(() -> validator.validate(TransactionStatus.FUNDED, TransactionStatus.RELEASED));
        assertDoesNotThrow(() -> validator.validate(TransactionStatus.FUNDED, TransactionStatus.DISPUTED));
        assertDoesNotThrow(() -> validator.validate(TransactionStatus.DISPUTED, TransactionStatus.RELEASED));
        assertDoesNotThrow(() -> validator.validate(TransactionStatus.DISPUTED, TransactionStatus.REFUNDED));
    }

    @Test
    @DisplayName("FSM: Should physically block illegal state transitions")
    void testInvalidTransitions() {
        // Trying to skip the FUNDED state
        assertThrows(InvalidStateTransactionException.class,
                () -> validator.validate(TransactionStatus.CREATED, TransactionStatus.RELEASED));

        // Trying to refund without going through a dispute
        assertThrows(InvalidStateTransactionException.class,
                () -> validator.validate(TransactionStatus.FUNDED, TransactionStatus.REFUNDED));

        // Trying to dispute a completed transaction
        assertThrows(InvalidStateTransactionException.class,
                () -> validator.validate(TransactionStatus.RELEASED, TransactionStatus.DISPUTED));

        // Trying to go backward in the flow
        assertThrows(InvalidStateTransactionException.class,
                () -> validator.validate(TransactionStatus.FUNDED, TransactionStatus.CREATED));
    }
}