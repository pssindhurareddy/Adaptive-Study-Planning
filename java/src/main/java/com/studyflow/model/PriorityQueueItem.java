package com.studyflow.model;

// Java equivalent: PriorityQueue<PriorityQueueItem> sorted by priorityScore desc
public class PriorityQueueItem {
    private int taskId;
    private String taskTitle;
    private String subjectName;
    private int priorityScore;
    private String deadline;
    private TaskDifficulty difficulty;

    public PriorityQueueItem() {}

    public PriorityQueueItem(int taskId, String taskTitle, String subjectName,
                             int priorityScore, String deadline, TaskDifficulty difficulty) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.subjectName = subjectName;
        this.priorityScore = priorityScore;
        this.deadline = deadline;
        this.difficulty = difficulty;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public TaskDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(TaskDifficulty difficulty) { this.difficulty = difficulty; }
}
