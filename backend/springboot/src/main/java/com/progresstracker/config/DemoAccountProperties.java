package com.progresstracker.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

// Demo accounts skip real OTP delivery (fixed code, see OtpService) so a
// visitor can log in without needing real email access. Empty by default -
// only set on the specific deployment meant to host a public demo.
@ConfigurationProperties(prefix = "app.demo")
public record DemoAccountProperties(List<String> accounts, List<String> readonlyAccounts) {

    public boolean isDemoAccount(String email) {
        return accounts != null && accounts.contains(email);
    }

    public boolean isReadonly(String email) {
        return readonlyAccounts != null && readonlyAccounts.contains(email);
    }
}
