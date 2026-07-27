package com.progresstracker.service;

import com.progresstracker.entity.Goal;
import com.progresstracker.entity.LogEntry;
import com.progresstracker.entity.User;
import com.progresstracker.entity.UserStatus;
import com.progresstracker.repository.GoalRepository;
import com.progresstracker.repository.LogEntryRepository;
import com.progresstracker.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Seeds/resets the two public demo accounts (see DemoAccountProperties):
// johndoe (read-only showcase, data spans ~1 year) and janedoe (editable
// playground, lightly seeded). Safe to call repeatedly - each run wipes and
// rebuilds just these two accounts' goals/logs from scratch.
//
// Writes entities directly via the repositories rather than going through
// GoalService/LogService on purpose: this is constructing already-known-valid
// fixture data (including dates older than LogService's 30-day backdate
// limit), not handling real user input, so that validation doesn't apply.
@Service
public class DemoSeedService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final LogEntryRepository logEntryRepository;

    public DemoSeedService(
            UserRepository userRepository, GoalRepository goalRepository, LogEntryRepository logEntryRepository) {
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.logEntryRepository = logEntryRepository;
    }

    @Transactional
    public void seed() {
        seedJohndoe();
        seedJanedoe();
    }

    private void seedJohndoe() {
        User user = upsertUser("johndoe@gmail.com", "johndoe", "John Doe");
        wipeGoalsAndLogs(user);

        Goal systemDesign = createGoal(user, "Learn System Design");
        Goal dsa = createGoal(user, "Data Structures & Algorithms");
        Goal nextjs = createGoal(user, "Learn Next.js");
        List<Goal> goals = List.of(systemDesign, dsa, nextjs);

        String[][] descriptions = {
            {"Read about load balancers", "Studied consistent hashing", "Designed a URL shortener",
                "Reviewed CAP theorem", "Sharding strategies"},
            {"Solved binary tree problems", "Practiced dynamic programming", "Reviewed graph traversal",
                "Worked on sorting algorithms", "Studied heaps"},
            {"Built the App Router routes", "Learned server components", "Set up middleware/proxy",
                "Explored data fetching patterns", "Studied caching"},
        };

        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // Recent streak: last ~18 days, with a few rest days for realism.
        int[] restDayOffsets = {3, 9, 14};
        int index = 0;
        for (int offset = 1; offset <= 18; offset++) {
            if (contains(restDayOffsets, offset)) {
                continue;
            }
            int goalIndex = offset % goals.size();
            createLog(user, goals.get(goalIndex), descriptions[goalIndex][index % descriptions[goalIndex].length],
                    today.minusDays(offset), 18 + (offset % 3), 1 + (offset % 3));
            index++;
        }

        // Historical spread: 5 days in each of the last 11 months (excluding
        // the current month, already covered by the recent streak above),
        // so the heatmap has something to show across year boundaries too.
        for (int monthsBack = 1; monthsBack <= 11; monthsBack++) {
            YearMonth month = YearMonth.from(today).minusMonths(monthsBack);
            int[] daysOfMonth = {3, 8, 15, 22, 27};
            for (int day : daysOfMonth) {
                int clampedDay = Math.min(day, month.lengthOfMonth());
                int goalIndex = (monthsBack + day) % goals.size();
                createLog(user, goals.get(goalIndex),
                        descriptions[goalIndex][(monthsBack + day) % descriptions[goalIndex].length],
                        month.atDay(clampedDay), 18 + (day % 3), 1 + (day % 3));
            }
        }
    }

    private void seedJanedoe() {
        User user = upsertUser("janedoe@yahoo.com", "janedoe", "Jane Doe");
        wipeGoalsAndLogs(user);

        Goal spanish = createGoal(user, "Learn Spanish");
        Goal guitar = createGoal(user, "Guitar Practice");
        List<Goal> goals = List.of(spanish, guitar);

        String[][] descriptions = {
            {"Practiced verb conjugations", "Watched a Spanish show with subtitles", "Duolingo + flashcards"},
            {"Practiced chord transitions", "Learned a new song", "Worked on fingerpicking"},
        };

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        int[] offsets = {2, 4, 6, 9, 12};
        for (int offset : offsets) {
            int goalIndex = offset % goals.size();
            createLog(user, goals.get(goalIndex), descriptions[goalIndex][offset % descriptions[goalIndex].length],
                    today.minusDays(offset), 19, 1);
        }
    }

    private User upsertUser(String email, String username, String fullName) {
        User user = userRepository.findByEmail(email).orElseGet(() -> User.builder().email(email).build());
        user.setUsername(username);
        user.setFullName(fullName);
        user.setStatus(UserStatus.ACTIVE);
        user.setPublic(true);
        return userRepository.save(user);
    }

    private void wipeGoalsAndLogs(User user) {
        // Logs first - goals have ON DELETE RESTRICT while logs reference them.
        logEntryRepository.deleteAllByUserId(user.getId());
        goalRepository.deleteAllByUserId(user.getId());
    }

    private Goal createGoal(User user, String title) {
        return goalRepository.save(Goal.builder().user(user).title(title).build());
    }

    private void createLog(User user, Goal goal, String description, LocalDate date, int startHour, int durationHours) {
        Instant start = date.atStartOfDay(ZoneOffset.UTC).plusHours(startHour).toInstant();
        Instant end = start.plusSeconds(durationHours * 3600L);
        logEntryRepository.save(LogEntry.builder()
                .user(user)
                .goal(goal)
                .description(description)
                .startTime(start)
                .endTime(end)
                .timezone("UTC")
                .logDate(date)
                .build());
    }

    private boolean contains(int[] values, int target) {
        for (int value : values) {
            if (value == target) {
                return true;
            }
        }
        return false;
    }
}
