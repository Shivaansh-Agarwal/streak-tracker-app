package com.progresstracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "otp")
public record OtpProperties(long ttlMinutes, int maxAttempts, long resendCooldownSeconds) {
}
