package com.studyflow.model;

public class ProgressLog {
    private int taskId;
    private boolean completed;
    private int actualTime;
    private int interruptions;

    public ProgressLog() {}

    public ProgressLog(int taskId, boolean completed, int actualTime, int interruptions) {
        this.taskId = taskId;
        this.completed = completed;
        this.actualTime = actualTime;
        this.interruptions = interruptions;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public int getActualTime() { return actualTime; }
    public void setActualTime(int actualTime) { this.actualTime = actualTime; }
    public int getInterruptions() { return interruptions; }
    public void setInterruptions(int interruptions) { this.interruptions = interruptions; }
}
