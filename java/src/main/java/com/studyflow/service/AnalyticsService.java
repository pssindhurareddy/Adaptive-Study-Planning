package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * AnalyticsService — produces data for charts/history views.
 * Java equivalent: analyticsService.getAnalytics() — HashMap + for-each loop aggregation.
 */
@Service
public class AnalyticsService {

    private final StudyDataStore store;
    private final ScoreCalculator scoreCalculator;

    public AnalyticsService(StudyDataStore store, ScoreCalculator scoreCalculator) {
        this.store = store;
        this.scoreCalculator = scoreCalculator;
    }

    /**
     * Build full analytics data.
     * Java equivalent: analyticsService.getAnalytics()
     */
    public AnalyticsData getAnalytics() {
        List<ProgressLog> logs = store.getLogs();
        List<TaskUnit> tasks = store.getTasks();
        List<Subject> subjects = store.getSubjects();

        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        int baseScore = scoreCalculator.calculateFocusScore();

        // Build 7-day focus score history (simulated progression towards current score)
        List<FocusScorePoint> focusHistory = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            int dayScore = (i == 6) ? baseScore : Math.min(100, (baseScore * (i + 1)) / 7);
            focusHistory.add(new FocusScorePoint(days[i], dayScore));
        }

        // Per-subject performance — Java equivalent: Map<String, SubjectStats> map = new HashMap<>()
        // Java equivalent: for (Subject s : subjects) { ... map.put(s.name, stats); }
        List<SubjectPerformance> subjectPerf = new ArrayList<>();
        for (Subject s : subjects) {
            List<TaskUnit> subjectTasks = tasks.stream()
                    .filter(t -> t.getSubjectId() == s.getId())
                    .toList();
            long completedCount = subjectTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.Completed).count();
            List<ProgressLog> subjectLogs = logs.stream()
                    .filter(l -> subjectTasks.stream().anyMatch(t -> t.getId() == l.getTaskId()))
                    .toList();

            // Java equivalent: double total = 0; for (ProgressLog log : subjectLogs) { total += computeScore(log); }
            int avgScore = 0;
            if (!subjectLogs.isEmpty()) {
                int total = 0;
                for (ProgressLog log : subjectLogs) {
                    int base = log.isCompleted() ? 80 : 40;
                    int penalty = log.getInterruptions() * 5;
                    int score = Math.max(0, base - penalty);
                    total += score;
                }
                avgScore = Math.min(100, total / subjectLogs.size());
            }
            subjectPerf.add(new SubjectPerformance(s.getName(), (int) completedCount, avgScore));
        }

        // Weekly hours — Java equivalent: int[] weeklyHours = new int[7]
        List<WeeklyHours> weeklyHrs = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            int hrs = 0;
            if (i < logs.size()) {
                ProgressLog log = logs.get(i);
                hrs = (log.getActualTime() + 29) / 60;
            }
            weeklyHrs.add(new WeeklyHours(days[i], hrs));
        }

        return new AnalyticsData(focusHistory, subjectPerf, weeklyHrs);
    }
}
