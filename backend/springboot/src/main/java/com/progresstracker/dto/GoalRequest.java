package com.progresstracker.dto;

import jakarta.validation.constraints.NotBlank;

public record GoalRequest(@NotBlank String title) {
}
