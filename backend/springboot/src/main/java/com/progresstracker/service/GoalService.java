package com.progresstracker.service;

import com.progresstracker.exception.ApiException;
import com.progresstracker.entity.Goal;
import com.progresstracker.dto.GoalRequest;
import com.progresstracker.dto.GoalResponse;
import com.progresstracker.repository.GoalRepository;
import com.progresstracker.repository.UserRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalService(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> list(Long userId) {
        return goalRepository.findAllByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public GoalResponse create(Long userId, GoalRequest request) {
        Goal goal = Goal.builder()
                .user(userRepository.getReferenceById(userId))
                .title(request.title())
                .build();
        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse update(Long userId, Long goalId, GoalRequest request) {
        Goal goal = findOwnedGoal(userId, goalId);
        goal.setTitle(request.title());
        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public void delete(Long userId, Long goalId) {
        Goal goal = findOwnedGoal(userId, goalId);
        try {
            goalRepository.delete(goal);
            goalRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot delete a goal that still has logs linked to it");
        }
    }

    private Goal findOwnedGoal(Long userId, Long goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private GoalResponse toResponse(Goal goal) {
        return new GoalResponse(goal.getId(), goal.getTitle());
    }
}
