package com.studyflow.service;

import com.studyflow.model.ExamCollision;
import com.studyflow.model.TaskDifficulty;
import com.studyflow.model.TaskStatus;
import com.studyflow.model.TaskUnit;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * CollisionService — detects and resolves exam / deadline collisions.
 *
 * Two tasks collide when:
 *  - same_day: both non-completed tasks share the exact same deadline date.
 *  - adjacent_day: deadlines are exactly 1 day apart and both are High difficulty.
 *
 * Resolution: shift the lower-priority task's deadline forward by a given number
 * of days (shiftDays, default 2).
 */
@Service
public class CollisionService {

    /** MS_PER_DAY — milliseconds in one day (used by day-difference helpers). */
    private static final long MS_PER_DAY = 86_400_000L;

    private final StudyDataStore store;

    public CollisionService(StudyDataStore store) {
        this.store = store;
    }

    /**
     * Find all deadline collisions among non-completed tasks.
     * Java equivalent:
     *   for (int i = 0; i < tasks.size(); i++)
     *     for (int j = i+1; j < tasks.size(); j++)
     *       if (isSameDayOrAdjacent(tasks.get(i), tasks.get(j))) collisions.add(...)
     */
    public List<ExamCollision> findCollisions() {
        List<TaskUnit> active = store.getTasks().stream()
                .filter(t -> t.getStatus() != TaskStatus.Completed
                        && t.getDeadline() != null && !t.getDeadline().isBlank())
                .toList();

        List<ExamCollision> collisions = new ArrayList<>();
        for (int i = 0; i < active.size(); i++) {
            for (int j = i + 1; j < active.size(); j++) {
                TaskUnit t1 = active.get(i);
                TaskUnit t2 = active.get(j);
                Optional<String> conflictType = detectConflict(t1, t2);
                if (conflictType.isPresent()) {
                    collisions.add(buildCollision(t1, t2, conflictType.get()));
                }
            }
        }
        return collisions;
    }

    /**
     * Resolve a collision by shifting task2's deadline forward by shiftDays.
     * Returns the updated task, or empty if not found.
     */
    public Optional<TaskUnit> resolveCollision(int taskId, int shiftDays) {
        return store.getTasks().stream()
                .filter(t -> t.getId() == taskId)
                .findFirst()
                .map(t -> {
                    try {
                        LocalDate original = LocalDate.parse(t.getDeadline());
                        LocalDate shifted = original.plusDays(shiftDays);
                        t.setDeadline(shifted.toString());
                    } catch (Exception ignored) {
                        // Leave deadline unchanged if parse fails
                    }
                    return t;
                });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Optional<String> detectConflict(TaskUnit t1, TaskUnit t2) {
        try {
            LocalDate d1 = LocalDate.parse(t1.getDeadline());
            LocalDate d2 = LocalDate.parse(t2.getDeadline());
            long diff = Math.abs(d1.toEpochDay() - d2.toEpochDay());
            if (diff == 0) return Optional.of("same_day");
            if (diff == 1
                    && t1.getDifficulty() == TaskDifficulty.High
                    && t2.getDifficulty() == TaskDifficulty.High) {
                return Optional.of("adjacent_day");
            }
        } catch (Exception ignored) {}
        return Optional.empty();
    }

    private ExamCollision buildCollision(TaskUnit t1, TaskUnit t2, String conflictType) {
        // Penalty label: describe severity and format the date in a human-readable form
        String formattedDate = formatDate(t1.getDeadline());
        String severity = (t1.getDifficulty() == TaskDifficulty.High
                || t2.getDifficulty() == TaskDifficulty.High) ? "High-difficulty" : "Moderate";
        String typeLabel = "same_day".equals(conflictType) ? "same-day" : "adjacent-day";
        String penaltyLabel = severity + " " + typeLabel + " collision on " + formattedDate;

        return new ExamCollision(t1.getId(), t2.getId(),
                t1.getTitle(), t2.getTitle(),
                t1.getDeadline(), conflictType, penaltyLabel);
    }

    /** Format ISO date to locale-friendly string, e.g. "Apr 15, 2026". */
    private String formatDate(String isoDate) {
        try {
            LocalDate date = LocalDate.parse(isoDate);
            return date.format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US));
        } catch (Exception e) {
            return isoDate;
        }
    }
}
