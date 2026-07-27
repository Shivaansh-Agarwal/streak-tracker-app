package com.progresstracker.controller;

import com.progresstracker.config.AdminProperties;
import com.progresstracker.exception.ApiException;
import com.progresstracker.service.DemoSeedService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Listed under SecurityConfig's public routes (bypasses the normal JWT cookie
// auth) since this uses its own shared-secret check instead - a visitor
// browsing the site never needs this endpoint, only whoever is resetting the
// demo data.
@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final String KEY_HEADER = "X-Admin-Key";

    private final AdminProperties properties;
    private final DemoSeedService demoSeedService;

    public AdminController(AdminProperties properties, DemoSeedService demoSeedService) {
        this.properties = properties;
        this.demoSeedService = demoSeedService;
    }

    @PostMapping("/seed-demo-data")
    public void seedDemoData(@RequestHeader(value = KEY_HEADER, required = false, defaultValue = "") String key) {
        String configuredKey = properties.seedKey();
        if (configuredKey == null || configuredKey.isBlank() || !configuredKey.equals(key)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or missing admin key");
        }
        demoSeedService.seed();
    }
}
