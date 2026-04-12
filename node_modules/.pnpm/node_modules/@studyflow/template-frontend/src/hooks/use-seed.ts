import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { mockBackend } from "../../../../vendor/core-infrastructure/dist/mocks/backend.js";
import { seedDemoData } from "../lib/backend-client";

const SEED_KEY = "studyflow-seeded";

export function useSeed() {
  const actor = mockBackend;
  const qc = useQueryClient();

  useEffect(() => {
    if (!actor) return;

    const alreadySeeded = localStorage.getItem(SEED_KEY);
    if (alreadySeeded) return;

    seedDemoData(actor)
      .then(() => {
        localStorage.setItem(SEED_KEY, "true");
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["analytics"] });
        qc.invalidateQueries({ queryKey: ["dailySchedule"] });
        qc.invalidateQueries({ queryKey: ["priorityQueue"] });
        qc.invalidateQueries({ queryKey: ["taskStats"] });
        qc.invalidateQueries({ queryKey: ["activeSession"] });
        qc.invalidateQueries({ queryKey: ["subjectLeaderboard"] });
        qc.invalidateQueries({ queryKey: ["subjects"] });
      })
      .catch((err: unknown) => {
        console.warn("Seed failed:", err);
      });
  }, [actor, qc]);
}
