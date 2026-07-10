package com.escrow.engine.auth.service;

import com.escrow.engine.auth.dto.AuthResponse;
import com.escrow.engine.auth.dto.LoginRequest;
import com.escrow.engine.auth.dto.RegisterRequest;
import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.security.JwtUtil;
import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.enums.UserRole;
import com.escrow.engine.user.repository.UserRepository;
import com.escrow.engine.wallet.entity.Wallet;
import com.escrow.engine.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final WalletRepository walletRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final AuthenticationManager authenticationManager;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.findByEmail(request.email()).isPresent()) {
                        throw new RuntimeException("Email already in use");
                }

                UserRole userRole = request.role() != null ? request.role() : UserRole.BUYER;
                User user = User.builder()
                                .name(request.name())
                                .email(request.email())
                                .passwordHash(passwordEncoder.encode(request.password()))
                                .role(userRole)
                                .build();
                User savedUser = userRepository.save(user);

                Wallet wallet = Wallet.builder()
                                .user(savedUser)
                                .balance(BigDecimal.ZERO)
                                .build();
                walletRepository.save(wallet);

                org.springframework.security.core.userdetails.User springUser = new org.springframework.security.core.userdetails.User(
                                savedUser.getEmail(),
                                savedUser.getPasswordHash(),
                                Collections.singleton(
                                                new SimpleGrantedAuthority("ROLE_" + savedUser.getRole().name())));

                String jwtToken = jwtUtil.generateToken(springUser, savedUser.getId(), savedUser.getRole().name());

                return new AuthResponse(jwtToken, savedUser.getId(), savedUser.getName(), savedUser.getEmail(),
                                savedUser.getRole().name());
        }

        public AuthResponse login(LoginRequest request) {

                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

                User user = userRepository.findByEmail(request.email())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                org.springframework.security.core.userdetails.User springUser = new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPasswordHash(),
                                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));

                String jwtToken = jwtUtil.generateToken(springUser, user.getId(), user.getRole().name());

                return new AuthResponse(jwtToken, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
        }
}
