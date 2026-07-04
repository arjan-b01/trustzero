package com.escrow.engine.payment;

import java.math.BigDecimal;

public interface PaymentProvider {
    boolean processDeposit(Long userId, BigDecimal amount);
}
