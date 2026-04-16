package com.studyflow.model;

/**
 * ExamCollision — two tasks whose deadlines fall on the same day,
 * creating a scheduling conflict.
 */
public class ExamCollision {

    private int taskId1;
    private int taskId2;
    private String title1;
    private String title2;
    private String deadline;     // Shared or adjacent deadline (ISO date)
    private String conflictType; // "same_day" | "adjacent_day"
    // Penalty label: e.g. "High-difficulty collision on 2026-04-15"
    private String penaltyLabel;

    public ExamCollision() {}

    public ExamCollision(int taskId1, int taskId2, String title1, String title2,
                         String deadline, String conflictType, String penaltyLabel) {
        this.taskId1 = taskId1;
        this.taskId2 = taskId2;
        this.title1 = title1;
        this.title2 = title2;
        this.deadline = deadline;
        this.conflictType = conflictType;
        this.penaltyLabel = penaltyLabel;
    }

    public int getTaskId1() { return taskId1; }
    public void setTaskId1(int taskId1) { this.taskId1 = taskId1; }
    public int getTaskId2() { return taskId2; }
    public void setTaskId2(int taskId2) { this.taskId2 = taskId2; }
    public String getTitle1() { return title1; }
    public void setTitle1(String title1) { this.title1 = title1; }
    public String getTitle2() { return title2; }
    public void setTitle2(String title2) { this.title2 = title2; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public String getConflictType() { return conflictType; }
    public void setConflictType(String conflictType) { this.conflictType = conflictType; }
    public String getPenaltyLabel() { return penaltyLabel; }
    public void setPenaltyLabel(String penaltyLabel) { this.penaltyLabel = penaltyLabel; }
}
