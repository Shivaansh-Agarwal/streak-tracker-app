package com.progresstracker.repository;

import com.progresstracker.entity.LogEntry;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LogEntryRepository extends JpaRepository<LogEntry, Long> {

    Optional<LogEntry> findByIdAndUserId(Long id, Long userId);

    List<LogEntry> findAllByUserIdAndLogDateBetweenOrderByStartTimeAsc(
            Long userId, LocalDate startInclusive, LocalDate endInclusive);

    @Query("""
            SELECT COUNT(l) > 0 FROM LogEntry l
            WHERE l.user.id = :userId
              AND (:excludeId IS NULL OR l.id <> :excludeId)
              AND l.startTime < :endTime
              AND l.endTime > :startTime
            """)
    boolean existsOverlapping(
            @Param("userId") Long userId,
            @Param("excludeId") Long excludeId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime);

    @Query("""
            SELECT l.logDate AS logDate, SUM(FUNCTION('TIMESTAMPDIFF', MINUTE, l.startTime, l.endTime)) AS totalMinutes
            FROM LogEntry l
            WHERE l.user.id = :userId AND FUNCTION('YEAR', l.logDate) = :year
            GROUP BY l.logDate
            """)
    List<DailyMinutesProjection> aggregateMinutesByDay(@Param("userId") Long userId, @Param("year") int year);
}
