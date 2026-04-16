package com.studyflow.model;

// Java equivalent: class ActiveFocusSession { int taskId; int sessionNumber; ... }
// Internal mutable state for an active Pomodoro focus session.
public class ActiveFocusSession {
    private int taskId;
    private int sessionNumber;
    private int interruptions;
    private long startTimeMs;  // System.currentTimeMillis() at session start

    public ActiveFocusSession() {}

    public ActiveFocusSession(int taskId, int sessionNumber, long startTimeMs) {
        this.taskId = taskId;
        this.sessionNumber = sessionNumber;
        this.interruptions = 0;
        this.startTimeMs = startTimeMs;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public int getSessionNumber() { return sessionNumber; }
    public void setSessionNumber(int sessionNumber) { this.sessionNumber = sessionNumber; }
    public int getInterruptions() { return interruptions; }
    public void setInterruptions(int interruptions) { this.interruptions = interruptions; }
    public long getStartTimeMs() { return startTimeMs; }
    public void setStartTimeMs(long startTimeMs) { this.startTimeMs = startTimeMs; }
    public void incrementInterruptions() { this.interruptions++; }
}
