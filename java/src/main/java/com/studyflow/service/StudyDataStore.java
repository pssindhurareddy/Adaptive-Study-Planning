package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory data store — single source of truth for all application state.
 * Java equivalent of the Motoko actor's top-level mutable collections.
 *
 *   ArrayList<User>                      users
 *   ArrayList<Subject>                   subjects
 *   ArrayList<TaskUnit>                  tasks           — managed by TaskService
 *   ArrayList<ProgressLog>               logs
 *   HashMap<Integer, ActiveFocusSession> activeSessions  — managed by SessionService
 *   ArrayDeque<List<TaskUnit>>           undoStack       — undo/redo history (max 20)
 *   ArrayDeque<List<TaskUnit>>           redoStack
 *   ArrayList<TaskDependency>            dependencies    — directed dependency edges
 */
@Component
public class StudyDataStore {

    /** Maximum undo history depth. */
    private static final int MAX_UNDO_DEPTH = 20;

    // Java equivalent: ArrayList<User> users = new ArrayList<>()
    private final List<User> users = new ArrayList<>();

    // Java equivalent: ArrayList<Subject> subjects = new ArrayList<>()
    private final List<Subject> subjects = new ArrayList<>();

    // Java equivalent: ArrayList<TaskUnit> tasks = new ArrayList<>()
    private final List<TaskUnit> tasks = new ArrayList<>();

    // Java equivalent: ArrayList<ProgressLog> logs = new ArrayList<>()
    private final List<ProgressLog> logs = new ArrayList<>();

    // Java equivalent: HashMap<Integer, ActiveFocusSession> activeSessions = new HashMap<>()
    private final Map<Integer, ActiveFocusSession> activeSessions = new HashMap<>();

    // Undo/redo stacks: each entry is a deep copy of the tasks list at a point in time
    // Java equivalent: Deque<List<TaskUnit>> undoStack = new ArrayDeque<>()
    private final Deque<List<TaskUnit>> undoStack = new ArrayDeque<>();
    private final Deque<List<TaskUnit>> redoStack = new ArrayDeque<>();

    // Task dependency graph edges: taskId → dependsOnTaskId
    private final List<TaskDependency> dependencies = new ArrayList<>();

    private int nextSubjectId = 1;
    private int nextTaskId = 1;
    private boolean seeded = false;

    // ── Accessors ────────────────────────────────────────────────────────────

    public List<User> getUsers() { return users; }
    public List<Subject> getSubjects() { return subjects; }
    public List<TaskUnit> getTasks() { return tasks; }
    public List<ProgressLog> getLogs() { return logs; }
    public Map<Integer, ActiveFocusSession> getActiveSessions() { return activeSessions; }
    public List<TaskDependency> getDependencies() { return dependencies; }

    public int getNextSubjectId() { return nextSubjectId; }
    public int getNextTaskId() { return nextTaskId; }
    public void incrementSubjectId() { nextSubjectId++; }
    public void incrementTaskId() { nextTaskId++; }

    public boolean isSeeded() { return seeded; }
    public void setSeeded(boolean seeded) { this.seeded = seeded; }

    // ── Undo / Redo ───────────────────────────────────────────────────────────

    /**
     * Push the current task list state onto the undo stack (before a mutation).
     * Clears the redo stack (new action invalidates forward history).
     * Java equivalent: undoStack.push(deepCopy(tasks))
     */
    public void pushUndo() {
        // Deep-copy each TaskUnit so stored state is independent
        List<TaskUnit> snapshot = tasks.stream()
                .map(t -> new TaskUnit(t.getId(), t.getSubjectId(), t.getTitle(),
                        t.getDifficulty(), t.getEstimatedMinutes(),
                        t.getDeadline(), t.getStatus()))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        undoStack.push(snapshot);
        if (undoStack.size() > MAX_UNDO_DEPTH) {
            // Remove the oldest entry (bottom of the deque)
            ((ArrayDeque<List<TaskUnit>>) undoStack).removeLast();
        }
        redoStack.clear();
    }

    /**
     * Undo: restore the previous tasks snapshot.
     * Returns true if undo was performed.
     */
    public boolean undo() {
        if (undoStack.isEmpty()) return false;
        // Push current state onto redo stack before restoring
        List<TaskUnit> current = tasks.stream()
                .map(t -> new TaskUnit(t.getId(), t.getSubjectId(), t.getTitle(),
                        t.getDifficulty(), t.getEstimatedMinutes(),
                        t.getDeadline(), t.getStatus()))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        redoStack.push(current);
        List<TaskUnit> previous = undoStack.pop();
        tasks.clear();
        tasks.addAll(previous);
        return true;
    }

    /**
     * Redo: reapply the most-recently undone state.
     * Returns true if redo was performed.
     */
    public boolean redo() {
        if (redoStack.isEmpty()) return false;
        List<TaskUnit> current = tasks.stream()
                .map(t -> new TaskUnit(t.getId(), t.getSubjectId(), t.getTitle(),
                        t.getDifficulty(), t.getEstimatedMinutes(),
                        t.getDeadline(), t.getStatus()))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        undoStack.push(current);
        List<TaskUnit> next = redoStack.pop();
        tasks.clear();
        tasks.addAll(next);
        return true;
    }

    /** Returns true if undo history is available. */
    public boolean canUndo() { return !undoStack.isEmpty(); }

    /** Returns true if redo history is available. */
    public boolean canRedo() { return !redoStack.isEmpty(); }
}
