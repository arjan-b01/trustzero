package com.escrow.engine.payment;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class MockPaymentProvider implements PaymentProvider{
    @Override
    public boolean processDeposit(Long userId, BigDecimal amount){
        System.out.println("Mock payment: successfully charged user " + userId + " for amount " + amount);
        return true;
    }
}
