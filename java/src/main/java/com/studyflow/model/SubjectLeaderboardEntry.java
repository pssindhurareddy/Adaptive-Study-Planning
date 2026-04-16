package com.studyflow.model;

// Java equivalent: subjects sorted by completionRate desc
public class SubjectLeaderboardEntry {
    private int subjectId;
    private String subjectName;
    private int totalTasks;
    private int completedTasks;
    private int completionRate; // 0-100 percent

    public SubjectLeaderboardEntry() {}

    public SubjectLeaderboardEntry(int subjectId, String subjectName,
                                   int totalTasks, int completedTasks, int completionRate) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.completionRate = completionRate;
    }

    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public int getTotalTasks() { return totalTasks; }
    public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }
    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }
    public int getCompletionRate() { return completionRate; }
    public void setCompletionRate(int completionRate) { this.completionRate = completionRate; }
}
