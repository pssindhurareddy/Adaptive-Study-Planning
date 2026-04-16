package com.studyflow.model;

import java.util.List;

// Java equivalent: analyticsService.getAnalytics() — HashMap + for-each loop aggregation
public class AnalyticsData {
    private List<FocusScorePoint> focusScoreHistory;
    private List<SubjectPerformance> subjectPerformance;
    private List<WeeklyHours> weeklyHours;

    public AnalyticsData() {}

    public AnalyticsData(List<FocusScorePoint> focusScoreHistory,
                         List<SubjectPerformance> subjectPerformance,
                         List<WeeklyHours> weeklyHours) {
        this.focusScoreHistory = focusScoreHistory;
        this.subjectPerformance = subjectPerformance;
        this.weeklyHours = weeklyHours;
    }

    public List<FocusScorePoint> getFocusScoreHistory() { return focusScoreHistory; }
    public void setFocusScoreHistory(List<FocusScorePoint> focusScoreHistory) { this.focusScoreHistory = focusScoreHistory; }
    public List<SubjectPerformance> getSubjectPerformance() { return subjectPerformance; }
    public void setSubjectPerformance(List<SubjectPerformance> subjectPerformance) { this.subjectPerformance = subjectPerformance; }
    public List<WeeklyHours> getWeeklyHours() { return weeklyHours; }
    public void setWeeklyHours(List<WeeklyHours> weeklyHours) { this.weeklyHours = weeklyHours; }
}
