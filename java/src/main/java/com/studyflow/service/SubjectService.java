package com.studyflow.service;

import com.studyflow.model.Subject;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * SubjectService — CRUD operations for study subjects.
 */
@Service
public class SubjectService {

    private final StudyDataStore store;

    public SubjectService(StudyDataStore store) {
        this.store = store;
    }

    /** Returns all subjects. */
    public List<Subject> listSubjects() {
        return List.copyOf(store.getSubjects());
    }

    /**
     * Add a new subject.
     * Java equivalent: subjects.add(new Subject(id, name, weight))
     */
    public Subject addSubject(String name, int weight) {
        int id = store.getNextSubjectId();
        Subject s = new Subject(id, name, weight);
        store.getSubjects().add(s);
        store.incrementSubjectId();
        return s;
    }

    /**
     * Remove a subject by id.
     * Java equivalent: subjects.removeIf(s -> s.getId() == id)
     */
    public boolean removeSubject(int id) {
        return store.getSubjects().removeIf(s -> s.getId() == id);
    }

    /** Lookup a subject by id — used internally. */
    public Optional<Subject> findById(int id) {
        return store.getSubjects().stream().filter(s -> s.getId() == id).findFirst();
    }
}
