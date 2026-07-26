package com.progresstracker.controller;

import com.progresstracker.dto.GoalRequest;
import com.progresstracker.dto.GoalResponse;
import com.progresstracker.security.AuthenticatedUser;
import com.progresstracker.service.GoalService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public List<GoalResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return goalService.list(user.id());
    }

    @PostMapping
    public GoalResponse create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody GoalRequest request) {
        return goalService.create(user.id(), request);
    }

    @PatchMapping("/{id}")
    public GoalResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest request) {
        return goalService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        goalService.delete(user.id(), id);
        return ResponseEntity.noContent().build();
    }
}
