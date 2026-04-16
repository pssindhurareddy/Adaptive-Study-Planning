// Enums matching backend variant types
export enum TaskDifficulty {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

export enum TaskStatus {
  Scheduled = "Scheduled",
  InProgress = "InProgress",
  Completed = "Completed",
}

// Core data models
export interface User {
  id: number;
  name: string;
  maxDailyHours: number;
  fatigueLevel: number;
  startTime: string;
}

export interface Subject {
  id: number;
  name: string;
  weight: number;
}

export interface TaskUnit {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  deadline: string;
  status: TaskStatus;
}

export interface SessionBlock {
  taskId: number;
  taskTitle: string;
  startTime: string;
  duration: number;
  intensity: number;
}

// New: ScheduledBlock from getDailySchedule()
export interface ScheduledBlock {
  taskId: number;
  taskTitle: string;
  subjectName: string;
  timeSlot: string;
  priorityScore: number;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
}

// New: PriorityQueueItem from getPriorityQueue()
export interface PriorityQueueItem {
  taskId: number;
  taskTitle: string;
  subjectName: string;
  priorityScore: number;
  deadline: string;
  difficulty: TaskDifficulty;
}

// New: TaskStats from getTaskStats()
export interface TaskStats {
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
}

// New: SubjectLeaderboardEntry from getSubjectLeaderboard()
export interface SubjectLeaderboardEntry {
  subjectId: number;
  subjectName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ProgressLog {
  taskId: number;
  completed: boolean;
  actualTime: number;
  interruptions: number;
}

// Dashboard aggregate
export interface DashboardData {
  focusScore: number;
  stabilityScore: number;
  studyStreak: number;
  dailyProgress: number;
  totalTasks: number;
  completedTasks: number;
  scheduledTasks: number;
  inProgressTasks: number;
}

// Focus session tracking
export interface FocusSession {
  taskId: number;
  sessionNumber: number;
  durationMinutes: number;
  isBreak: boolean;
}

// Analytics data structures
export interface FocusScorePoint {
  date: string;
  score: number;
}

export interface SubjectPerformance {
  subjectName: string;
  completedTasks: number;
  avgScore: number;
}

export interface WeeklyHours {
  day: string;
  hours: number;
}

export interface AnalyticsData {
  focusScoreHistory: FocusScorePoint[];
  subjectPerformance: SubjectPerformance[];
  weeklyHours: WeeklyHours[];
}

// ── New feature types ─────────────────────────────────────────────────────────

export interface BurnoutStatus {
  level: "Low" | "Medium" | "High";
  score: number;
  advice: string;
}

export interface ExamCollision {
  taskId: number;
  taskTitle: string;
  conflictsWith: number;
  conflictsWithTitle: string;
  sharedDate: string;
  severity: "Low" | "Medium" | "High";
  penaltyLabel: string;
}

export interface ProcrastinationDebt {
  overdueCount: number;
  debtScore: number;
  overdueTaskTitles: string[];
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface BreakBlock {
  afterTaskId: number;
  breakType: "Short" | "Long";
  durationMinutes: number;
}

export interface TaskDependency {
  taskId: number;
  dependsOnId: number;
}

// Recovery plan (kept for backend-client compatibility)
export interface RecoveryTask {
  originalTaskId: string;
  taskTitle: string;
  subjectName: string;
  rescheduledDate: string;
  reducedDuration: number;
  reason: string;
}

export interface RecoveryPlan {
  missedTasks: number;
  redistributedTasks: RecoveryTask[];
  message: string;
}

// Recommendation (kept for backend-client compatibility)
export interface Recommendation {
  type: "lighter_schedule" | "revision" | "weak_subject" | "challenge";
  title: string;
  description: string;
  subjectId?: string;
  subjectName?: string;
}
