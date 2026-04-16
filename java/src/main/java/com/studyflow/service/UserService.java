package com.studyflow.service;

import com.studyflow.model.*;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * UserService — manages the single-user profile.
 * Java equivalent of the Motoko user CRUD helpers in StudyLib.
 */
@Service
public class UserService {

    private final StudyDataStore store;

    public UserService(StudyDataStore store) {
        this.store = store;
    }

    /** Returns the current user profile, or empty if not yet created. */
    public Optional<User> getUser() {
        return store.getUsers().stream().findFirst();
    }

    /**
     * Create or update the single user profile.
     * Java equivalent: upsertUser(users, name, maxDailyHours, fatigueLevel)
     */
    public User upsertUser(String name, int maxDailyHours, int fatigueLevel) {
        Optional<User> existing = store.getUsers().stream().findFirst();
        if (existing.isPresent()) {
            User u = existing.get();
            u.setName(name);
            u.setMaxDailyHours(maxDailyHours);
            u.setFatigueLevel(fatigueLevel);
            return u;
        } else {
            User newUser = new User(1, name, maxDailyHours, fatigueLevel);
            store.getUsers().add(newUser);
            return newUser;
        }
    }
}
