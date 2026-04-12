import Types "../types/study";
import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";

module {

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  // Safe Int -> Nat conversion (clamps negatives to 0)
  func toNat(i : Int) : Nat {
    if (i <= 0) 0 else Int.abs(i)
  };

  // Dead-simple "days since epoch" from "YYYY-MM-DD" text
  func parseDateDays(date : Text) : Nat {
    let parts = date.split(#char '-');
    let arr = parts.toArray();
    if (arr.size() < 3) return 0;
    let y = switch (Nat.fromText(arr[0])) { case (?n) n; case null 0 };
    let m = switch (Nat.fromText(arr[1])) { case (?n) n; case null 0 };
    let d = switch (Nat.fromText(arr[2])) { case (?n) n; case null 0 };
    y * 365 + m * 30 + d
  };

  // Approximate today in days from Time.now() nanoseconds
  func todayDays() : Nat {
    let ns = Time.now();
    if (ns <= 0) return 0;
    Int.abs(ns) / (86400 * 1_000_000_000)
  };

  // Urgency score for deadline: 20 (far) to 100 (within 1 day)
  // Java equivalent: private int getUrgencyScore(String deadline)
  func urgencyScore(deadline : Text) : Nat {
    let deadlineDays = parseDateDays(deadline);
    let today = todayDays();
    if (deadlineDays <= today) return 100;
    let diff : Nat = if (deadlineDays > today) deadlineDays - today else 0;
    if (diff <= 1) 100
    else if (diff <= 3) 80
    else if (diff <= 7) 60
    else if (diff <= 14) 40
    else 20
  };

  // Difficulty multiplier for priority score
  // Java equivalent: switch (difficulty) { case LOW: return 1; case MEDIUM: return 2; case HIGH: return 3; }
  func difficultyMultiplier(d : Types.TaskDifficulty) : Nat {
    switch (d) { case (#Low) 1; case (#Medium) 2; case (#High) 3 }
  };

  // Deadline urgency score: 1 (far away) to 5 (past due or today) — legacy, used by getPriorityScore
  // Java equivalent: private int getDeadlineUrgency(String deadline)
  func deadlineUrgency(deadline : Text) : Nat {
    let deadlineDays = parseDateDays(deadline);
    let today = todayDays();
    if (deadlineDays <= today) return 5;
    let diff : Nat = if (deadlineDays > today) deadlineDays - today else 0;
    if (diff <= 1) 5
    else if (diff <= 3) 4
    else if (diff <= 7) 3
    else if (diff <= 14) 2
    else 1
  };

  // Difficulty -> numeric weight for priority calculation (legacy)
  // Java equivalent: switch (difficulty) { case LOW: return 1; case MEDIUM: return 3; ... }
  func difficultyWeight(d : Types.TaskDifficulty) : Nat {
    switch (d) { case (#Low) 1; case (#Medium) 3; case (#High) 5 }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TaskManager
  // Java equivalent: class TaskManager — manages ArrayList<TaskUnit>
  // Provides: add, filter (stream().filter()), sort (Collections.sort + Comparator)
  // ─────────────────────────────────────────────────────────────────────────

  // Compute priority score for a task — used by Comparator
  // Java equivalent: implements Comparable<TaskUnit> — compareTo() logic
  public func getPriorityScore(task : Types.TaskUnit, subjects : List.List<Types.Subject>) : Nat {
    let urgency = deadlineUrgency(task.deadline);
    let diff = difficultyWeight(task.difficulty);
    // Subject weight from the subjects "ArrayList" lookup
    let weight = switch (subjects.find(func(s : Types.Subject) : Bool = s.id == task.subjectId)) {
      case (?s) s.weight;
      case null 1;
    };
    urgency + diff + weight
  };

  // Java equivalent: ArrayList<TaskUnit> tasks = new ArrayList<>();  tasks.add(t);
  public func addTask(
    tasks : List.List<Types.TaskUnit>,
    nextId : Nat,
    subjectId : Nat,
    title : Text,
    difficulty : Types.TaskDifficulty,
    estimatedMinutes : Nat,
    deadline : Text,
  ) : Types.TaskUnit {
    let t : Types.TaskUnit = {
      id = nextId;
      subjectId;
      title;
      difficulty;
      estimatedMinutes;
      deadline;
      status = #Scheduled;
    };
    // Java equivalent: tasks.add(t);
    tasks.add(t);
    t
  };

  // Java equivalent: tasks.stream().filter(t -> t.status == status).collect(Collectors.toList())
  public func filterByStatus(
    tasks : List.List<Types.TaskUnit>,
    status : Types.TaskStatus,
  ) : List.List<Types.TaskUnit> {
    tasks.filter(func(t : Types.TaskUnit) : Bool = t.status == status)
  };

  // Java equivalent: Collections.sort(tasks, Comparator.comparingInt(this::getPriorityScore).reversed())
  public func sortByPriority(
    tasks : List.List<Types.TaskUnit>,
    subjects : List.List<Types.Subject>,
  ) : List.List<Types.TaskUnit> {
    tasks.sort(func(a : Types.TaskUnit, b : Types.TaskUnit) : { #less; #equal; #greater } {
      let pa = getPriorityScore(a, subjects);
      let pb = getPriorityScore(b, subjects);
      // Descending: higher score = higher priority = comes first
      if (pa > pb) #less
      else if (pa < pb) #greater
      else #equal
    })
  };

  // Iterator pattern — find and update a task by id
  // Java equivalent: Iterator<TaskUnit> it = tasks.iterator(); while (it.hasNext()) { ... }
  public func updateTaskStatus(
    tasks : List.List<Types.TaskUnit>,
    taskId : Nat,
    newStatus : Types.TaskStatus,
  ) : ?Types.TaskUnit {
    var updated : ?Types.TaskUnit = null;
    // Java equivalent: for (TaskUnit t : tasks) { if (t.id == taskId) { t.status = newStatus; } }
    tasks.mapInPlace(func(t : Types.TaskUnit) : Types.TaskUnit {
      if (t.id == taskId) {
        let newT : Types.TaskUnit = { t with status = newStatus };
        updated := ?newT;
        newT
      } else t
    });
    updated
  };

  // Delete a task by id — removes it permanently from the in-memory List
  // Java equivalent: tasks.removeIf(t -> t.id == taskId)
  public func deleteTask(tasks : List.List<Types.TaskUnit>, taskId : Nat) : Bool {
    let before = tasks.size();
    let filtered = tasks.filter(func(t : Types.TaskUnit) : Bool = t.id != taskId);
    if (filtered.size() < before) {
      tasks.clear();
      tasks.append(filtered);
      true
    } else false
  };

  // Return all tasks sorted by priority (highest first)
  // Java equivalent: return tasks.stream().sorted(comparator).collect(Collectors.toList())
  public func listTasksSorted(
    tasks : List.List<Types.TaskUnit>,
    subjects : List.List<Types.Subject>,
  ) : [Types.TaskUnit] {
    sortByPriority(tasks, subjects).toArray()
  };

  // ─────────────────────────────────────────────────────────────────────────
  // User CRUD
  // ─────────────────────────────────────────────────────────────────────────

  public func getUser(users : List.List<Types.User>) : ?Types.User {
    users.find(func(_u : Types.User) : Bool = true)
  };

  public func upsertUser(
    users : List.List<Types.User>,
    name : Text,
    maxDailyHours : Nat,
    fatigueLevel : Nat,
  ) : Types.User {
    let existing = users.find(func(_u : Types.User) : Bool = true);
    switch (existing) {
      case (?u) {
        let updated : Types.User = { u with name; maxDailyHours; fatigueLevel };
        users.mapInPlace(func(_old : Types.User) : Types.User = updated);
        updated
      };
      case null {
        let newUser : Types.User = { id = 1; name; maxDailyHours; fatigueLevel };
        users.add(newUser);
        newUser
      };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Subject CRUD
  // ─────────────────────────────────────────────────────────────────────────

  public func getSubjects(subjects : List.List<Types.Subject>) : [Types.Subject] {
    subjects.toArray()
  };

  public func addSubject(
    subjects : List.List<Types.Subject>,
    nextId : Nat,
    name : Text,
    weight : Nat,
  ) : Types.Subject {
    let s : Types.Subject = { id = nextId; name; weight };
    subjects.add(s);
    s
  };

  public func deleteSubject(subjects : List.List<Types.Subject>, id : Nat) : Bool {
    let before = subjects.size();
    let filtered = subjects.filter(func(s : Types.Subject) : Bool = s.id != id);
    if (filtered.size() < before) {
      subjects.clear();
      subjects.append(filtered);
      true
    } else false
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SessionManager
  // Java equivalent: class SessionManager — manages HashMap<UserId, FocusSession>
  // Demonstrates: HashMap put/get/remove, Stack-like session tracking
  // ─────────────────────────────────────────────────────────────────────────

  // Start a Pomodoro focus session for a task
  // Java equivalent: activeSessions.put(userId, new FocusSession(taskId, ...))
  public func startFocusSession(
    tasks : List.List<Types.TaskUnit>,
    logs : List.List<Types.ProgressLog>,
    activeSessions : Map.Map<Nat, Types.ActiveFocusSession>,
    userId : Nat,
    taskId : Nat,
    startTimeNs : Int,
  ) : Types.FocusSession {
    // Mark task InProgress — Java: task.status = TaskStatus.IN_PROGRESS
    ignore updateTaskStatus(tasks, taskId, #InProgress);

    // Count past sessions for adaptive Pomodoro duration
    // Java equivalent: for (ProgressLog log : logs) { if (log.taskId == taskId) totalInterruptions += ... }
    let taskLogs = logs.filter(func(l : Types.ProgressLog) : Bool = l.taskId == taskId);
    let totalInterruptions = taskLogs.foldLeft(0 : Nat, func(acc : Nat, l : Types.ProgressLog) : Nat { acc + l.interruptions });
    let logCount = taskLogs.size();
    let avgInterruptions : Nat = if (logCount == 0) 0 else totalInterruptions / logCount;

    let sessionNumber = logCount + 1;

    // Adaptive Pomodoro duration based on past interruption rate
    let baseDuration : Nat = if (avgInterruptions >= 4) 20
      else if (avgInterruptions < 2 and logCount > 0) 30
      else 25;

    let isBreak = sessionNumber % 2 == 0;
    let durationMinutes : Nat = if (isBreak) {
      if ((sessionNumber / 2) % 4 == 0) 15 else 5
    } else baseDuration;

    // Java equivalent: activeSessions.put(userId, session)  — HashMap.put()
    activeSessions.add(userId, {
      taskId;
      var sessionNumber;
      var interruptions = 0;
      var startTimeNs;
    });

    { taskId; sessionNumber; durationMinutes; isBreak }
  };

  // End the active session and log progress
  // Java equivalent: FocusSession s = activeSessions.remove(userId)  — HashMap.remove()
  public func endFocusSession(
    activeSessions : Map.Map<Nat, Types.ActiveFocusSession>,
    logs : List.List<Types.ProgressLog>,
    tasks : List.List<Types.TaskUnit>,
    userId : Nat,
    endTimeNs : Int,
  ) : ?Types.ProgressLog {
    // Java equivalent: FocusSession session = activeSessions.get(userId)  — HashMap.get()
    switch (activeSessions.get(userId)) {
      case null null;
      case (?session) {
        let elapsedNs = endTimeNs - session.startTimeNs;
        let actualTime : Nat = if (elapsedNs <= 0) 0
          else toNat(elapsedNs) / (60 * 1_000_000_000);

        let isBreak = session.sessionNumber % 2 == 0;
        let log : Types.ProgressLog = {
          taskId = session.taskId;
          completed = not isBreak;
          actualTime;
          interruptions = session.interruptions;
        };
        logs.add(log);

        if (not isBreak) {
          ignore updateTaskStatus(tasks, session.taskId, #Completed);
        };

        // Java equivalent: activeSessions.remove(userId)
        activeSessions.remove(userId);
        ?log
      };
    }
  };

  // Record an interruption in the active session
  // Java equivalent: activeSessions.get(userId).interruptions++
  public func recordInterruption(
    activeSessions : Map.Map<Nat, Types.ActiveFocusSession>,
    userId : Nat,
  ) : () {
    switch (activeSessions.get(userId)) {
      case null ();
      case (?session) { session.interruptions += 1 };
    }
  };

  // Get the current active session (read-only view)
  // Java equivalent: activeSessions.containsKey(userId) ? activeSessions.get(userId) : null
  public func getActiveSession(
    activeSessions : Map.Map<Nat, Types.ActiveFocusSession>,
    userId : Nat,
  ) : ?Types.FocusSession {
    switch (activeSessions.get(userId)) {
      case null null;
      case (?s) {
        let isBreak = s.sessionNumber % 2 == 0;
        let durationMinutes : Nat = if (isBreak) {
          if ((s.sessionNumber / 2) % 4 == 0) 15 else 5
        } else 25;
        ?{ taskId = s.taskId; sessionNumber = s.sessionNumber; durationMinutes; isBreak }
      };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ScoreCalculator
  // Java equivalent: class ScoreCalculator — static utility with Math operations
  // Demonstrates: enhanced for-each loops, variance, weighted average
  // ─────────────────────────────────────────────────────────────────────────

  // Calculate focus score from progress logs
  // Java equivalent: static int calculateFocusScore(List<ProgressLog> logs)
  //   int completed = 0; int interruptions = 0;
  //   for (ProgressLog log : logs) { if (log.completed) completed++; interruptions += log.interruptions; }
  //   return Math.min(100, Math.max(0, completed * 15 - interruptions * 3 + streakBonus));
  public func calculateFocusScore(logs : List.List<Types.ProgressLog>, _tasks : List.List<Types.TaskUnit>) : Nat {
    // Java equivalent: for (ProgressLog log : logs) { if (log.completed) completedCount++; }
    let completedCount = logs.filter(func(l : Types.ProgressLog) : Bool = l.completed).size();
    // Java equivalent: for (ProgressLog log : logs) { totalInterruptions += log.interruptions; }
    let totalInterruptions = logs.foldLeft(0 : Nat, func(acc : Nat, l : Types.ProgressLog) : Nat { acc + l.interruptions });
    let streak = calculateStudyStreak(logs);
    let consistencyBonus : Int = if (streak >= 3) 10 else if (streak >= 1) 5 else 0;
    let base : Int = completedCount * 15;
    let penalty : Int = totalInterruptions * 3;
    let raw : Int = base - penalty + consistencyBonus;
    // Java equivalent: Math.min(100, Math.max(0, raw))
    if (raw <= 0) 0 else if (raw >= 100) 100 else toNat(raw)
  };

  // Calculate stability score — ratio of on-time task completions
  // Java equivalent: static int calculateStabilityScore(List<ProgressLog> logs, List<TaskUnit> tasks)
  //   int onTime = 0; for (ProgressLog log : logs) { if (log.actualTime <= threshold) onTime++; }
  //   return (onTime * 100) / total;
  public func calculateStabilityScore(logs : List.List<Types.ProgressLog>, tasks : List.List<Types.TaskUnit>) : Nat {
    let total = logs.size();
    if (total == 0) return 0;
    var onTime : Nat = 0;
    // Java equivalent: for (ProgressLog log : logs) { TaskUnit t = findById(tasks, log.taskId); ... }
    logs.forEach(func(l : Types.ProgressLog) {
      let estimated = switch (tasks.find(func(t : Types.TaskUnit) : Bool = t.id == l.taskId)) {
        case (?t) t.estimatedMinutes;
        case null 25;
      };
      let threshold = estimated + (estimated / 5); // 120% of estimate
      if (l.actualTime <= threshold or l.actualTime == 0) {
        onTime += 1;
      };
    });
    let ratio = (onTime * 100) / total;
    if (ratio > 100) 100 else ratio
  };

  // Calculate study streak from completed log entries
  // Java equivalent: static int calculateStudyStreak(List<ProgressLog> logs)
  //   long completed = logs.stream().filter(l -> l.completed).count();
  //   if (completed >= 5) return 5; ...
  public func calculateStudyStreak(logs : List.List<Types.ProgressLog>) : Nat {
    // Java equivalent: for (ProgressLog log : logs) { if (log.completed) count++; }
    let completedLogs = logs.filter(func(l : Types.ProgressLog) : Bool = l.completed);
    let count = completedLogs.size();
    if (count >= 5) 5
    else if (count >= 3) 3
    else if (count >= 1) 1
    else 0
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard aggregation — uses ScoreCalculator results
  // ─────────────────────────────────────────────────────────────────────────

  public func getDashboardData(
    tasks : List.List<Types.TaskUnit>,
    logs : List.List<Types.ProgressLog>,
  ) : Types.DashboardData {
    // Java equivalent: tasks.stream().filter(t -> t.status == COMPLETED).count()
    let completedCount = filterByStatus(tasks, #Completed).size();
    let inProgressCount = filterByStatus(tasks, #InProgress).size();
    let scheduledCount = filterByStatus(tasks, #Scheduled).size();
    let totalTasks = tasks.size();
    let focusScore = calculateFocusScore(logs, tasks);
    let stabilityScore = calculateStabilityScore(logs, tasks);
    let studyStreak = calculateStudyStreak(logs);
    {
      focusScore;
      dailyProgress = completedCount;
      totalTasks;
      completedTasks = completedCount;
      inProgressTasks = inProgressCount;
      scheduledTasks = scheduledCount;
      stabilityScore;
      studyStreak;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Analytics — produces data for charts / history views
  // ─────────────────────────────────────────────────────────────────────────

  public func getAnalytics(
    tasks : List.List<Types.TaskUnit>,
    subjects : List.List<Types.Subject>,
    logs : List.List<Types.ProgressLog>,
  ) : Types.AnalyticsData {
    let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let baseScore = calculateFocusScore(logs, tasks);

    // Build 7-day focus score history (simulated progression towards current score)
    let focusHistory : [Types.FocusScorePoint] = Array.tabulate<Types.FocusScorePoint>(7, func(i) {
      let dayScore : Nat = if (i == 6) baseScore
        else {
          let s = (baseScore * (i + 1)) / 7;
          if (s > 100) 100 else s
        };
      { date = days[i]; score = dayScore }
    });

    // Per-subject performance — Java equivalent: Map<String, SubjectStats> map = new HashMap<>()
    // Java equivalent: for (Subject s : subjects) { ... map.put(s.name, stats); }
    let subjectPerf = List.empty<Types.SubjectPerformance>();
    subjects.forEach(func(s : Types.Subject) {
      let subjectTasks = tasks.filter(func(t : Types.TaskUnit) : Bool = t.subjectId == s.id);
      let subjectCompleted = subjectTasks.filter(func(t : Types.TaskUnit) : Bool = t.status == #Completed);
      let subjectLogs = logs.filter(func(l : Types.ProgressLog) : Bool {
        subjectTasks.find(func(t : Types.TaskUnit) : Bool = t.id == l.taskId) != null
      });
      // Java equivalent: double total = 0; for (ProgressLog log : subjectLogs) { total += computeScore(log); }
      let avgScore : Nat = if (subjectLogs.size() == 0) 0 else {
        let total = subjectLogs.foldLeft(0 : Nat, func(acc : Nat, l : Types.ProgressLog) : Nat {
          let base : Int = if (l.completed) 80 else 40;
          let penalty : Int = l.interruptions * 5;
          let score : Int = base - penalty;
          acc + (if (score < 0) 0 else toNat(score))
        });
        let avg = total / subjectLogs.size();
        if (avg > 100) 100 else avg
      };
      subjectPerf.add({
        subjectName = s.name;
        completedTasks = subjectCompleted.size();
        avgScore;
      });
    });

    // Weekly hours — Java equivalent: int[] weeklyHours = new int[7]
    let weeklyHrs : [Types.WeeklyHours] = Array.tabulate<Types.WeeklyHours>(7, func(i) {
      let hrs : Nat = if (i < logs.size()) {
        let log = logs.at(i);
        (log.actualTime + 29) / 60
      } else 0;
      { day = days[i]; hours = hrs }
    });

    {
      focusScoreHistory = focusHistory;
      subjectPerformance = subjectPerf.toArray();
      weeklyHours = weeklyHrs;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Seed Demo Data
  // ─────────────────────────────────────────────────────────────────────────

  public func seedDemoData(
    users : List.List<Types.User>,
    subjects : List.List<Types.Subject>,
    tasks : List.List<Types.TaskUnit>,
    logs : List.List<Types.ProgressLog>,
    startSubjectId : Nat,
    startTaskId : Nat,
  ) : (Nat, Nat) {
    if (users.size() > 0) return (startSubjectId, startTaskId);

    // Java equivalent: users.add(new User("Alex Chen", 8, 3))
    users.add({ id = 1; name = "Alex Chen"; maxDailyHours = 8; fatigueLevel = 3 });

    var sid = startSubjectId;
    let mathId = sid; sid += 1;
    let physicsId = sid; sid += 1;
    let csId = sid; sid += 1;
    let litId = sid; sid += 1;

    subjects.add({ id = mathId; name = "Mathematics"; weight = 8 });
    subjects.add({ id = physicsId; name = "Physics"; weight = 7 });
    subjects.add({ id = csId; name = "Computer Science"; weight = 9 });
    subjects.add({ id = litId; name = "Literature"; weight = 5 });

    var tid = startTaskId;

    // Java equivalent: tasks.add(new TaskUnit(tid++, mathId, "Calculus Chapter 5 Review", HIGH, 90, "2026-04-15", SCHEDULED))
    tasks.add({ id = tid; subjectId = mathId; title = "Calculus Chapter 5 Review"; difficulty = #High; estimatedMinutes = 90; deadline = "2026-04-15"; status = #Scheduled });
    let calcId = tid; tid += 1;

    tasks.add({ id = tid; subjectId = physicsId; title = "Newton's Laws Problem Set"; difficulty = #Medium; estimatedMinutes = 60; deadline = "2026-04-14"; status = #InProgress });
    let newtonId = tid; tid += 1;

    tasks.add({ id = tid; subjectId = csId; title = "Data Structures Assignment"; difficulty = #High; estimatedMinutes = 120; deadline = "2026-04-13"; status = #Scheduled });
    tid += 1;

    tasks.add({ id = tid; subjectId = litId; title = "Essay Outline"; difficulty = #Low; estimatedMinutes = 45; deadline = "2026-04-16"; status = #Scheduled });
    tid += 1;

    tasks.add({ id = tid; subjectId = mathId; title = "Linear Algebra Quiz Prep"; difficulty = #Medium; estimatedMinutes = 60; deadline = "2026-04-17"; status = #Scheduled });
    tid += 1;

    tasks.add({ id = tid; subjectId = physicsId; title = "Thermodynamics Notes"; difficulty = #High; estimatedMinutes = 90; deadline = "2026-04-18"; status = #Scheduled });
    tid += 1;

    tasks.add({ id = tid; subjectId = csId; title = "Binary Trees Practice"; difficulty = #Medium; estimatedMinutes = 75; deadline = "2026-04-15"; status = #Scheduled });
    tid += 1;

    tasks.add({ id = tid; subjectId = litId; title = "Poetry Analysis"; difficulty = #Low; estimatedMinutes = 30; deadline = "2026-04-19"; status = #Completed });
    let poetryId = tid; tid += 1;

    // Progress logs — Java equivalent: logs.add(new ProgressLog(taskId, completed, actualTime, interruptions))
    logs.add({ taskId = poetryId; completed = true; actualTime = 28; interruptions = 1 });
    logs.add({ taskId = newtonId; completed = false; actualTime = 45; interruptions = 2 });
    logs.add({ taskId = calcId; completed = false; actualTime = 30; interruptions = 3 });

    (sid, tid)
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SchedulingService — getDailySchedule
  // Java equivalent: class SchedulingService { public List<ScheduledBlock> generateDailySchedule() }
  //   tasks.stream()
  //     .filter(t -> t.status != COMPLETED)
  //     .sorted(Comparator.comparingInt(Task::getPriorityScore).reversed())
  //     .limit(5)
  //     .collect(Collectors.toList())
  // ─────────────────────────────────────────────────────────────────────────

  // Priority score for scheduling: urgencyScore × difficultyMultiplier
  // Java equivalent: int score = getUrgencyScore(task) * getDifficultyMultiplier(task)
  public func getSchedulePriorityScore(task : Types.TaskUnit) : Nat {
    urgencyScore(task.deadline) * difficultyMultiplier(task.difficulty)
  };

  // Time slots for a study day — fixed schedule buckets
  // Java equivalent: static final String[] TIME_SLOTS = {"9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"}
  let timeSlots : [Text] = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

  public func getDailySchedule(
    tasks : List.List<Types.TaskUnit>,
    subjects : List.List<Types.Subject>,
  ) : [Types.ScheduledBlock] {
    // Java equivalent: tasks.stream().filter(t -> t.status != TaskStatus.COMPLETED)
    let activeTasks = tasks.filter(func(t : Types.TaskUnit) : Bool {
      t.status == #Scheduled or t.status == #InProgress
    });

    // Java equivalent: Comparator.comparingInt(Task::getPriorityScore).reversed()
    let sorted = activeTasks.sort(func(a : Types.TaskUnit, b : Types.TaskUnit) : { #less; #equal; #greater } {
      let pa = getSchedulePriorityScore(a);
      let pb = getSchedulePriorityScore(b);
      if (pa > pb) #less else if (pa < pb) #greater else #equal
    });

    // Assign top 5 to time slots
    // Java equivalent: IntStream.range(0, Math.min(sorted.size(), 5))
    //   .mapToObj(i -> new ScheduledBlock(sorted.get(i), TIME_SLOTS[i]))
    let cap = Nat.min(sorted.size(), 5);
    let result = List.empty<Types.ScheduledBlock>();
    var i : Nat = 0;
    while (i < cap) {
      let task = sorted.at(i);
      let subjectName = switch (subjects.find(func(s : Types.Subject) : Bool = s.id == task.subjectId)) {
        case (?s) s.name;
        case null "Unknown";
      };
      result.add({
        taskId = task.id;
        taskTitle = task.title;
        subjectName;
        timeSlot = timeSlots[i];
        priorityScore = getSchedulePriorityScore(task);
        estimatedMinutes = task.estimatedMinutes;
        difficulty = task.difficulty;
      });
      i += 1;
    };
    result.toArray()
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Priority Queue — getPriorityQueue
  // Java equivalent: PriorityQueue<PriorityQueueItem> pq = new PriorityQueue<>(
  //   Comparator.comparingInt(PriorityQueueItem::getPriorityScore).reversed()
  // );
  // ─────────────────────────────────────────────────────────────────────────

  public func getPriorityQueue(
    tasks : List.List<Types.TaskUnit>,
    subjects : List.List<Types.Subject>,
  ) : [Types.PriorityQueueItem] {
    // Filter out completed tasks
    // Java equivalent: tasks.stream().filter(t -> t.status != COMPLETED)
    let activeTasks = tasks.filter(func(t : Types.TaskUnit) : Bool {
      t.status != #Completed
    });

    // Sort descending by priority score — Comparator.comparingInt(Task::getPriorityScore).reversed()
    let sorted = activeTasks.sort(func(a : Types.TaskUnit, b : Types.TaskUnit) : { #less; #equal; #greater } {
      let pa = getSchedulePriorityScore(a);
      let pb = getSchedulePriorityScore(b);
      if (pa > pb) #less else if (pa < pb) #greater else #equal
    });

    // Take top 5 — Java equivalent: .limit(5)
    let cap = Nat.min(sorted.size(), 5);
    let result = List.empty<Types.PriorityQueueItem>();
    var i : Nat = 0;
    while (i < cap) {
      let task = sorted.at(i);
      let subjectName = switch (subjects.find(func(s : Types.Subject) : Bool = s.id == task.subjectId)) {
        case (?s) s.name;
        case null "Unknown";
      };
      result.add({
        taskId = task.id;
        taskTitle = task.title;
        subjectName;
        priorityScore = getSchedulePriorityScore(task);
        deadline = task.deadline;
        difficulty = task.difficulty;
      });
      i += 1;
    };
    result.toArray()
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Task Stats — getTaskStats
  // Java equivalent: Map<TaskStatus, Long> grouped =
  //   tasks.stream().collect(Collectors.groupingBy(TaskUnit::getStatus, Collectors.counting()))
  // ─────────────────────────────────────────────────────────────────────────

  public func getTaskStats(tasks : List.List<Types.TaskUnit>) : Types.TaskStats {
    // Java equivalent: grouped.getOrDefault(SCHEDULED, 0L)
    let scheduledCount = tasks.filter(func(t : Types.TaskUnit) : Bool = t.status == #Scheduled).size();
    let inProgressCount = tasks.filter(func(t : Types.TaskUnit) : Bool = t.status == #InProgress).size();
    let completedCount = tasks.filter(func(t : Types.TaskUnit) : Bool = t.status == #Completed).size();
    { scheduledCount; inProgressCount; completedCount }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Subject Leaderboard — getSubjectLeaderboard
  // Java equivalent: subjects.stream()
  //   .map(s -> new SubjectLeaderboardEntry(s, getCompletionRate(s, tasks)))
  //   .sorted(Comparator.comparingDouble(SubjectLeaderboardEntry::getCompletionRate).reversed())
  //   .collect(Collectors.toList())
  // ─────────────────────────────────────────────────────────────────────────

  public func getSubjectLeaderboard(
    subjects : List.List<Types.Subject>,
    tasks : List.List<Types.TaskUnit>,
  ) : [Types.SubjectLeaderboardEntry] {
    let entries = List.empty<Types.SubjectLeaderboardEntry>();

    // Java equivalent: for (Subject s : subjects) { ... map.put(s.id, entry); }
    subjects.forEach(func(s : Types.Subject) {
      let subjectTasks = tasks.filter(func(t : Types.TaskUnit) : Bool = t.subjectId == s.id);
      let total = subjectTasks.size();
      let completed = subjectTasks.filter(func(t : Types.TaskUnit) : Bool = t.status == #Completed).size();
      // Java equivalent: (int) Math.round((double) completed / total * 100)
      let rate : Nat = if (total == 0) 0 else (completed * 100) / total;
      entries.add({
        subjectId = s.id;
        subjectName = s.name;
        totalTasks = total;
        completedTasks = completed;
        completionRate = rate;
      });
    });

    // Sort descending by completionRate — Comparator.comparingDouble(SubjectLeaderboardEntry::getCompletionRate).reversed()
    entries.sort(func(a : Types.SubjectLeaderboardEntry, b : Types.SubjectLeaderboardEntry) : { #less; #equal; #greater } {
      if (a.completionRate > b.completionRate) #less
      else if (a.completionRate < b.completionRate) #greater
      else #equal
    }).toArray()
  };

};
