package com.studyflow.model;

// Java equivalent: Map<TaskStatus, Long> grouped = tasks.stream()
//   .collect(Collectors.groupingBy(TaskUnit::getStatus, Collectors.counting()))
public class TaskStats {
    private int scheduledCount;
    private int inProgressCount;
    private int completedCount;

    public TaskStats() {}

    public TaskStats(int scheduledCount, int inProgressCount, int completedCount) {
        this.scheduledCount = scheduledCount;
        this.inProgressCount = inProgressCount;
        this.completedCount = completedCount;
    }

    public int getScheduledCount() { return scheduledCount; }
    public void setScheduledCount(int scheduledCount) { this.scheduledCount = scheduledCount; }
    public int getInProgressCount() { return inProgressCount; }
    public void setInProgressCount(int inProgressCount) { this.inProgressCount = inProgressCount; }
    public int getCompletedCount() { return completedCount; }
    public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }
}
