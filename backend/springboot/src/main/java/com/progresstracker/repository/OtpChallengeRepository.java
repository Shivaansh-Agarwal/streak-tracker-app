package com.progresstracker.repository;

import com.progresstracker.entity.OtpChallenge;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {

    Optional<OtpChallenge> findTopByEmailOrderByCreatedAtDesc(String email);
}
