package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.config.DemoAccountProperties;
import com.progresstracker.entity.RefreshToken;
import com.progresstracker.entity.User;
import com.progresstracker.entity.UserStatus;
import com.progresstracker.repository.RefreshTokenRepository;
import com.progresstracker.repository.UserRepository;
import com.progresstracker.security.CookieUtil;
import com.progresstracker.security.JwtService;
import com.progresstracker.security.TokenHasher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final TokenHasher tokenHasher;
    private final CookieUtil cookieUtil;
    private final DemoAccountProperties demoAccountProperties;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            OtpService otpService,
            JwtService jwtService,
            TokenHasher tokenHasher,
            CookieUtil cookieUtil,
            DemoAccountProperties demoAccountProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.tokenHasher = tokenHasher;
        this.cookieUtil = cookieUtil;
        this.demoAccountProperties = demoAccountProperties;
    }

    @Transactional
    public void login(String email) {
        userRepository.findByEmail(email).orElseGet(() -> userRepository.save(
                User.builder()
                        .email(email)
                        .status(UserStatus.PENDING_PROFILE)
                        .isPublic(false)
                        .build()));
        if (!demoAccountProperties.isDemoAccount(email)) {
            otpService.generateAndSendOtp(email);
        }
    }

    @Transactional
    public UserStatus verifyOtp(String email, String otp, HttpServletResponse response) {
        otpService.verifyOtp(email, otp);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User must exist after a successful login"));
        issueTokens(user, response);
        return user.getStatus();
    }

    @Transactional
    public void refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = cookieUtil.readCookie(request, CookieUtil.REFRESH_TOKEN_COOKIE)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Missing refresh token"));

        RefreshToken existing = refreshTokenRepository
                .findByTokenHashAndRevokedAtIsNull(tokenHasher.hash(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (Instant.now().isAfter(existing.getExpiresAt())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        existing.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existing);

        issueTokens(existing.getUser(), response);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        cookieUtil.readCookie(request, CookieUtil.REFRESH_TOKEN_COOKIE)
                .flatMap(rawToken -> refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHasher.hash(rawToken)))
                .ifPresent(existing -> {
                    existing.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(existing);
                });

        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearAccessTokenCookie());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearRefreshTokenCookie());
    }

    private void issueTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

        String rawRefreshToken = tokenHasher.generateRawToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHasher.hash(rawRefreshToken))
                .expiresAt(Instant.now().plusSeconds(jwtService.refreshTokenTtlSeconds()))
                .build();
        refreshTokenRepository.save(refreshToken);

        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieUtil.buildAccessTokenCookie(accessToken, jwtService.accessTokenTtlSeconds()));
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieUtil.buildRefreshTokenCookie(rawRefreshToken, jwtService.refreshTokenTtlSeconds()));
    }
}
