package com.progresstracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record LogRequest(
        @NotNull Long goalId,
        @NotBlank String description,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        @NotBlank String timezone) {
}
