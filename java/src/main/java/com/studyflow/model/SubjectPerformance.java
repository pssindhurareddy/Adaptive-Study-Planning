package com.studyflow.model;

public class SubjectPerformance {
    private String subjectName;
    private int completedTasks;
    private int avgScore;

    public SubjectPerformance() {}

    public SubjectPerformance(String subjectName, int completedTasks, int avgScore) {
        this.subjectName = subjectName;
        this.completedTasks = completedTasks;
        this.avgScore = avgScore;
    }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }
    public int getAvgScore() { return avgScore; }
    public void setAvgScore(int avgScore) { this.avgScore = avgScore; }
}
