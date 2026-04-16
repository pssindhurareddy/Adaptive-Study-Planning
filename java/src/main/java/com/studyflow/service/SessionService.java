package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * SessionService — manages HashMap<UserId, FocusSession>.
 * Java equivalent: class SessionManager — HashMap<UserId, FocusSession>.
 * Demonstrates: HashMap put/get/remove, Stack-like session tracking.
 */
@Service
public class SessionService {

    private final StudyDataStore store;
    private final TaskService taskService;

    // Single-user app — userId is always 1
    private static final int USER_ID = 1;

    public SessionService(StudyDataStore store, TaskService taskService) {
        this.store = store;
        this.taskService = taskService;
    }

    /**
     * Start a Pomodoro focus session for a task.
     * Java equivalent: activeSessions.put(userId, new FocusSession(taskId, ...))
     */
    public FocusSession startFocusSession(int taskId) {
        // Mark task InProgress — Java: task.setStatus(TaskStatus.IN_PROGRESS)
        taskService.updateTaskStatus(taskId, TaskStatus.InProgress);

        List<ProgressLog> logs = store.getLogs();

        // Count past sessions for adaptive Pomodoro duration
        // Java equivalent: for (ProgressLog log : logs) { if (log.taskId == taskId) totalInterruptions += ... }
        List<ProgressLog> taskLogs = logs.stream()
                .filter(l -> l.getTaskId() == taskId)
                .toList();
        int totalInterruptions = taskLogs.stream().mapToInt(ProgressLog::getInterruptions).sum();
        int logCount = taskLogs.size();
        int avgInterruptions = logCount == 0 ? 0 : totalInterruptions / logCount;

        int sessionNumber = logCount + 1;

        // Adaptive Pomodoro duration based on past interruption rate
        int baseDuration;
        if (avgInterruptions >= 4) {
            baseDuration = 20;
        } else if (avgInterruptions < 2 && logCount > 0) {
            baseDuration = 30;
        } else {
            baseDuration = 25;
        }

        boolean isBreak = sessionNumber % 2 == 0;
        int durationMinutes;
        if (isBreak) {
            durationMinutes = ((sessionNumber / 2) % 4 == 0) ? 15 : 5;
        } else {
            durationMinutes = baseDuration;
        }

        // Java equivalent: activeSessions.put(userId, session)  — HashMap.put()
        ActiveFocusSession session = new ActiveFocusSession(taskId, sessionNumber,
                System.currentTimeMillis());
        store.getActiveSessions().put(USER_ID, session);

        return new FocusSession(taskId, sessionNumber, durationMinutes, isBreak);
    }

    /**
     * End the active session and log progress.
     * Java equivalent: FocusSession s = activeSessions.remove(userId)  — HashMap.remove()
     */
    public Optional<ProgressLog> endFocusSession() {
        // Java equivalent: FocusSession session = activeSessions.get(userId)  — HashMap.get()
        ActiveFocusSession session = store.getActiveSessions().get(USER_ID);
        if (session == null) return Optional.empty();

        long elapsedMs = System.currentTimeMillis() - session.getStartTimeMs();
        int actualTime = (int) (elapsedMs / 60_000); // convert ms to minutes

        boolean isBreak = session.getSessionNumber() % 2 == 0;
        ProgressLog log = new ProgressLog(session.getTaskId(), !isBreak, actualTime,
                session.getInterruptions());
        store.getLogs().add(log);

        if (!isBreak) {
            taskService.updateTaskStatus(session.getTaskId(), TaskStatus.Completed);
        }

        // Java equivalent: activeSessions.remove(userId)
        store.getActiveSessions().remove(USER_ID);
        return Optional.of(log);
    }

    /**
     * Record an interruption in the active session.
     * Java equivalent: activeSessions.get(userId).interruptions++
     */
    public void recordInterruption() {
        ActiveFocusSession session = store.getActiveSessions().get(USER_ID);
        if (session != null) {
            session.incrementInterruptions();
        }
    }

    /**
     * Get the current active session (read-only view).
     * Java equivalent: activeSessions.containsKey(userId) ? activeSessions.get(userId) : null
     */
    public Optional<FocusSession> getActiveSession() {
        ActiveFocusSession s = store.getActiveSessions().get(USER_ID);
        if (s == null) return Optional.empty();

        boolean isBreak = s.getSessionNumber() % 2 == 0;
        int durationMinutes;
        if (isBreak) {
            durationMinutes = ((s.getSessionNumber() / 2) % 4 == 0) ? 15 : 5;
        } else {
            durationMinutes = 25;
        }
        return Optional.of(new FocusSession(s.getTaskId(), s.getSessionNumber(),
                durationMinutes, isBreak));
    }

    /**
     * Log progress manually.
     * Java equivalent: logs.add(new ProgressLog(taskId, completed, actualTime, interruptions))
     */
    public ProgressLog logProgress(int taskId, boolean completed, int actualTime, int interruptions) {
        ProgressLog entry = new ProgressLog(taskId, completed, actualTime, interruptions);
        store.getLogs().add(entry);
        if (completed) {
            taskService.updateTaskStatus(taskId, TaskStatus.Completed);
        }
        return entry;
    }
}
