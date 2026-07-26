package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.entity.User;
import com.progresstracker.dto.HeatmapDayResponse;
import com.progresstracker.dto.LogResponse;
import com.progresstracker.dto.PublicProfileResponse;
import com.progresstracker.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicProfileService {

    private final UserRepository userRepository;
    private final LogService logService;

    public PublicProfileService(UserRepository userRepository, LogService logService) {
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getProfile(String username) {
        User user = findVisibleUser(username);
        return new PublicProfileResponse(user.getUsername(), user.getFullName(), user.getProfilePictureUrl());
    }

    @Transactional(readOnly = true)
    public List<HeatmapDayResponse> heatmap(String username, int year) {
        User user = findVisibleUser(username);
        return logService.heatmap(user.getId(), year);
    }

    @Transactional(readOnly = true)
    public List<LogResponse> logsByMonth(String username, int year, int month) {
        User user = findVisibleUser(username);
        return logService.listByMonth(user.getId(), year, month);
    }

    // 404 if the username doesn't exist, 403 if it exists but is private - the
    // frontend uses this distinction to show a "this profile is private"
    // message instead of a generic not-found page. Deliberate tradeoff: this
    // confirms a private username is registered, which an earlier version of
    // this method avoided by returning an identical 404 for both cases.
    private User findVisibleUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        if (!user.isPublic()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This profile is private");
        }
        return user;
    }
}
