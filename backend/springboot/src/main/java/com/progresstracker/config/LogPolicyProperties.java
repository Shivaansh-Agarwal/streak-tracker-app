package com.progresstracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.log")
public record LogPolicyProperties(int maxBackdateDays) {
}
