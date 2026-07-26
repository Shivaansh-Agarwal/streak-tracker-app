package com.progresstracker.dto;

import com.progresstracker.entity.UserStatus;

public record UserProfileResponse(
        String username,
        String fullName,
        String profilePictureUrl,
        UserStatus status,
        boolean isPublic) {
}
