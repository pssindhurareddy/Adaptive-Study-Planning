package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
/**
 * SchedulingService — generates the daily study schedule and priority queue.
 * Java equivalent: class SchedulingService { public List<ScheduledBlock> generateDailySchedule() }
 *
 *   tasks.stream()
 *     .filter(t -> t.status != COMPLETED)
 *     .sorted(Comparator.comparingInt(Task::getPriorityScore).reversed())
 *     .limit(5)
 *     .collect(Collectors.toList())
 */
@Service
public class SchedulingService {

    // Time slots for a study day — fixed schedule buckets
    // Java equivalent: static final String[] TIME_SLOTS = {"9:00 AM", "11:00 AM", ...}
    private static final String[] TIME_SLOTS = {"9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"};

    private final StudyDataStore store;
    private final SubjectService subjectService;

    public SchedulingService(StudyDataStore store, SubjectService subjectService) {
        this.store = store;
        this.subjectService = subjectService;
    }

    // ── Priority score helpers (for scheduling) ───────────────────────────────

    /**
     * Urgency score for deadline: 20 (far) to 100 (within 1 day).
     * Java equivalent: private int getUrgencyScore(String deadline)
     */
    private int urgencyScore(String deadline) {
        try {
            LocalDate dl = LocalDate.parse(deadline);
            LocalDate today = LocalDate.now();
            long diff = ChronoUnit.DAYS.between(today, dl);
            if (diff <= 0) return 100;
            if (diff <= 1) return 100;
            if (diff <= 3) return 80;
            if (diff <= 7) return 60;
            if (diff <= 14) return 40;
            return 20;
        } catch (Exception e) {
            return 20;
        }
    }

    /**
     * Difficulty multiplier for priority score.
     * Java equivalent: switch (difficulty) { case Low: return 1; case Medium: return 2; case High: return 3; }
     */
    private int difficultyMultiplier(TaskDifficulty d) {
        return switch (d) {
            case Low -> 1;
            case Medium -> 2;
            case High -> 3;
        };
    }

    /**
     * Priority score for scheduling: urgencyScore × difficultyMultiplier.
     * Java equivalent: int score = getUrgencyScore(task) * getDifficultyMultiplier(task)
     */
    public int getSchedulePriorityScore(TaskUnit task) {
        return urgencyScore(task.getDeadline()) * difficultyMultiplier(task.getDifficulty());
    }

    /**
     * Generate the daily schedule — top 5 active tasks sorted by priority.
     * Java equivalent: schedulingService.generateDailySchedule()
     * Sorts active tasks by priorityScore desc and assigns to fixed time slots (9AM, 11AM, 1PM, 3PM, 5PM).
     */
    public List<ScheduledBlock> getDailySchedule() {
        // Java equivalent: tasks.stream().filter(t -> t.status != TaskStatus.COMPLETED)
        List<TaskUnit> activeTasks = store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Scheduled || t.getStatus() == TaskStatus.InProgress)
                .sorted(Comparator.comparingInt(this::getSchedulePriorityScore).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<ScheduledBlock> result = new ArrayList<>();
        for (int i = 0; i < activeTasks.size(); i++) {
            TaskUnit task = activeTasks.get(i);
            String subjectName = subjectService.findById(task.getSubjectId())
                    .map(Subject::getName)
                    .orElse("Unknown");
            result.add(new ScheduledBlock(
                    task.getId(),
                    task.getTitle(),
                    subjectName,
                    TIME_SLOTS[i],
                    getSchedulePriorityScore(task),
                    task.getEstimatedMinutes(),
                    task.getDifficulty()
            ));
        }
        return result;
    }

    /**
     * Return top 5 highest-priority non-completed tasks (priority queue view).
     * Java equivalent: PriorityQueue<PriorityQueueItem> pq = new PriorityQueue<>(
     *   Comparator.comparingInt(PriorityQueueItem::getPriorityScore).reversed()
     * );
     */
    public List<PriorityQueueItem> getPriorityQueue() {
        // Filter out completed tasks
        // Java equivalent: tasks.stream().filter(t -> t.status != COMPLETED)
        List<TaskUnit> activeTasks = store.getTasks().stream()
                .filter(t -> t.getStatus() != TaskStatus.Completed)
                .sorted(Comparator.comparingInt(this::getSchedulePriorityScore).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<PriorityQueueItem> result = new ArrayList<>();
        for (TaskUnit task : activeTasks) {
            String subjectName = subjectService.findById(task.getSubjectId())
                    .map(Subject::getName)
                    .orElse("Unknown");
            result.add(new PriorityQueueItem(
                    task.getId(),
                    task.getTitle(),
                    subjectName,
                    getSchedulePriorityScore(task),
                    task.getDeadline(),
                    task.getDifficulty()
            ));
        }
        return result;
    }

    /**
     * Task stats grouped by status.
     * Java equivalent: Map<TaskStatus, Long> grouped =
     *   tasks.stream().collect(Collectors.groupingBy(TaskUnit::getStatus, Collectors.counting()))
     */
    public TaskStats getTaskStats() {
        // Java equivalent: grouped.getOrDefault(SCHEDULED, 0L)
        int scheduledCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Scheduled).count();
        int inProgressCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.InProgress).count();
        int completedCount = (int) store.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.Completed).count();
        return new TaskStats(scheduledCount, inProgressCount, completedCount);
    }

    /**
     * Generate scheduled break blocks interleaved with study sessions.
     * Follows the Pomodoro pattern: study 25–30 min → short break 5 min,
     * every 4th session → long break 15 min.
     *
     * Returns break slots for the day based on the study schedule.
     */
    public List<BreakBlock> getScheduledBreaks() {
        // Break slots follow study slots: study at 9am → break at 10am, etc.
        List<BreakBlock> breaks = new ArrayList<>();
        List<ScheduledBlock> schedule = getDailySchedule();

        for (int i = 0; i < schedule.size(); i++) {
            // Every 4th session gets a long break, others get a short break
            boolean longBreak = (i + 1) % 4 == 0;
            int duration = longBreak ? 15 : 5;
            String type = longBreak ? "long" : "short";
            // Compute break start time: study slot time + estimated minutes
            ScheduledBlock block = schedule.get(i);
            String breakSlot = computeBreakSlot(block.getTimeSlot(), block.getEstimatedMinutes());
            breaks.add(new BreakBlock(breakSlot, duration, type));
        }
        return breaks;
    }

    /**
     * Compute the break start time given a study slot time and its duration in minutes.
     * Example: "9:00 AM" + 60 min → "10:00 AM"
     */
    private String computeBreakSlot(String timeSlot, int studyMinutes) {
        try {
            // Parse "H:MM AM/PM" format
            String[] parts = timeSlot.split("[: ]");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            boolean pm = "PM".equalsIgnoreCase(parts[2]);
            if (pm && hour != 12) hour += 12;
            if (!pm && hour == 12) hour = 0;

            int totalMinutes = hour * 60 + minute + studyMinutes;
            int endHour = (totalMinutes / 60) % 24;
            int endMinute = totalMinutes % 60;

            String ampm = endHour >= 12 ? "PM" : "AM";
            int displayHour = endHour % 12;
            if (displayHour == 0) displayHour = 12;
            return String.format("%d:%02d %s", displayHour, endMinute, ampm);
        } catch (Exception e) {
            return timeSlot; // Fallback: return original slot
        }
    }

    /**
     * Subject leaderboard sorted by completion rate descending.
     * Java equivalent: subjects.stream()
     *   .map(s -> new SubjectLeaderboardEntry(s, getCompletionRate(s, tasks)))
     *   .sorted(Comparator.comparingDouble(SubjectLeaderboardEntry::getCompletionRate).reversed())
     *   .collect(Collectors.toList())
     */
    public List<SubjectLeaderboardEntry> getSubjectLeaderboard() {
        return store.getSubjects().stream()
                .map(s -> {
                    long total = store.getTasks().stream()
                            .filter(t -> t.getSubjectId() == s.getId()).count();
                    long completed = store.getTasks().stream()
                            .filter(t -> t.getSubjectId() == s.getId()
                                    && t.getStatus() == TaskStatus.Completed).count();
                    // Java equivalent: (int) Math.round((double) completed / total * 100)
                    int rate = total == 0 ? 0 : (int) ((completed * 100) / total);
                    return new SubjectLeaderboardEntry(s.getId(), s.getName(),
                            (int) total, (int) completed, rate);
                })
                .sorted(Comparator.comparingInt(SubjectLeaderboardEntry::getCompletionRate).reversed())
                .collect(Collectors.toList());
    }
}
