package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.config.UsernamePolicyProperties;
import com.progresstracker.entity.User;
import com.progresstracker.entity.UserStatus;
import com.progresstracker.dto.UpdateProfileRequest;
import com.progresstracker.dto.UserProfileResponse;
import com.progresstracker.repository.UserRepository;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_-]{3,50}$");

    private final UserRepository userRepository;
    private final UsernamePolicyProperties usernamePolicy;

    public ProfileService(UserRepository userRepository, UsernamePolicyProperties usernamePolicy) {
        this.userRepository = userRepository;
        this.usernamePolicy = usernamePolicy;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        return toResponse(findUser(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.username() != null) {
            applyUsername(user, request.username());
        }
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.profilePictureUrl() != null) {
            user.setProfilePictureUrl(request.profilePictureUrl());
        }
        if (request.isPublic() != null) {
            user.setPublic(request.isPublic());
        }

        if (user.getStatus() == UserStatus.PENDING_PROFILE
                && user.getUsername() != null
                && user.getFullName() != null) {
            user.setStatus(UserStatus.ACTIVE);
        }

        return toResponse(userRepository.save(user));
    }

    private void applyUsername(User user, String username) {
        String normalized = username.toLowerCase();

        if (!USERNAME_PATTERN.matcher(normalized).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Username must be 3-50 characters: lowercase letters, numbers, hyphens or underscores only");
        }
        if (usernamePolicy.reserved().contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This username is reserved");
        }
        if (!normalized.equals(user.getUsername()) && userRepository.existsByUsername(normalized)) {
            throw new ApiException(HttpStatus.CONFLICT, "This username is already taken");
        }

        user.setUsername(normalized);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getUsername(),
                user.getFullName(),
                user.getProfilePictureUrl(),
                user.getStatus(),
                user.isPublic());
    }
}
