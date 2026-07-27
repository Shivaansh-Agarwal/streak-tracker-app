package com.progresstracker.controller;

import com.progresstracker.dto.UpdateProfileRequest;
import com.progresstracker.dto.UserProfileResponse;
import com.progresstracker.security.AuthenticatedUser;
import com.progresstracker.security.DemoAccountGuard;
import com.progresstracker.service.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
public class ProfileController {

    private final ProfileService profileService;
    private final DemoAccountGuard demoAccountGuard;

    public ProfileController(ProfileService profileService, DemoAccountGuard demoAccountGuard) {
        this.profileService = profileService;
        this.demoAccountGuard = demoAccountGuard;
    }

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return profileService.getProfile(user.id());
    }

    @PatchMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal AuthenticatedUser user, @RequestBody UpdateProfileRequest request) {
        demoAccountGuard.assertNotReadonly(user);
        return profileService.updateProfile(user.id(), request);
    }
}
