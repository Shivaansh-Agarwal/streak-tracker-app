package com.progresstracker.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    
    private static final String REFRESH_TOKEN_PATH = "/auth";

    public String buildAccessTokenCookie(String token, long maxAgeSeconds) {
        return build(ACCESS_TOKEN_COOKIE, token, "/", maxAgeSeconds);
    }

    public String buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        return build(REFRESH_TOKEN_COOKIE, token, REFRESH_TOKEN_PATH, maxAgeSeconds);
    }

    public String clearAccessTokenCookie() {
        return build(ACCESS_TOKEN_COOKIE, "", "/", 0);
    }

    public String clearRefreshTokenCookie() {
        return build(REFRESH_TOKEN_COOKIE, "", REFRESH_TOKEN_PATH, 0);
    }

    public Optional<String> readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private String build(String name, String value, String path, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path(path)
                .maxAge(maxAgeSeconds)
                .build()
                .toString();
    }
}
