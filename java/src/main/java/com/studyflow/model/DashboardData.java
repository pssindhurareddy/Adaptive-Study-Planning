package com.studyflow.model;

// Dashboard: computed by ScoreCalculator service
public class DashboardData {
    private int focusScore;
    private int dailyProgress;
    private int totalTasks;
    private int completedTasks;
    private int inProgressTasks;
    private int scheduledTasks;
    private int stabilityScore;
    private int studyStreak;

    public DashboardData() {}

    public int getFocusScore() { return focusScore; }
    public void setFocusScore(int focusScore) { this.focusScore = focusScore; }
    public int getDailyProgress() { return dailyProgress; }
    public void setDailyProgress(int dailyProgress) { this.dailyProgress = dailyProgress; }
    public int getTotalTasks() { return totalTasks; }
    public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }
    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }
    public int getInProgressTasks() { return inProgressTasks; }
    public void setInProgressTasks(int inProgressTasks) { this.inProgressTasks = inProgressTasks; }
    public int getScheduledTasks() { return scheduledTasks; }
    public void setScheduledTasks(int scheduledTasks) { this.scheduledTasks = scheduledTasks; }
    public int getStabilityScore() { return stabilityScore; }
    public void setStabilityScore(int stabilityScore) { this.stabilityScore = stabilityScore; }
    public int getStudyStreak() { return studyStreak; }
    public void setStudyStreak(int studyStreak) { this.studyStreak = studyStreak; }
}
