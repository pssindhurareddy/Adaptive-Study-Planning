package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * ScoreCalculator — static-style utility service.
 * Java equivalent: class ScoreCalculator — static utility with Math operations.
 * Demonstrates: enhanced for-each loops, variance, weighted average.
 */
@Service
public class ScoreCalculator {

    private final StudyDataStore store;

    public ScoreCalculator(StudyDataStore store) {
        this.store = store;
    }

    /**
     * Calculate focus score from progress logs.
     * Java equivalent: static int calculateFocusScore(List<ProgressLog> logs)
     *   int completed = 0; int interruptions = 0;
     *   for (ProgressLog log : logs) { if (log.completed) completed++; interruptions += log.interruptions; }
     *   return Math.min(100, Math.max(0, completed * 15 - interruptions * 3 + streakBonus));
     */
    public int calculateFocusScore() {
        List<ProgressLog> logs = store.getLogs();
        // Java equivalent: for (ProgressLog log : logs) { if (log.completed) completedCount++; }
        long completedCount = logs.stream().filter(ProgressLog::isCompleted).count();
        // Java equivalent: for (ProgressLog log : logs) { totalInterruptions += log.interruptions; }
        int totalInterruptions = logs.stream().mapToInt(ProgressLog::getInterruptions).sum();
        int streak = calculateStudyStreak();
        int consistencyBonus = streak >= 3 ? 10 : streak >= 1 ? 5 : 0;
        int raw = (int) (completedCount * 15) - (totalInterruptions * 3) + consistencyBonus;
        // Java equivalent: Math.min(100, Math.max(0, raw))
        return Math.min(100, Math.max(0, raw));
    }

    /**
     * Calculate stability score — ratio of on-time task completions.
     * Java equivalent: static int calculateStabilityScore(List<ProgressLog> logs, List<TaskUnit> tasks)
     *   int onTime = 0; for (ProgressLog log : logs) { if (log.actualTime <= threshold) onTime++; }
     *   return (onTime * 100) / total;
     */
    public int calculateStabilityScore() {
        List<ProgressLog> logs = store.getLogs();
        int total = logs.size();
        if (total == 0) return 0;
        int onTime = 0;
        // Java equivalent: for (ProgressLog log : logs) { TaskUnit t = findById(tasks, log.taskId); ... }
        for (ProgressLog log : logs) {
            int estimated = store.getTasks().stream()
                    .filter(t -> t.getId() == log.getTaskId())
                    .findFirst()
                    .map(TaskUnit::getEstimatedMinutes)
                    .orElse(25);
            int threshold = estimated + (estimated / 5); // 120% of estimate
            if (log.getActualTime() <= threshold || log.getActualTime() == 0) {
                onTime++;
            }
        }
        int ratio = (onTime * 100) / total;
        return Math.min(100, ratio);
    }

    /**
     * Calculate study streak from completed log entries.
     * Java equivalent: static int calculateStudyStreak(List<ProgressLog> logs)
     *   long completed = logs.stream().filter(l -> l.completed).count();
     *   if (completed >= 5) return 5; ...
     */
    public int calculateStudyStreak() {
        List<ProgressLog> logs = store.getLogs();
        // Java equivalent: for (ProgressLog log : logs) { if (log.completed) count++; }
        long count = logs.stream().filter(ProgressLog::isCompleted).count();
        if (count >= 5) return 5;
        if (count >= 3) return 3;
        if (count >= 1) return 1;
        return 0;
    }

    /**
     * Build the full DashboardData aggregate.
     * Java equivalent: ScoreCalculator.getDashboardData(tasks, logs)
     */
    public DashboardData getDashboardData() {
        // Java equivalent: tasks.stream().filter(t -> t.status == COMPLETED).count()
        int completedCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Completed).count();
        int inProgressCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.InProgress).count();
        int scheduledCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Scheduled).count();
        int totalTasks = store.getTasks().size();

        DashboardData data = new DashboardData();
        data.setFocusScore(calculateFocusScore());
        data.setDailyProgress(completedCount);
        data.setTotalTasks(totalTasks);
        data.setCompletedTasks(completedCount);
        data.setInProgressTasks(inProgressCount);
        data.setScheduledTasks(scheduledCount);
        data.setStabilityScore(calculateStabilityScore());
        data.setStudyStreak(calculateStudyStreak());
        return data;
    }
}
