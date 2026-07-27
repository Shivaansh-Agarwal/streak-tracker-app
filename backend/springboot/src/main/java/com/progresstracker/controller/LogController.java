package com.progresstracker.controller;

import com.progresstracker.dto.HeatmapDayResponse;
import com.progresstracker.dto.LogRequest;
import com.progresstracker.dto.LogResponse;
import com.progresstracker.security.AuthenticatedUser;
import com.progresstracker.security.DemoAccountGuard;
import com.progresstracker.service.LogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/logs")
public class LogController {

    private final LogService logService;
    private final DemoAccountGuard demoAccountGuard;

    public LogController(LogService logService, DemoAccountGuard demoAccountGuard) {
        this.logService = logService;
        this.demoAccountGuard = demoAccountGuard;
    }

    @GetMapping
    public List<LogResponse> listByMonth(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam int year,
            @RequestParam int month) {
        return logService.listByMonth(user.id(), year, month);
    }

    @GetMapping("/heatmap")
    public List<HeatmapDayResponse> heatmap(
            @AuthenticationPrincipal AuthenticatedUser user, @RequestParam int year) {
        return logService.heatmap(user.id(), year);
    }

    @PostMapping
    public LogResponse create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody LogRequest request) {
        demoAccountGuard.assertNotReadonly(user);
        return logService.create(user.id(), request);
    }

    @PatchMapping("/{id}")
    public LogResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody LogRequest request) {
        demoAccountGuard.assertNotReadonly(user);
        return logService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        demoAccountGuard.assertNotReadonly(user);
        logService.delete(user.id(), id);
        return ResponseEntity.noContent().build();
    }
}
