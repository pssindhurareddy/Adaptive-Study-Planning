import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FocusScorePoint {
    date: string;
    score: bigint;
}
export interface SubjectLeaderboardEntry {
    totalTasks: bigint;
    completionRate: bigint;
    completedTasks: bigint;
    subjectName: string;
    subjectId: bigint;
}
export interface DashboardData {
    totalTasks: bigint;
    completedTasks: bigint;
    dailyProgress: bigint;
    focusScore: bigint;
    scheduledTasks: bigint;
    studyStreak: bigint;
    inProgressTasks: bigint;
    stabilityScore: bigint;
}
export interface User {
    id: bigint;
    fatigueLevel: bigint;
    maxDailyHours: bigint;
    name: string;
}
export interface TaskUnit {
    id: bigint;
    status: TaskStatus;
    title: string;
    difficulty: TaskDifficulty;
    deadline: string;
    subjectId: bigint;
    estimatedMinutes: bigint;
}
export interface PriorityQueueItem {
    subjectName: string;
    difficulty: TaskDifficulty;
    taskTitle: string;
    deadline: string;
    taskId: bigint;
    priorityScore: bigint;
}
export interface FocusSession {
    isBreak: boolean;
    taskId: bigint;
    sessionNumber: bigint;
    durationMinutes: bigint;
}
export interface TaskStats {
    inProgressCount: bigint;
    completedCount: bigint;
    scheduledCount: bigint;
}
export interface SubjectPerformance {
    avgScore: bigint;
    completedTasks: bigint;
    subjectName: string;
}
export interface ProgressLog {
    completed: boolean;
    interruptions: bigint;
    taskId: bigint;
    actualTime: bigint;
}
export interface ScheduledBlock {
    subjectName: string;
    difficulty: TaskDifficulty;
    taskTitle: string;
    taskId: bigint;
    priorityScore: bigint;
    timeSlot: string;
    estimatedMinutes: bigint;
}
export interface WeeklyHours {
    day: string;
    hours: bigint;
}
export interface Subject {
    id: bigint;
    weight: bigint;
    name: string;
}
export interface AnalyticsData {
    subjectPerformance: Array<SubjectPerformance>;
    weeklyHours: Array<WeeklyHours>;
    focusScoreHistory: Array<FocusScorePoint>;
}
export enum TaskDifficulty {
    Low = "Low",
    High = "High",
    Medium = "Medium"
}
export enum TaskStatus {
    Scheduled = "Scheduled",
    InProgress = "InProgress",
    Completed = "Completed"
}
export interface backendInterface {
    addSubject(name: string, weight: bigint): Promise<Subject>;
    addTask(subjectId: bigint, title: string, difficulty: TaskDifficulty, estimatedMinutes: bigint, deadline: string): Promise<TaskUnit>;
    createUser(name: string, maxDailyHours: bigint, fatigueLevel: bigint): Promise<User>;
    deleteTask(taskId: bigint): Promise<boolean>;
    endFocusSession(): Promise<ProgressLog | null>;
    getActiveSession(): Promise<FocusSession | null>;
    getAnalytics(): Promise<AnalyticsData>;
    getDailySchedule(): Promise<Array<ScheduledBlock>>;
    getDashboard(): Promise<DashboardData>;
    getPriorityQueue(): Promise<Array<PriorityQueueItem>>;
    getSubjectLeaderboard(): Promise<Array<SubjectLeaderboardEntry>>;
    getTaskStats(): Promise<TaskStats>;
    getUser(): Promise<User | null>;
    listSubjects(): Promise<Array<Subject>>;
    listTasks(): Promise<Array<TaskUnit>>;
    logProgress(taskId: bigint, completed: boolean, actualTime: bigint, interruptions: bigint): Promise<ProgressLog>;
    recordInterruption(): Promise<void>;
    removeSubject(id: bigint): Promise<boolean>;
    seedDemoData(): Promise<void>;
    startFocusSession(taskId: bigint): Promise<FocusSession>;
    updateTaskStatus(taskId: bigint, status: TaskStatus): Promise<TaskUnit | null>;
    updateUser(name: string, maxDailyHours: bigint, fatigueLevel: bigint): Promise<User>;
}
