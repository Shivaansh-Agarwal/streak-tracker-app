package com.progresstracker.security;

import com.progresstracker.config.DemoAccountProperties;
import com.progresstracker.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

// Blocks mutations for accounts configured as read-only demo accounts (see
// DemoAccountProperties) so a public showcase account's seeded data can't be
// edited or deleted by visitors.
@Component
public class DemoAccountGuard {

    private final DemoAccountProperties properties;

    public DemoAccountGuard(DemoAccountProperties properties) {
        this.properties = properties;
    }

    public void assertNotReadonly(AuthenticatedUser user) {
        if (properties.isReadonly(user.email())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This is a read-only demo account");
        }
    }
}
