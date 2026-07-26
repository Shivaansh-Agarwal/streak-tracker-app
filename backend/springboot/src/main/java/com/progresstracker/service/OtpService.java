package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.config.OtpProperties;
import com.progresstracker.entity.OtpChallenge;
import com.progresstracker.repository.OtpChallengeRepository;
import java.security.SecureRandom;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OtpChallengeRepository otpChallengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final OtpProperties properties;

    public OtpService(
            OtpChallengeRepository otpChallengeRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService,
            OtpProperties properties) {
        this.otpChallengeRepository = otpChallengeRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.properties = properties;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        otpChallengeRepository.findTopByEmailOrderByCreatedAtDesc(email).ifPresent(latest -> {
            Instant cooldownEnds = latest.getCreatedAt().plusSeconds(properties.resendCooldownSeconds());
            if (Instant.now().isBefore(cooldownEnds)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code");
            }
        });

        String otp = generateSixDigitOtp();
        OtpChallenge challenge = OtpChallenge.builder()
                .email(email)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(Instant.now().plusSeconds(properties.ttlMinutes() * 60))
                .attemptCount(0)
                .build();
        otpChallengeRepository.save(challenge);

        mailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        OtpChallenge challenge = otpChallengeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No verification code found for this email"));

        if (Instant.now().isAfter(challenge.getExpiresAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        if (challenge.getAttemptCount() >= properties.maxAttempts()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts - please request a new code");
        }

        if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            otpChallengeRepository.save(challenge);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Incorrect verification code");
        }

        otpChallengeRepository.delete(challenge);
    }

    private String generateSixDigitOtp() {
        int otp = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", otp);
    }
}
