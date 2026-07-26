package com.progresstracker.dto;

import java.time.LocalDate;

public record HeatmapDayResponse(LocalDate date, double hours) {
}
