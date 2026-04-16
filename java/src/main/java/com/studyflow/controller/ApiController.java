package com.studyflow.controller;

import com.studyflow.model.*;
import com.studyflow.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ApiController — REST @RestController exposing all backend methods.
 * Java equivalent: @RestController exposing methods from
 *   TaskService, SessionService, ScoreCalculator, SchedulingService,
 *   AnalyticsService, BurnoutService, CollisionService, ProcrastinationService,
 *   AchievementService
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private final UserService userService;
    private final SubjectService subjectService;
    private final TaskService taskService;
    private final ScoreCalculator scoreCalculator;
    private final SessionService sessionService;
    private final AnalyticsService analyticsService;
    private final SchedulingService schedulingService;
    private final SeedService seedService;
    private final BurnoutService burnoutService;
    private final CollisionService collisionService;
    private final ProcrastinationService procrastinationService;
    private final AchievementService achievementService;
    private final StudyDataStore store;

    public ApiController(UserService userService, SubjectService subjectService,
                         TaskService taskService, ScoreCalculator scoreCalculator,
                         SessionService sessionService, AnalyticsService analyticsService,
                         SchedulingService schedulingService, SeedService seedService,
                         BurnoutService burnoutService, CollisionService collisionService,
                         ProcrastinationService procrastinationService,
                         AchievementService achievementService, StudyDataStore store) {
        this.userService = userService;
        this.subjectService = subjectService;
        this.taskService = taskService;
        this.scoreCalculator = scoreCalculator;
        this.sessionService = sessionService;
        this.analyticsService = analyticsService;
        this.schedulingService = schedulingService;
        this.seedService = seedService;
        this.burnoutService = burnoutService;
        this.collisionService = collisionService;
        this.procrastinationService = procrastinationService;
        this.achievementService = achievementService;
        this.store = store;
    }

    // ── Seed ──────────────────────────────────────────────────────────────────

    @PostMapping("/seed")
    public ResponseEntity<Void> seedDemoData() {
        seedService.seedDemoData();
        return ResponseEntity.ok().build();
    }

    // ── User ──────────────────────────────────────────────────────────────────

    @GetMapping("/user")
    public ResponseEntity<User> getUser() {
        Optional<User> user = userService.getUser();
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/user")
    public ResponseEntity<User> createUser(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        int maxDailyHours = ((Number) body.get("maxDailyHours")).intValue();
        int fatigueLevel = ((Number) body.get("fatigueLevel")).intValue();
        User user = userService.upsertUser(name, maxDailyHours, fatigueLevel);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/user")
    public ResponseEntity<User> updateUser(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        int maxDailyHours = ((Number) body.get("maxDailyHours")).intValue();
        int fatigueLevel = ((Number) body.get("fatigueLevel")).intValue();
        User user = userService.upsertUser(name, maxDailyHours, fatigueLevel);
        return ResponseEntity.ok(user);
    }

    // ── Subjects ──────────────────────────────────────────────────────────────

    @GetMapping("/subjects")
    public List<Subject> listSubjects() {
        return subjectService.listSubjects();
    }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> addSubject(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        int weight = ((Number) body.get("weight")).intValue();
        return ResponseEntity.ok(subjectService.addSubject(name, weight));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Boolean> removeSubject(@PathVariable int id) {
        boolean removed = subjectService.removeSubject(id);
        return ResponseEntity.ok(removed);
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────

    /**
     * Returns all tasks sorted by priority score (Comparator pattern).
     * Java equivalent: taskService.sortByPriority() — Collections.sort with custom Comparator
     */
    @GetMapping("/tasks")
    public List<TaskUnit> listTasks() {
        return taskService.listTasksSorted();
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskUnit> addTask(@RequestBody Map<String, Object> body) {
        int subjectId = ((Number) body.get("subjectId")).intValue();
        String title = (String) body.get("title");
        TaskDifficulty difficulty = TaskDifficulty.valueOf((String) body.get("difficulty"));
        int estimatedMinutes = ((Number) body.get("estimatedMinutes")).intValue();
        String deadline = (String) body.get("deadline");
        TaskUnit task = taskService.addTask(subjectId, title, difficulty, estimatedMinutes, deadline);
        return ResponseEntity.ok(task);
    }

    /**
     * Delete a task permanently — removes it from the in-memory ArrayList.
     * Java equivalent: taskService.deleteTask(taskId) — tasks.removeIf(t -> t.id == taskId)
     */
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable int id) {
        return ResponseEntity.ok(taskService.deleteTask(id));
    }

    /**
     * Status transitions: Scheduled -> InProgress -> Completed.
     * Java equivalent: taskService.updateStatus(taskId, TaskStatus.IN_PROGRESS) — Iterator pattern
     */
    @PutMapping("/tasks/{id}/status")
    public ResponseEntity<TaskUnit> updateTaskStatus(@PathVariable int id,
                                                     @RequestBody Map<String, String> body) {
        TaskStatus status = TaskStatus.valueOf(body.get("status"));
        Optional<TaskUnit> updated = taskService.updateTaskStatus(id, status);
        return updated.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Undo / Redo ───────────────────────────────────────────────────────────

    /**
     * Undo the last task mutation (add / delete / status change).
     * Returns updated task list.
     */
    @PostMapping("/tasks/undo")
    public ResponseEntity<Map<String, Object>> undoTask() {
        boolean done = taskService.undo();
        return ResponseEntity.ok(Map.of(
                "success", done,
                "canUndo", taskService.canUndo(),
                "canRedo", taskService.canRedo(),
                "tasks", taskService.listTasksSorted()
        ));
    }

    /**
     * Redo the most-recently undone task mutation.
     * Returns updated task list.
     */
    @PostMapping("/tasks/redo")
    public ResponseEntity<Map<String, Object>> redoTask() {
        boolean done = taskService.redo();
        return ResponseEntity.ok(Map.of(
                "success", done,
                "canUndo", taskService.canUndo(),
                "canRedo", taskService.canRedo(),
                "tasks", taskService.listTasksSorted()
        ));
    }

    /** Returns current undo/redo availability. */
    @GetMapping("/tasks/history")
    public Map<String, Boolean> getUndoRedoState() {
        return Map.of("canUndo", taskService.canUndo(), "canRedo", taskService.canRedo());
    }

    // ── Task Dependencies ─────────────────────────────────────────────────────

    /** Get all task dependencies (edges of the dependency graph). */
    @GetMapping("/dependency-graph")
    public List<TaskDependency> getDependencyGraph() {
        return store.getDependencies();
    }

    /** Add a dependency: taskId depends on dependsOnTaskId. */
    @PostMapping("/tasks/{taskId}/dependencies")
    public ResponseEntity<TaskDependency> addDependency(@PathVariable int taskId,
                                                        @RequestBody Map<String, Object> body) {
        int dependsOnTaskId = ((Number) body.get("dependsOnTaskId")).intValue();
        // Prevent duplicate edges
        boolean exists = store.getDependencies().stream()
                .anyMatch(d -> d.getTaskId() == taskId && d.getDependsOnTaskId() == dependsOnTaskId);
        if (!exists) {
            TaskDependency dep = new TaskDependency(taskId, dependsOnTaskId);
            store.getDependencies().add(dep);
            return ResponseEntity.ok(dep);
        }
        return ResponseEntity.ok(new TaskDependency(taskId, dependsOnTaskId));
    }

    /** Remove a dependency between two tasks. */
    @DeleteMapping("/tasks/{taskId}/dependencies/{dependsOnId}")
    public ResponseEntity<Boolean> removeDependency(@PathVariable int taskId,
                                                    @PathVariable int dependsOnId) {
        boolean removed = store.getDependencies()
                .removeIf(d -> d.getTaskId() == taskId && d.getDependsOnTaskId() == dependsOnId);
        return ResponseEntity.ok(removed);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /** Java equivalent: ScoreCalculator.getDashboardData(tasks, logs) */
    @GetMapping("/dashboard")
    public DashboardData getDashboard() {
        return scoreCalculator.getDashboardData();
    }

    // ── Session Manager ───────────────────────────────────────────────────────

    /** Start a Pomodoro session — HashMap.put(userId, session) */
    @PostMapping("/sessions/start/{taskId}")
    public ResponseEntity<FocusSession> startFocusSession(@PathVariable int taskId) {
        return ResponseEntity.ok(sessionService.startFocusSession(taskId));
    }

    /** End the session — HashMap.remove(userId) + log to ArrayList */
    @PostMapping("/sessions/end")
    public ResponseEntity<ProgressLog> endFocusSession() {
        Optional<ProgressLog> log = sessionService.endFocusSession();
        return log.map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Record interruption — HashMap.get(userId).interruptions++ */
    @PostMapping("/sessions/interruption")
    public ResponseEntity<Void> recordInterruption() {
        sessionService.recordInterruption();
        return ResponseEntity.ok().build();
    }

    /** Get active session — HashMap.get(userId) (read-only) */
    @GetMapping("/sessions/active")
    public ResponseEntity<FocusSession> getActiveSession() {
        Optional<FocusSession> session = sessionService.getActiveSession();
        return session.map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // ── Progress Logging ──────────────────────────────────────────────────────

    @PostMapping("/progress")
    public ResponseEntity<ProgressLog> logProgress(@RequestBody Map<String, Object> body) {
        int taskId = ((Number) body.get("taskId")).intValue();
        boolean completed = (Boolean) body.get("completed");
        int actualTime = ((Number) body.get("actualTime")).intValue();
        int interruptions = ((Number) body.get("interruptions")).intValue();
        return ResponseEntity.ok(sessionService.logProgress(taskId, completed, actualTime, interruptions));
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    /** Java equivalent: analyticsService.getAnalytics() — HashMap + for-each loop aggregation */
    @GetMapping("/analytics")
    public AnalyticsData getAnalytics() {
        return analyticsService.getAnalytics();
    }

    // ── Scheduling ────────────────────────────────────────────────────────────

    /** Java equivalent: schedulingService.generateDailySchedule() */
    @GetMapping("/schedule")
    public List<ScheduledBlock> getDailySchedule() {
        return schedulingService.getDailySchedule();
    }

    /** Java equivalent: PriorityQueue<PriorityQueueItem> sorted by priorityScore desc */
    @GetMapping("/priority-queue")
    public List<PriorityQueueItem> getPriorityQueue() {
        return schedulingService.getPriorityQueue();
    }

    /**
     * Task stats grouped by status.
     * Java equivalent: tasks.stream().collect(Collectors.groupingBy(TaskUnit::getStatus, Collectors.counting()))
     */
    @GetMapping("/task-stats")
    public TaskStats getTaskStats() {
        return schedulingService.getTaskStats();
    }

    /**
     * Subject leaderboard sorted by completion rate desc.
     * Java equivalent: Comparator.comparingDouble(SubjectLeaderboardEntry::getCompletionRate).reversed()
     */
    @GetMapping("/subject-leaderboard")
    public List<SubjectLeaderboardEntry> getSubjectLeaderboard() {
        return schedulingService.getSubjectLeaderboard();
    }

    /** Get scheduled break blocks for the day. */
    @GetMapping("/breaks")
    public List<BreakBlock> getScheduledBreaks() {
        return schedulingService.getScheduledBreaks();
    }

    // ── Burnout Detector ──────────────────────────────────────────────────────

    /**
     * Detect burnout risk from session history and user fatigue level.
     * Returns level: "none" | "low" | "medium" | "high"
     */
    @GetMapping("/burnout")
    public BurnoutStatus getBurnoutStatus() {
        return burnoutService.getBurnoutStatus();
    }

    // ── Procrastination Debt Tracker ──────────────────────────────────────────

    /**
     * Return procrastination debt: overdue tasks + debt score.
     * overdueCount: tasks past deadline not yet completed
     * debtScore: 0–100+ penalty
     */
    @GetMapping("/procrastination-debt")
    public ProcrastinationDebt getProcrastinationDebt() {
        return procrastinationService.getDebt();
    }

    // ── Exam Collision Detector ───────────────────────────────────────────────

    /** Find all deadline collisions among non-completed tasks. */
    @GetMapping("/collisions")
    public List<ExamCollision> getCollisions() {
        return collisionService.findCollisions();
    }

    /**
     * Resolve a collision by shifting the specified task's deadline forward.
     * Body: { "taskId": N, "shiftDays": D }
     * Returns the updated task.
     */
    @PostMapping("/collisions/resolve")
    public ResponseEntity<TaskUnit> resolveCollision(@RequestBody Map<String, Object> body) {
        int taskId = ((Number) body.get("taskId")).intValue();
        int shiftDays = body.containsKey("shiftDays")
                ? ((Number) body.get("shiftDays")).intValue() : 2;
        Optional<TaskUnit> updated = collisionService.resolveCollision(taskId, shiftDays);
        return updated.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Achievements ──────────────────────────────────────────────────────────

    /** Return all achievements with their current earned status. */
    @GetMapping("/achievements")
    public List<Achievement> getAchievements() {
        return achievementService.getAchievements();
    }
}
