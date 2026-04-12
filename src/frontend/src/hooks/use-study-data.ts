import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockBackend } from "../../../../vendor/core-infrastructure/dist/mocks/backend.js";
import {
  addSubject,
  deleteTask,
  endFocusSession,
  getActiveSession,
  getAnalytics,
  getDailySchedule,
  getDashboard,
  getPriorityQueue,
  getSubjectLeaderboard,
  getTaskStats,
  listSubjects,
  listTasks,
  removeSubject,
  startFocusSession,
  updateTaskStatus,
} from "../lib/backend-client";
import type { TaskStatus } from "../types/study";

function useBackendActor() {
  return { actor: mockBackend, isFetching: false };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useUser() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useDashboard() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useTasks() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useSubjects() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjects(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useAnalytics() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useActiveSession() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["activeSession"],
    queryFn: () => getActiveSession(actor),
    enabled: !!actor && !isFetching,
    refetchInterval: (query) => (query.state.data ? 5000 : false),
  });
}

export function useDailySchedule() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["dailySchedule"],
    queryFn: () => getDailySchedule(actor),
    enabled: !!actor && !isFetching,
  });
}

export function usePriorityQueue() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["priorityQueue"],
    queryFn: () => getPriorityQueue(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useTaskStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["taskStats"],
    queryFn: () => getTaskStats(actor),
    enabled: !!actor && !isFetching,
  });
}

export function useSubjectLeaderboard() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["subjectLeaderboard"],
    queryFn: () => getSubjectLeaderboard(actor),
    enabled: !!actor && !isFetching,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useStartFocus() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => startFocusSession(actor, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeSession"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

export function useEndFocus() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => endFocusSession(actor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeSession"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["taskStats"] });
      qc.invalidateQueries({ queryKey: ["dailySchedule"] });
    },
  });
}



export function useUpdateTaskStatus() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      updateTaskStatus(actor, taskId, status),
    onSuccess: (updatedTask) => {
      // Optimistically overwrite the matched task inline
      qc.setQueryData<{ id: number; status: string }[]>(["tasks"], (old) =>
        old ? old.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)) : [],
      );
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["taskStats"] });
      qc.invalidateQueries({ queryKey: ["dailySchedule"] });
      qc.invalidateQueries({ queryKey: ["priorityQueue"] });
    },
  });
}

export function useAddSubject() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, weight }: { name: string; weight: number }) =>
      addSubject(actor, name, weight),
    onSuccess: (newSubject) => {
      qc.setQueryData<{ id: number }[]>(["subjects"], (old) =>
        old ? [...old, newSubject] : [newSubject],
      );
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRemoveSubject() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removeSubject(actor, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateUser() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, maxDailyHours, fatigueLevel, startTime }: { name: string; maxDailyHours: number; fatigueLevel: number; startTime: string }) =>
      updateUser(actor, name, maxDailyHours, fatigueLevel, startTime),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["dailySchedule"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(actor, taskId),
    onSuccess: (_result, taskId) => {
      // Remove from tasks cache only after backend confirms deletion
      qc.setQueryData<{ id: number }[]>(["tasks"], (old) =>
        old ? old.filter((t) => t.id !== taskId) : [],
      );
      qc.invalidateQueries({ queryKey: ["taskStats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["priorityQueue"] });
    },
  });
}
