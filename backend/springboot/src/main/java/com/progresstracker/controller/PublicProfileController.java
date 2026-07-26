package com.progresstracker.controller;

import com.progresstracker.dto.HeatmapDayResponse;
import com.progresstracker.dto.LogResponse;
import com.progresstracker.dto.PublicProfileResponse;
import com.progresstracker.service.PublicProfileService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class PublicProfileController {

    private final PublicProfileService publicProfileService;

    public PublicProfileController(PublicProfileService publicProfileService) {
        this.publicProfileService = publicProfileService;
    }

    @GetMapping("/{username}")
    public PublicProfileResponse getProfile(@PathVariable String username) {
        return publicProfileService.getProfile(username);
    }

    @GetMapping("/{username}/heatmap")
    public List<HeatmapDayResponse> heatmap(@PathVariable String username, @RequestParam int year) {
        return publicProfileService.heatmap(username, year);
    }

    @GetMapping("/{username}/logs")
    public List<LogResponse> logsByMonth(
            @PathVariable String username, @RequestParam int year, @RequestParam int month) {
        return publicProfileService.logsByMonth(username, year, month);
    }
}
