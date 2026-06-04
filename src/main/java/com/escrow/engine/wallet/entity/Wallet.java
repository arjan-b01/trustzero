package com.escrow.engine.wallet.entity;

import com.escrow.engine.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
@Check(constraints = "balance >= 0.00")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Version
    private Long version;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}