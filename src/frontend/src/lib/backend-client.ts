/**
 * Typed backend client — wraps actor calls and converts Motoko BigInt values
 * to regular JS numbers at the API boundary. All backend Nat/Int fields arrive
 * as bigint at runtime; this normalises them so downstream code uses number.
 */
import { createActor } from "../backend";
import type {
  Achievement,
  AnalyticsData,
  BreakBlock,
  BurnoutStatus,
  DashboardData,
  ExamCollision,
  FocusSession,
  PriorityQueueItem,
  ProcrastinationDebt,
  ProgressLog,
  Recommendation,
  RecoveryPlan,
  ScheduledBlock,
  Subject,
  SubjectLeaderboardEntry,
  TaskDependency,
  TaskDifficulty,
  TaskStats,
  TaskStatus,
  TaskUnit,
  User,
} from "../types/study";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = Record<string, (...args: any[]) => Promise<any>>;

/**
 * Recursively converts all BigInt values in an object/array to regular JS numbers.
 * Motoko Nat/Int fields come back as bigint — this converts them at the
 * API boundary so all downstream code can treat numeric fields as number.
 */
function convertBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        convertBigInts(v),
      ]),
    );
  }
  return obj;
}

// Helper to call actor methods with a graceful no-op when actor is null
function callActor<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actor: any,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): Promise<T> {
  if (!actor || typeof actor[method] !== "function") {
    return Promise.reject(new Error(`Actor method ${method} not available`));
  }
  return (actor as AnyActor)
    [method](...args)
    .then((result: unknown) => convertBigInts(result) as T);
}

// Seed demo data
export async function seedDemoData(actor: unknown): Promise<void> {
  return callActor(actor, "seedDemoData");
}

// User
export async function getUser(actor: unknown): Promise<User | null> {
  const result = await callActor<User | null>(actor, "getUser");
  return result ?? null;
}

export async function createUser(
  actor: unknown,
  name: string,
  maxDailyHours: number,
  fatigueLevel: number,
): Promise<User> {
  return callActor<User>(
    actor,
    "createUser",
    name,
    BigInt(maxDailyHours),
    BigInt(fatigueLevel),
  );
}

export async function updateUser(
  actor: unknown,
  name: string,
  maxDailyHours: number,
  fatigueLevel: number,
  startTime: string,
): Promise<User> {
  return callActor<User>(
    actor,
    "updateUser",
    name,
    BigInt(maxDailyHours),
    BigInt(fatigueLevel),
    startTime,
  );
}

// Subjects
export async function listSubjects(actor: unknown): Promise<Subject[]> {
  return callActor<Subject[]>(actor, "listSubjects");
}

export async function addSubject(
  actor: unknown,
  name: string,
  weight: number,
): Promise<Subject> {
  return callActor<Subject>(actor, "addSubject", name, BigInt(weight));
}

export async function removeSubject(actor: unknown, id: number): Promise<void> {
  return callActor(actor, "removeSubject", BigInt(id));
}

// Tasks
export async function listTasks(actor: unknown): Promise<TaskUnit[]> {
  return callActor<TaskUnit[]>(actor, "listTasks");
}

export async function addTask(
  actor: unknown,
  subjectId: number,
  title: string,
  difficulty: TaskDifficulty,
  estimatedMinutes: number,
  deadline: string,
): Promise<TaskUnit> {
  return callActor<TaskUnit>(
    actor,
    "addTask",
    BigInt(subjectId),
    title,
    difficulty,
    BigInt(estimatedMinutes),
    deadline,
  );
}

export async function updateTaskStatus(
  actor: unknown,
  taskId: number,
  status: TaskStatus,
): Promise<TaskUnit> {
  return callActor<TaskUnit>(actor, "updateTaskStatus", BigInt(taskId), status);
}

export async function deleteTask(
  actor: unknown,
  taskId: number,
): Promise<boolean> {
  return callActor<boolean>(actor, "deleteTask", BigInt(taskId));
}

// Schedule — calls getDailySchedule() backend function
// Returns ScheduledBlock[] sorted by priority (Comparator<Task> logic in backend)
export async function getDailySchedule(
  actor: unknown,
): Promise<ScheduledBlock[]> {
  return callActor<ScheduledBlock[]>(actor, "getDailySchedule");
}

// Priority Queue — Collections.sort via PriorityScore comparator
export async function getPriorityQueue(
  actor: unknown,
): Promise<PriorityQueueItem[]> {
  return callActor<PriorityQueueItem[]>(actor, "getPriorityQueue");
}

// Task Stats — HashMap<TaskStatus, List<Task>> groupBy logic
export async function getTaskStats(actor: unknown): Promise<TaskStats> {
  return callActor<TaskStats>(actor, "getTaskStats");
}

// Subject Leaderboard — sorted by completionRate descending
export async function getSubjectLeaderboard(
  actor: unknown,
): Promise<SubjectLeaderboardEntry[]> {
  return callActor<SubjectLeaderboardEntry[]>(actor, "getSubjectLeaderboard");
}

// Dashboard
export async function getDashboard(actor: unknown): Promise<DashboardData> {
  return callActor<DashboardData>(actor, "getDashboard");
}

// Focus session
export async function startFocusSession(
  actor: unknown,
  taskId: number,
): Promise<FocusSession> {
  return callActor<FocusSession>(actor, "startFocusSession", BigInt(taskId));
}

export async function endFocusSession(
  actor: unknown,
): Promise<ProgressLog | null> {
  return callActor<ProgressLog | null>(actor, "endFocusSession");
}

export async function recordInterruption(actor: unknown): Promise<void> {
  return callActor(actor, "recordInterruption");
}

export async function getActiveSession(
  actor: unknown,
): Promise<FocusSession | null> {
  const result = await callActor<FocusSession | null>(
    actor,
    "getActiveSession",
  );
  return result ?? null;
}

export async function logProgress(
  actor: unknown,
  taskId: number,
  completed: boolean,
  actualTime: number,
  interruptions: number,
): Promise<void> {
  return callActor(
    actor,
    "logProgress",
    BigInt(taskId),
    completed,
    BigInt(actualTime),
    BigInt(interruptions),
  );
}

// Analytics
export async function getAnalytics(actor: unknown): Promise<AnalyticsData> {
  return callActor<AnalyticsData>(actor, "getAnalytics");
}

// Burnout Detector
export async function getBurnout(actor: unknown): Promise<BurnoutStatus> {
  return callActor<BurnoutStatus>(actor, "getBurnout");
}

// Exam Collision Detector
export async function getCollisions(actor: unknown): Promise<ExamCollision[]> {
  return callActor<ExamCollision[]>(actor, "getCollisions");
}

export async function resolveCollision(
  actor: unknown,
  taskId: number,
  shiftDays: number,
): Promise<TaskUnit | null> {
  return callActor<TaskUnit | null>(
    actor,
    "resolveCollision",
    BigInt(taskId),
    BigInt(shiftDays),
  );
}

// Procrastination Debt Tracker
export async function getProcrastinationDebt(
  actor: unknown,
): Promise<ProcrastinationDebt> {
  return callActor<ProcrastinationDebt>(actor, "getProcrastinationDebt");
}

// Achievements
export async function getAchievements(actor: unknown): Promise<Achievement[]> {
  return callActor<Achievement[]>(actor, "getAchievements");
}

// Break Scheduler
export async function getBreaks(actor: unknown): Promise<BreakBlock[]> {
  return callActor<BreakBlock[]>(actor, "getBreaks");
}

// Undo / Redo
export async function undoLastTaskChange(actor: unknown): Promise<TaskUnit[]> {
  return callActor<TaskUnit[]>(actor, "undoLastTaskChange");
}

export async function redoLastTaskChange(actor: unknown): Promise<TaskUnit[]> {
  return callActor<TaskUnit[]>(actor, "redoLastTaskChange");
}

export async function canUndo(actor: unknown): Promise<boolean> {
  return callActor<boolean>(actor, "canUndo");
}

export async function canRedo(actor: unknown): Promise<boolean> {
  return callActor<boolean>(actor, "canRedo");
}

// Dependency Graph
export async function getDependencyGraph(
  actor: unknown,
): Promise<TaskDependency[]> {
  return callActor<TaskDependency[]>(actor, "getDependencyGraph");
}

export async function addDependency(
  actor: unknown,
  taskId: number,
  dependsOnId: number,
): Promise<TaskDependency[]> {
  return callActor<TaskDependency[]>(
    actor,
    "addDependency",
    BigInt(taskId),
    BigInt(dependsOnId),
  );
}

export async function removeDependency(
  actor: unknown,
  taskId: number,
  dependsOnId: number,
): Promise<TaskDependency[]> {
  return callActor<TaskDependency[]>(
    actor,
    "removeDependency",
    BigInt(taskId),
    BigInt(dependsOnId),
  );
}

// Recovery (kept for backward compatibility)
export async function getRecoveryPlan(actor: unknown): Promise<RecoveryPlan> {
  return callActor<RecoveryPlan>(actor, "getRecoveryPlan");
}

// Recommendations (kept for backward compatibility)
export async function getRecommendations(
  actor: unknown,
): Promise<Recommendation[]> {
  return callActor<Recommendation[]>(actor, "getRecommendations");
}

export { createActor };
