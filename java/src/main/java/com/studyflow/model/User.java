package com.studyflow.model;

public class User {
    private int id;
    private String name;
    private int maxDailyHours;
    private int fatigueLevel;

    public User() {}

    public User(int id, String name, int maxDailyHours, int fatigueLevel) {
        this.id = id;
        this.name = name;
        this.maxDailyHours = maxDailyHours;
        this.fatigueLevel = fatigueLevel;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getMaxDailyHours() { return maxDailyHours; }
    public void setMaxDailyHours(int maxDailyHours) { this.maxDailyHours = maxDailyHours; }
    public int getFatigueLevel() { return fatigueLevel; }
    public void setFatigueLevel(int fatigueLevel) { this.fatigueLevel = fatigueLevel; }
}
