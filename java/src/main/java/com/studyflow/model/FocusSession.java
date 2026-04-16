package com.studyflow.model;

// Java equivalent: class FocusSession (Pomodoro session view object)
public class FocusSession {
    private int taskId;
    private int sessionNumber;
    private int durationMinutes;
    private boolean isBreak;

    public FocusSession() {}

    public FocusSession(int taskId, int sessionNumber, int durationMinutes, boolean isBreak) {
        this.taskId = taskId;
        this.sessionNumber = sessionNumber;
        this.durationMinutes = durationMinutes;
        this.isBreak = isBreak;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public int getSessionNumber() { return sessionNumber; }
    public void setSessionNumber(int sessionNumber) { this.sessionNumber = sessionNumber; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public boolean isBreak() { return isBreak; }
    public void setBreak(boolean isBreak) { this.isBreak = isBreak; }
}
