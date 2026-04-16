package com.studyflow.service;

import com.studyflow.model.Achievement;
import com.studyflow.model.TaskStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * AchievementService — evaluates milestone achievements.
 *
 * Achievements are checked at request time against the current data state.
 * Each achievement has a deterministic earned condition.
 */
@Service
public class AchievementService {

    private final StudyDataStore store;
    private final ScoreCalculator scoreCalculator;

    public AchievementService(StudyDataStore store, ScoreCalculator scoreCalculator) {
        this.store = store;
        this.scoreCalculator = scoreCalculator;
    }

    /**
     * Return all achievements with their current earned status.
     * Java equivalent: List<Achievement> achieved = new ArrayList<>();
     *   for (AchievementDef def : definitions) { if (def.check(store)) achieved.add(new Achievement(..., true)); }
     */
    public List<Achievement> getAchievements() {
        long completedTasks = store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Completed).count();
        long totalLogs = store.getLogs().stream()
                .filter(l -> l.isCompleted()).count();
        int streak = scoreCalculator.calculateStudyStreak();
        int focusScore = scoreCalculator.calculateFocusScore();
        int totalInterruptions = store.getLogs().stream()
                .mapToInt(l -> l.getInterruptions()).sum();
        long highTasks = store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Completed
                        && t.getDifficulty() == com.studyflow.model.TaskDifficulty.High).count();

        List<Achievement> list = new ArrayList<>();

        // ── Completion achievements ────────────────────────────────────────────
        list.add(new Achievement("first_task", "First Step",
                "Complete your first task",
                "🎯", completedTasks >= 1, "completion"));

        list.add(new Achievement("five_tasks", "Getting Started",
                "Complete 5 tasks",
                "✅", completedTasks >= 5, "completion"));

        list.add(new Achievement("ten_tasks", "Task Master",
                "Complete 10 tasks",
                "🏆", completedTasks >= 10, "completion"));

        list.add(new Achievement("high_difficulty", "Challenge Accepted",
                "Complete a High difficulty task",
                "🔥", highTasks >= 1, "completion"));

        list.add(new Achievement("three_high_difficulty", "Overachiever",
                "Complete 3 High difficulty tasks",
                "💪", highTasks >= 3, "completion"));

        // ── Focus achievements ─────────────────────────────────────────────────
        list.add(new Achievement("first_session", "First Focus",
                "Log your first study session",
                "⏱", totalLogs >= 1, "focus"));

        list.add(new Achievement("five_sessions", "Focused Mind",
                "Log 5 completed study sessions",
                "🧠", totalLogs >= 5, "focus"));

        list.add(new Achievement("focus_score_50", "Halfway There",
                "Reach a Focus Score of 50",
                "🌟", focusScore >= 50, "focus"));

        list.add(new Achievement("focus_score_80", "Peak Performance",
                "Reach a Focus Score of 80",
                "⚡", focusScore >= 80, "focus"));

        list.add(new Achievement("zero_interruptions", "Deep Work",
                "Complete a session with zero interruptions",
                "🎧", hasZeroInterruptionSession(), "focus"));

        // ── Streak achievements ────────────────────────────────────────────────
        list.add(new Achievement("streak_1", "Consistent",
                "Maintain a 1-day study streak",
                "🔆", streak >= 1, "streak"));

        list.add(new Achievement("streak_3", "On a Roll",
                "Maintain a 3-day study streak",
                "🔥", streak >= 3, "streak"));

        list.add(new Achievement("streak_5", "Study Champion",
                "Maintain a 5-day study streak",
                "🏅", streak >= 5, "streak"));

        // ── Tasks achievement ──────────────────────────────────────────────────
        list.add(new Achievement("added_5_tasks", "Task Creator",
                "Add 5 or more tasks to your planner",
                "📋", store.getTasks().size() >= 5, "tasks"));

        list.add(new Achievement("multi_subject", "Well Rounded",
                "Add tasks across 3 or more subjects",
                "📚", countSubjectsWithTasks() >= 3, "tasks"));

        return list;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns true if any completed log has 0 interruptions. */
    private boolean hasZeroInterruptionSession() {
        return store.getLogs().stream()
                .anyMatch(l -> l.isCompleted() && l.getInterruptions() == 0);
    }

    /** Returns number of distinct subjects that have at least one task. */
    private long countSubjectsWithTasks() {
        return store.getTasks().stream()
                .map(t -> t.getSubjectId())
                .distinct()
                .count();
    }
}
