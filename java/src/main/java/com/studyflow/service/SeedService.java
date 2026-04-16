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
     * Java equivalent:
     *   users.add(new User("Alex Chen", 8, 3))
     *   subjects.add(new Subject(id, "Mathematics", 8))
     *   ...
     *   tasks.add(new TaskUnit(tid++, mathId, "Calculus Chapter 5 Review", HIGH, 90, "2026-04-15", SCHEDULED))
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

        // Bump the nextSubjectId to reflect what was used
        while (store.getNextSubjectId() < sid) {
            store.incrementSubjectId();
        }

        int tid = store.getNextTaskId();

        // Java equivalent: tasks.add(new TaskUnit(tid++, mathId, "Calculus Chapter 5 Review", HIGH, 90, "2026-04-15", SCHEDULED))
        int calcId = tid++;
        store.getTasks().add(new TaskUnit(calcId, mathId, "Calculus Chapter 5 Review",
                TaskDifficulty.High, 90, "2026-04-15", TaskStatus.Scheduled));

        int newtonId = tid++;
        store.getTasks().add(new TaskUnit(newtonId, physicsId, "Newton's Laws Problem Set",
                TaskDifficulty.Medium, 60, "2026-04-14", TaskStatus.InProgress));

        store.getTasks().add(new TaskUnit(tid++, csId, "Data Structures Assignment",
                TaskDifficulty.High, 120, "2026-04-13", TaskStatus.Scheduled));

        store.getTasks().add(new TaskUnit(tid++, litId, "Essay Outline",
                TaskDifficulty.Low, 45, "2026-04-16", TaskStatus.Scheduled));

        store.getTasks().add(new TaskUnit(tid++, mathId, "Linear Algebra Quiz Prep",
                TaskDifficulty.Medium, 60, "2026-04-17", TaskStatus.Scheduled));

        store.getTasks().add(new TaskUnit(tid++, physicsId, "Thermodynamics Notes",
                TaskDifficulty.High, 90, "2026-04-18", TaskStatus.Scheduled));

        store.getTasks().add(new TaskUnit(tid++, csId, "Binary Trees Practice",
                TaskDifficulty.Medium, 75, "2026-04-15", TaskStatus.Scheduled));

        int poetryId = tid++;
        store.getTasks().add(new TaskUnit(poetryId, litId, "Poetry Analysis",
                TaskDifficulty.Low, 30, "2026-04-19", TaskStatus.Completed));

        // Progress logs — Java equivalent: logs.add(new ProgressLog(taskId, completed, actualTime, interruptions))
        store.getLogs().add(new ProgressLog(poetryId, true, 28, 1));
        store.getLogs().add(new ProgressLog(newtonId, false, 45, 2));
        store.getLogs().add(new ProgressLog(calcId, false, 30, 3));

        // Sync nextTaskId
        while (store.getNextTaskId() < tid) {
            store.incrementTaskId();
        }

        store.setSeeded(true);
    }
}
