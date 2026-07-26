package com.progresstracker.service;

import com.progresstracker.config.MailProperties;
import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.core.exception.ResendException;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final Resend resend;
    private final MailProperties mailProperties;

    public MailService(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
        this.resend = new Resend(mailProperties.resendApiKey());
    }

    public void sendOtpEmail(String to, String otp) {
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(mailProperties.from())
                .to(to)
                .subject("Your Progress Tracker verification code")
                .html("Your verification code is: " + otp)
                .build();
        try {
            resend.emails().send(params);
        } catch (ResendException e) {
            throw new RuntimeException("Failed to send OTP email via Resend", e);
        }
    }
}
