package com.escrow.engine.auth.dto;

import com.escrow.engine.user.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest (
    @NotBlank String name,

    @Email @NotBlank String email,

    @NotBlank @Size(min = 6) String password,

    @NotNull UserRole role
){}
