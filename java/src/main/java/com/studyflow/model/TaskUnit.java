package com.studyflow.model;

// Java equivalent: class TaskUnit implements Comparable<TaskUnit>
public class TaskUnit {
    private int id;
    private int subjectId;
    private String title;
    private TaskDifficulty difficulty;
    private int estimatedMinutes;
    private String deadline;
    private TaskStatus status;

    public TaskUnit() {}

    public TaskUnit(int id, int subjectId, String title, TaskDifficulty difficulty,
                    int estimatedMinutes, String deadline, TaskStatus status) {
        this.id = id;
        this.subjectId = subjectId;
        this.title = title;
        this.difficulty = difficulty;
        this.estimatedMinutes = estimatedMinutes;
        this.deadline = deadline;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public TaskDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(TaskDifficulty difficulty) { this.difficulty = difficulty; }
    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
}
