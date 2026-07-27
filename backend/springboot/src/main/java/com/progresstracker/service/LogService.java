package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.config.LogPolicyProperties;
import com.progresstracker.entity.Goal;
import com.progresstracker.entity.LogEntry;
import com.progresstracker.dto.HeatmapDayResponse;
import com.progresstracker.dto.LogRequest;
import com.progresstracker.dto.LogResponse;
import com.progresstracker.repository.DailyMinutesProjection;
import com.progresstracker.repository.GoalRepository;
import com.progresstracker.repository.LogEntryRepository;
import com.progresstracker.repository.UserRepository;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LogService {

    private final LogEntryRepository logEntryRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final LogPolicyProperties logPolicy;

    public LogService(
            LogEntryRepository logEntryRepository,
            GoalRepository goalRepository,
            UserRepository userRepository,
            LogPolicyProperties logPolicy) {
        this.logEntryRepository = logEntryRepository;
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.logPolicy = logPolicy;
    }

    @Transactional
    public LogResponse create(Long userId, LogRequest request) {
        Goal goal = findOwnedGoal(userId, request.goalId());
        LocalDate logDate = validateAndComputeLogDate(request);
        rejectIfOverlapping(userId, null, request.startTime(), request.endTime());

        LogEntry logEntry = LogEntry.builder()
                .user(userRepository.getReferenceById(userId))
                .goal(goal)
                .description(request.description())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .timezone(request.timezone())
                .logDate(logDate)
                .build();

        return toResponse(logEntryRepository.save(logEntry));
    }

    @Transactional
    public LogResponse update(Long userId, Long logId, LogRequest request) {
        LogEntry logEntry = findOwnedLog(userId, logId);
        Goal goal = findOwnedGoal(userId, request.goalId());
        LocalDate logDate = validateAndComputeLogDate(request);
        rejectIfOverlapping(userId, logId, request.startTime(), request.endTime());

        logEntry.setGoal(goal);
        logEntry.setDescription(request.description());
        logEntry.setStartTime(request.startTime());
        logEntry.setEndTime(request.endTime());
        logEntry.setTimezone(request.timezone());
        logEntry.setLogDate(logDate);

        return toResponse(logEntryRepository.save(logEntry));
    }

    @Transactional
    public void delete(Long userId, Long logId) {
        logEntryRepository.delete(findOwnedLog(userId, logId));
    }

    @Transactional(readOnly = true)
    public List<LogResponse> listByMonth(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return logEntryRepository
                .findAllByUserIdAndLogDateBetweenOrderByStartTimeAsc(userId, start, end)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HeatmapDayResponse> heatmap(Long userId, int year) {
        Map<LocalDate, Long> minutesByDay = new HashMap<>();
        for (DailyMinutesProjection row : logEntryRepository.aggregateMinutesByDay(userId, year)) {
            minutesByDay.put(row.getLogDate(), row.getTotalMinutes());
        }

        int daysInYear = Year.of(year).length();
        LocalDate jan1 = LocalDate.of(year, 1, 1);
        return jan1.datesUntil(jan1.plusDays(daysInYear))
                .map(date -> new HeatmapDayResponse(date, minutesByDay.getOrDefault(date, 0L) / 60.0))
                .toList();
    }

    private LocalDate validateAndComputeLogDate(LogRequest request) {
        ZoneId zone;
        try {
            zone = ZoneId.of(request.timezone());
        } catch (DateTimeException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid timezone: " + request.timezone());
        }

        if (!request.endTime().isAfter(request.startTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        if (Duration.between(request.startTime(), request.endTime()).compareTo(Duration.ofHours(12)) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A log cannot be longer than 12 hours");
        }

        LocalDate logDate = request.startTime().atZone(zone).toLocalDate();
        LocalDate endLogDate = request.endTime().atZone(zone).toLocalDate();
        if (!logDate.equals(endLogDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A log cannot span multiple days");
        }

        Instant now = Instant.now();
        if (request.endTime().isAfter(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot log a time that hasn't happened yet");
        }

        LocalDate today = now.atZone(zone).toLocalDate();

        if (logDate.isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot log a future date");
        }
        if (logDate.isBefore(today.minusDays(logPolicy.maxBackdateDays()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cannot backdate a log more than " + logPolicy.maxBackdateDays() + " days");
        }

        return logDate;
    }

    private void rejectIfOverlapping(Long userId, Long excludeLogId, Instant startTime, Instant endTime) {
        if (logEntryRepository.existsOverlapping(userId, excludeLogId, startTime, endTime)) {
            throw new ApiException(HttpStatus.CONFLICT, "This time range overlaps an existing log");
        }
    }

    private Goal findOwnedGoal(Long userId, Long goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private LogEntry findOwnedLog(Long userId, Long logId) {
        return logEntryRepository.findByIdAndUserId(logId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Log not found"));
    }

    private LogResponse toResponse(LogEntry logEntry) {
        return new LogResponse(
                logEntry.getId(),
                logEntry.getGoal().getId(),
                logEntry.getGoal().getTitle(),
                logEntry.getDescription(),
                logEntry.getStartTime(),
                logEntry.getEndTime(),
                logEntry.getTimezone(),
                logEntry.getLogDate());
    }
}
