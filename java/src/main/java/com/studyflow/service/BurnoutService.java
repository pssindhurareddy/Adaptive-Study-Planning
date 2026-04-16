package com.studyflow.service;

import com.studyflow.model.BurnoutStatus;
import com.studyflow.model.ProgressLog;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * BurnoutService — detects burnout risk from session history.
 *
 * Burnout score formula:
 *   base = avgInterruptions * 20          (high interruptions = poor focus)
 *   penalty += incompleteSessions * 5     (started but didn't finish)
 *   penalty += highFatigue * 10           (user's self-reported fatigue level)
 *   clamped to 0–100
 *
 * Levels:
 *   0–20  → none
 *   21–40 → low
 *   41–65 → medium
 *   66–100 → high
 */
@Service
public class BurnoutService {

    private final StudyDataStore store;

    public BurnoutService(StudyDataStore store) {
        this.store = store;
    }

    public BurnoutStatus getBurnoutStatus() {
        List<ProgressLog> logs = store.getLogs();

        int totalInterruptions = 0;
        int incompleteSessions = 0;

        // Java equivalent: for (ProgressLog log : logs) { totalInterruptions += log.interruptions; }
        for (ProgressLog log : logs) {
            totalInterruptions += log.getInterruptions();
            if (!log.isCompleted()) {
                incompleteSessions++;
            }
        }

        int sessionCount = logs.isEmpty() ? 1 : logs.size();
        int avgInterruptions = totalInterruptions / sessionCount;

        // User fatigue level (0–10 from user profile, default 3)
        int fatigueLevel = store.getUsers().stream()
                .findFirst()
                .map(u -> u.getFatigueLevel())
                .orElse(3);

        // Compute burnout score
        int score = avgInterruptions * 20
                + incompleteSessions * 5
                + fatigueLevel * 10;
        score = Math.min(100, Math.max(0, score));

        String level;
        String message;
        if (score <= 20) {
            level = "none";
            message = "You're doing great! Focus is strong.";
        } else if (score <= 40) {
            level = "low";
            message = "Mild fatigue detected. Take short breaks.";
        } else if (score <= 65) {
            level = "medium";
            message = "Moderate burnout risk. Consider a longer break today.";
        } else {
            level = "high";
            message = "High burnout risk! Schedule a rest day and reduce load.";
        }

        return new BurnoutStatus(level, score, message, totalInterruptions, avgInterruptions);
    }
}
