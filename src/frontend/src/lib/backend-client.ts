/**
 * Typed backend client — wraps actor calls and converts Motoko BigInt values
 * to regular JS numbers at the API boundary. All backend Nat/Int fields arrive
 * as bigint at runtime; this normalises them so downstream code uses number.
 */
import { createActor } from "../backend";
import type {
  AnalyticsData,
  DashboardData,
  FocusSession,
  PriorityQueueItem,
  ProgressLog,
  Recommendation,
  RecoveryPlan,
  ScheduledBlock,
  Subject,
  SubjectLeaderboardEntry,
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
