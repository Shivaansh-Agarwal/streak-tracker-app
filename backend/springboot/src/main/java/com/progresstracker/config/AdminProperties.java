package com.progresstracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Shared-secret key for admin/ops endpoints (see AdminController). No
// hardcoded fallback - if unset, the key is blank and every request is
// rejected (see AdminController), so the endpoint is safely disabled by
// default rather than open with a guessable default.
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String seedKey) {
}
