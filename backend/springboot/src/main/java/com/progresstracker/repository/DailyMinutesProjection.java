package com.progresstracker.repository;

import java.time.LocalDate;

public interface DailyMinutesProjection {
    LocalDate getLogDate();

    Long getTotalMinutes();
}
