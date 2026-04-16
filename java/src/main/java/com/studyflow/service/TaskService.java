package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * TaskService — manages the task ArrayList.
 * Java equivalent of the TaskManager class described in Motoko comments.
 *
 * Provides: add, delete (removeIf), sort (Collections.sort + Comparator),
 * filter (stream().filter()), status updates (Iterator pattern).
 */
@Service
public class TaskService {

    private final StudyDataStore store;
    private final SubjectService subjectService;

    public TaskService(StudyDataStore store, SubjectService subjectService) {
        this.store = store;
        this.subjectService = subjectService;
    }

    // ── Priority helpers ──────────────────────────────────────────────────────

    /**
     * Deadline urgency score: 1 (far away) to 5 (past due / today).
     * Java equivalent: private int getDeadlineUrgency(String deadline)
     */
    private int deadlineUrgency(String deadline) {
        try {
            LocalDate dl = LocalDate.parse(deadline);
            LocalDate today = LocalDate.now();
            long diff = ChronoUnit.DAYS.between(today, dl);
            if (diff <= 0) return 5;
            if (diff <= 1) return 5;
            if (diff <= 3) return 4;
            if (diff <= 7) return 3;
            if (diff <= 14) return 2;
            return 1;
        } catch (Exception e) {
            return 1;
        }
    }

    /**
     * Difficulty weight for priority calculation.
     * Java equivalent: switch (difficulty) { case Low: return 1; case Medium: return 3; case High: return 5; }
     */
    private int difficultyWeight(TaskDifficulty d) {
        return switch (d) {
            case Low -> 1;
            case Medium -> 3;
            case High -> 5;
        };
    }

    /**
     * Compute task priority score — used by Comparator for sorting.
     * Java equivalent: implements Comparable<TaskUnit> — compareTo() logic
     * score = deadlineUrgency + difficultyWeight + subjectWeight
     */
    public int getPriorityScore(TaskUnit task) {
        int urgency = deadlineUrgency(task.getDeadline());
        int diff = difficultyWeight(task.getDifficulty());
        int weight = subjectService.findById(task.getSubjectId())
                .map(Subject::getWeight)
                .orElse(1);
        return urgency + diff + weight;
    }

    // ── TaskManager API ───────────────────────────────────────────────────────

    /**
     * Returns all tasks sorted by priority (highest first).
     * Java equivalent: return tasks.stream()
     *   .sorted(Comparator.comparingInt(this::getPriorityScore).reversed())
     *   .collect(Collectors.toList())
     */
    public List<TaskUnit> listTasksSorted() {
        return store.getTasks().stream()
                .sorted(Comparator.comparingInt(this::getPriorityScore).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Add a new task to the ArrayList.
     * Saves undo snapshot before mutating.
     * Java equivalent: undoStack.push(snapshot); tasks.add(new TaskUnit(...))
     */
    public TaskUnit addTask(int subjectId, String title, TaskDifficulty difficulty,
                            int estimatedMinutes, String deadline) {
        store.pushUndo();
        int id = store.getNextTaskId();
        TaskUnit t = new TaskUnit(id, subjectId, title, difficulty, estimatedMinutes,
                deadline, TaskStatus.Scheduled);
        store.getTasks().add(t);
        store.incrementTaskId();
        return t;
    }

    /**
     * Delete a task by id.
     * Saves undo snapshot before mutating.
     * Java equivalent: undoStack.push(snapshot); tasks.removeIf(t -> t.getId() == taskId)
     */
    public boolean deleteTask(int taskId) {
        store.pushUndo();
        return store.getTasks().removeIf(t -> t.getId() == taskId);
    }

    /**
     * Update task status — Iterator pattern.
     * Status transitions: Scheduled → InProgress → Completed.
     * Saves undo snapshot before mutating.
     * Java equivalent: for (TaskUnit t : tasks) { if (t.id == taskId) { t.status = newStatus; } }
     */
    public Optional<TaskUnit> updateTaskStatus(int taskId, TaskStatus newStatus) {
        store.pushUndo();
        for (TaskUnit t : store.getTasks()) {
            if (t.getId() == taskId) {
                t.setStatus(newStatus);
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }

    /**
     * Undo the last task mutation (add / delete / status change).
     * Returns true if undo was performed.
     */
    public boolean undo() {
        return store.undo();
    }

    /**
     * Redo the most-recently undone task mutation.
     * Returns true if redo was performed.
     */
    public boolean redo() {
        return store.redo();
    }

    /** Returns true if undo history is available. */
    public boolean canUndo() { return store.canUndo(); }

    /** Returns true if redo history is available. */
    public boolean canRedo() { return store.canRedo(); }

    /**
     * Filter tasks by status.
     * Java equivalent: tasks.stream().filter(t -> t.getStatus() == status).collect(Collectors.toList())
     */
    public List<TaskUnit> filterByStatus(TaskStatus status) {
        return store.getTasks().stream()
                .filter(t -> t.getStatus() == status)
                .collect(Collectors.toList());
    }

    /** Find a task by id. */
    public Optional<TaskUnit> findById(int taskId) {
        return store.getTasks().stream().filter(t -> t.getId() == taskId).findFirst();
    }
}
