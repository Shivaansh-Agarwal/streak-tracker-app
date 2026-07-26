package com.progresstracker.dto;

import java.time.Instant;
import java.time.LocalDate;

public record LogResponse(
        Long id,
        Long goalId,
        String goalTitle,
        String description,
        Instant startTime,
        Instant endTime,
        String timezone,
        LocalDate logDate) {
}
