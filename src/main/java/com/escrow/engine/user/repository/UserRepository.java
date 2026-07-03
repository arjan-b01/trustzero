package com.escrow.engine.user.repository;

import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findFirstByRole(UserRole role);
}
