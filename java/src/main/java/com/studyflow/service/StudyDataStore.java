package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory data store — single source of truth for all application state.
 * Java equivalent of the Motoko actor's top-level mutable collections.
 *
 *   ArrayList<User>                  users
 *   ArrayList<Subject>               subjects
 *   ArrayList<TaskUnit>              tasks       — managed by TaskService
 *   ArrayList<ProgressLog>           logs
 *   HashMap<Integer, ActiveFocusSession> activeSessions — managed by SessionService
 */
@Component
public class StudyDataStore {

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

    private int nextSubjectId = 1;
    private int nextTaskId = 1;
    private boolean seeded = false;

    // ── Accessors ────────────────────────────────────────────────────────────

    public List<User> getUsers() { return users; }
    public List<Subject> getSubjects() { return subjects; }
    public List<TaskUnit> getTasks() { return tasks; }
    public List<ProgressLog> getLogs() { return logs; }
    public Map<Integer, ActiveFocusSession> getActiveSessions() { return activeSessions; }

    public int getNextSubjectId() { return nextSubjectId; }
    public int getNextTaskId() { return nextTaskId; }
    public void incrementSubjectId() { nextSubjectId++; }
    public void incrementTaskId() { nextTaskId++; }

    public boolean isSeeded() { return seeded; }
    public void setSeeded(boolean seeded) { this.seeded = seeded; }
}
