package com.studyflow.model;

// Java equivalent: class ScheduledBlock — one time slot in a daily study plan
public class ScheduledBlock {
    private int taskId;
    private String taskTitle;
    private String subjectName;
    private String timeSlot;
    private int priorityScore;
    private int estimatedMinutes;
    private TaskDifficulty difficulty;

    public ScheduledBlock() {}

    public ScheduledBlock(int taskId, String taskTitle, String subjectName, String timeSlot,
                          int priorityScore, int estimatedMinutes, TaskDifficulty difficulty) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.subjectName = subjectName;
        this.timeSlot = timeSlot;
        this.priorityScore = priorityScore;
        this.estimatedMinutes = estimatedMinutes;
        this.difficulty = difficulty;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }
    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public TaskDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(TaskDifficulty difficulty) { this.difficulty = difficulty; }
}
