package com.progresstracker.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.username")
public record UsernamePolicyProperties(List<String> reserved) {
}
