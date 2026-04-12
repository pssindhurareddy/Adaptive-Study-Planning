import Types "../types/study";
import StudyLib "../lib/study";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

// StudyMixin — public API surface for StudyFlow
// Java equivalent: @RestController exposing methods from TaskManager, SessionManager, ScoreCalculator services
mixin (
  users : List.List<Types.User>,
  subjects : List.List<Types.Subject>,
  tasks : List.List<Types.TaskUnit>,
  logs : List.List<Types.ProgressLog>,
  // Java equivalent: HashMap<UserId, FocusSession> activeSessions = new HashMap<>()
  activeSessions : Map.Map<Nat, Types.ActiveFocusSession>,
) {
  var nextSubjectId : Nat = 1;
  var nextTaskId : Nat = 1;
  var seeded : Bool = false;

  // ── Seed ────────────────────────────────────────────────────────────────

  public func seedDemoData() : async () {
    if (seeded) return;
    let (newSid, newTid) = StudyLib.seedDemoData(users, subjects, tasks, logs, nextSubjectId, nextTaskId);
    nextSubjectId := newSid;
    nextTaskId := newTid;
    seeded := true;
  };

  // ── User ────────────────────────────────────────────────────────────────

  public query func getUser() : async ?Types.User {
    StudyLib.getUser(users)
  };

  public func createUser(name : Text, maxDailyHours : Nat, fatigueLevel : Nat) : async Types.User {
    StudyLib.upsertUser(users, name, maxDailyHours, fatigueLevel)
  };

  public func updateUser(name : Text, maxDailyHours : Nat, fatigueLevel : Nat) : async Types.User {
    StudyLib.upsertUser(users, name, maxDailyHours, fatigueLevel)
  };

  // ── Subjects ────────────────────────────────────────────────────────────

  public query func listSubjects() : async [Types.Subject] {
    StudyLib.getSubjects(subjects)
  };

  public func addSubject(name : Text, weight : Nat) : async Types.Subject {
    let s = StudyLib.addSubject(subjects, nextSubjectId, name, weight);
    nextSubjectId += 1;
    s
  };

  public func removeSubject(id : Nat) : async Bool {
    StudyLib.deleteSubject(subjects, id)
  };

  // ── TaskManager API ─────────────────────────────────────────────────────
  // Java equivalent: TaskManager.listTasks() — returns sorted ArrayList<TaskUnit>

  // Returns all tasks sorted by priority score (Comparator pattern)
  // Java equivalent: taskManager.sortByPriority() — Collections.sort with custom Comparator
  public query func listTasks() : async [Types.TaskUnit] {
    StudyLib.listTasksSorted(tasks, subjects)
  };

  public func addTask(
    subjectId : Nat,
    title : Text,
    difficulty : Types.TaskDifficulty,
    estimatedMinutes : Nat,
    deadline : Text,
  ) : async Types.TaskUnit {
    let t = StudyLib.addTask(tasks, nextTaskId, subjectId, title, difficulty, estimatedMinutes, deadline);
    nextTaskId += 1;
    t
  };

  // Delete a task permanently — removes it from the in-memory ArrayList
  // Java equivalent: taskManager.deleteTask(taskId) — tasks.removeIf(t -> t.id == taskId)
  public func deleteTask(taskId : Nat) : async Bool {
    StudyLib.deleteTask(tasks, taskId)
  };

  // Status transitions: Scheduled -> InProgress -> Completed
  // Java equivalent: taskManager.updateStatus(taskId, TaskStatus.IN_PROGRESS) — Iterator pattern
  public func updateTaskStatus(taskId : Nat, status : Types.TaskStatus) : async ?Types.TaskUnit {
    StudyLib.updateTaskStatus(tasks, taskId, status)
  };

  // ── Dashboard ───────────────────────────────────────────────────────────
  // Java equivalent: ScoreCalculator.getDashboardData(tasks, logs)

  public query func getDashboard() : async Types.DashboardData {
    StudyLib.getDashboardData(tasks, logs)
  };

  // ── SessionManager API ──────────────────────────────────────────────────
  // Java equivalent: SessionManager — HashMap<UserId, FocusSession>

  // Start a Pomodoro session — HashMap.put(userId, session)
  public func startFocusSession(taskId : Nat) : async Types.FocusSession {
    // Use userId=1 (single-user app)
    StudyLib.startFocusSession(tasks, logs, activeSessions, 1, taskId, Time.now())
  };

  // End the session — HashMap.remove(userId) + log to ArrayList
  public func endFocusSession() : async ?Types.ProgressLog {
    StudyLib.endFocusSession(activeSessions, logs, tasks, 1, Time.now())
  };

  // Record interruption — HashMap.get(userId).interruptions++
  public func recordInterruption() : async () {
    StudyLib.recordInterruption(activeSessions, 1)
  };

  // Get active session — HashMap.get(userId) (read-only)
  public query func getActiveSession() : async ?Types.FocusSession {
    StudyLib.getActiveSession(activeSessions, 1)
  };

  // ── Progress Logging ─────────────────────────────────────────────────────

  public func logProgress(taskId : Nat, completed : Bool, actualTime : Nat, interruptions : Nat) : async Types.ProgressLog {
    let entry : Types.ProgressLog = { taskId; completed; actualTime; interruptions };
    logs.add(entry);
    if (completed) {
      ignore StudyLib.updateTaskStatus(tasks, taskId, #Completed);
    };
    entry
  };

  // ── Analytics ────────────────────────────────────────────────────────────
  // Java equivalent: analyticsService.getAnalytics() — HashMap + for-each loop aggregation

  public query func getAnalytics() : async Types.AnalyticsData {
    StudyLib.getAnalytics(tasks, subjects, logs)
  };

  // ── SchedulingService — getDailySchedule ─────────────────────────────────
  // Java equivalent: schedulingService.generateDailySchedule()
  // Sorts active tasks by priorityScore desc (Comparator.comparingInt(Task::getPriorityScore).reversed())
  // and assigns top 5 to fixed time slots (9AM, 11AM, 1PM, 3PM, 5PM)

  public query func getDailySchedule() : async [Types.ScheduledBlock] {
    StudyLib.getDailySchedule(tasks, subjects)
  };

  // ── Priority Queue ────────────────────────────────────────────────────────
  // Java equivalent: PriorityQueue<PriorityQueueItem> sorted by priorityScore desc
  // Returns top 5 highest-priority non-completed tasks

  public query func getPriorityQueue() : async [Types.PriorityQueueItem] {
    StudyLib.getPriorityQueue(tasks, subjects)
  };

  // ── Task Stats (groupBy demo) ─────────────────────────────────────────────
  // Java equivalent: tasks.stream().collect(Collectors.groupingBy(TaskUnit::getStatus, Collectors.counting()))
  // Returns counts grouped by status — demonstrates HashMap grouping concept

  public query func getTaskStats() : async Types.TaskStats {
    StudyLib.getTaskStats(tasks)
  };

  // ── Subject Leaderboard ───────────────────────────────────────────────────
  // Java equivalent: subjects sorted by completionRate desc
  // Comparator.comparingDouble(SubjectLeaderboardEntry::getCompletionRate).reversed()

  public query func getSubjectLeaderboard() : async [Types.SubjectLeaderboardEntry] {
    StudyLib.getSubjectLeaderboard(subjects, tasks)
  };
};
