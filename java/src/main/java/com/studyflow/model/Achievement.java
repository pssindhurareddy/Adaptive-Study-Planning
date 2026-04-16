package com.studyflow.model;

/**
 * Achievement — a milestone earned by the user (gamification).
 * earned: true when the condition has been met.
 */
public class Achievement {

    private String id;
    private String title;
    private String description;
    private String icon;
    private boolean earned;
    private String category; // "focus" | "streak" | "completion" | "tasks"

    public Achievement() {}

    public Achievement(String id, String title, String description, String icon,
                       boolean earned, String category) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.earned = earned;
        this.category = category;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public boolean isEarned() { return earned; }
    public void setEarned(boolean earned) { this.earned = earned; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
