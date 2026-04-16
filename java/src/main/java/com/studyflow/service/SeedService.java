package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * SeedService — populates demo data on startup (once only).
 * Java equivalent of the seedDemoData() function in Motoko.
 */
@Service
public class SeedService {

    private final StudyDataStore store;

    public SeedService(StudyDataStore store) {
        this.store = store;
    }

    /** Called automatically after Spring context is ready. */
    @PostConstruct
    public void seedOnStartup() {
        seedDemoData();
    }

    /**
     * Seed demo data — idempotent (runs only once).
     * Adds richer progress logs so analytics charts (focus score history,
     * subject performance, weekly hours) have meaningful data to display.
     */
    public void seedDemoData() {
        if (store.isSeeded() || !store.getUsers().isEmpty()) return;

        // Java equivalent: users.add(new User("Alex Chen", 8, 3))
        store.getUsers().add(new User(1, "Alex Chen", 8, 3));

        int sid = store.getNextSubjectId();
        int mathId = sid++;
        int physicsId = sid++;
        int csId = sid++;
        int litId = sid++;

        store.getSubjects().add(new Subject(mathId, "Mathematics", 8));
        store.getSubjects().add(new Subject(physicsId, "Physics", 7));
        store.getSubjects().add(new Subject(csId, "Computer Science", 9));
        store.getSubjects().add(new Subject(litId, "Literature", 5));

        while (store.getNextSubjectId() < sid) store.incrementSubjectId();

        int tid = store.getNextTaskId();

        // ── Tasks ────────────────────────────────────────────────────────────

        int calcId = tid++;
        store.getTasks().add(new TaskUnit(calcId, mathId, "Calculus Chapter 5 Review",
                TaskDifficulty.High, 90, "2026-04-20", TaskStatus.Scheduled));

        int newtonId = tid++;
        store.getTasks().add(new TaskUnit(newtonId, physicsId, "Newton's Laws Problem Set",
                TaskDifficulty.Medium, 60, "2026-04-21", TaskStatus.InProgress));

        int dsId = tid++;
        store.getTasks().add(new TaskUnit(dsId, csId, "Data Structures Assignment",
                TaskDifficulty.High, 120, "2026-04-22", TaskStatus.Scheduled));

        int essayId = tid++;
        store.getTasks().add(new TaskUnit(essayId, litId, "Essay Outline",
                TaskDifficulty.Low, 45, "2026-04-23", TaskStatus.Completed));

        int linAlgId = tid++;
        store.getTasks().add(new TaskUnit(linAlgId, mathId, "Linear Algebra Quiz Prep",
                TaskDifficulty.Medium, 60, "2026-04-24", TaskStatus.Completed));

        int thermoId = tid++;
        store.getTasks().add(new TaskUnit(thermoId, physicsId, "Thermodynamics Notes",
                TaskDifficulty.High, 90, "2026-04-25", TaskStatus.Scheduled));

        int btId = tid++;
        store.getTasks().add(new TaskUnit(btId, csId, "Binary Trees Practice",
                TaskDifficulty.Medium, 75, "2026-04-26", TaskStatus.Completed));

        int poetryId = tid++;
        store.getTasks().add(new TaskUnit(poetryId, litId, "Poetry Analysis",
                TaskDifficulty.Low, 30, "2026-04-27", TaskStatus.Completed));

        int algoId = tid++;
        store.getTasks().add(new TaskUnit(algoId, csId, "Algorithms Mid-term Review",
                TaskDifficulty.High, 120, "2026-04-28", TaskStatus.Scheduled));

        int wavesId = tid++;
        store.getTasks().add(new TaskUnit(wavesId, physicsId, "Wave Mechanics Problems",
                TaskDifficulty.Medium, 50, "2026-04-29", TaskStatus.Scheduled));

        while (store.getNextTaskId() < tid) store.incrementTaskId();

        // ── Progress logs (7 entries → one per day, feeds weekly hours chart) ─

        // Completed tasks: essay, linAlg, binaryTrees, poetry
        store.getLogs().add(new ProgressLog(essayId,  true,  42, 0));  // Mon
        store.getLogs().add(new ProgressLog(linAlgId, true,  65, 1));  // Tue
        store.getLogs().add(new ProgressLog(btId,     true,  80, 0));  // Wed
        store.getLogs().add(new ProgressLog(poetryId, true,  28, 1));  // Thu

        // In-progress / partial logs for analytics variety
        store.getLogs().add(new ProgressLog(newtonId,  false, 45, 2)); // Fri
        store.getLogs().add(new ProgressLog(calcId,    false, 30, 3)); // Sat
        store.getLogs().add(new ProgressLog(thermoId,  false, 60, 1)); // Sun

        // Seed one dependency: Data Structures depends on Binary Trees
        store.getDependencies().add(new TaskDependency(dsId, btId));

        store.setSeeded(true);
    }
}
