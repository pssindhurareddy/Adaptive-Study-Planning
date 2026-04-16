package com.studyflow.service;

import com.studyflow.model.ProcrastinationDebt;
import com.studyflow.model.TaskStatus;
import com.studyflow.model.TaskUnit;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * ProcrastinationService — identifies overdue and stale tasks and
 * computes a "procrastination debt" score.
 *
 * Debt score formula:
 *   +15 per overdue task (past deadline, not completed)
 *   +5  per stale task (Scheduled, no progress, not overdue)
 *   Levels: none(0), low(1–20), medium(21–45), high(46–70), critical(71+)
 */
@Service
public class ProcrastinationService {

    private final StudyDataStore store;

    public ProcrastinationService(StudyDataStore store) {
        this.store = store;
    }

    public ProcrastinationDebt getDebt() {
        LocalDate today = LocalDate.now();
        List<Integer> overdueIds = new ArrayList<>();
        int overdueCount = 0;
        int staleCount = 0;

        for (TaskUnit task : store.getTasks()) {
            if (task.getStatus() == TaskStatus.Completed) continue;
            if (task.getDeadline() == null || task.getDeadline().isBlank()) continue;

            try {
                LocalDate deadline = LocalDate.parse(task.getDeadline());
                if (deadline.isBefore(today)) {
                    overdueCount++;
                    overdueIds.add(task.getId());
                } else if (task.getStatus() == TaskStatus.Scheduled) {
                    // Stale: due within 7 days but no session started
                    long daysLeft = today.until(deadline).getDays();
                    if (daysLeft <= 7) {
                        boolean hasLog = store.getLogs().stream()
                                .anyMatch(l -> l.getTaskId() == task.getId());
                        if (!hasLog) staleCount++;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Compute score: each overdue task is worth 15 pts, each stale task 5 pts
        int debtScore = Math.min(100, overdueCount * 15 + staleCount * 5);

        String level;
        String advice;
        if (debtScore == 0) {
            level = "none";
            advice = "No procrastination debt — keep it up!";
        } else if (debtScore <= 20) {
            level = "low";
            advice = "Minor debt. Tackle the overdue items today.";
        } else if (debtScore <= 45) {
            level = "medium";
            advice = "Growing debt. Prioritise overdue tasks now.";
        } else if (debtScore <= 70) {
            level = "high";
            advice = "High debt! Reschedule or drop low-priority overdue tasks.";
        } else {
            level = "critical";
            advice = "Critical debt! Consider a recovery session to clear backlog.";
        }

        return new ProcrastinationDebt(overdueCount, staleCount, debtScore, level, overdueIds, advice);
    }
}
