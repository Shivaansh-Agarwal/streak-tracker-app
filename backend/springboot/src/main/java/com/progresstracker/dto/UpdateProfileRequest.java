package com.progresstracker.dto;

// All fields are optional - only non-null fields are applied, so this one
// endpoint covers both the initial Profile Setup step and later partial edits.
public record UpdateProfileRequest(
        String username,
        String fullName,
        String profilePictureUrl,
        Boolean isPublic) {
}
