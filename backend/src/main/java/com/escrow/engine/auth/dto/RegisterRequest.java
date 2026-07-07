package com.escrow.engine.auth.dto;

import com.escrow.engine.user.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest (
    @NotBlank(message = "Name cannot be empty")
    String name,

    @Email(message = "Must be a valid email address")
    @NotBlank(message = "Email cannot be empty")
    String email,

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters") String password
){}
