package com.studyflow.model;

/**
 * BurnoutStatus — output of the Burnout Detector.
 * Level: "none" | "low" | "medium" | "high"
 * score: 0–100 burnout risk (higher = more at risk)
 */
public class BurnoutStatus {

    private String level;       // "none" | "low" | "medium" | "high"
    private int score;          // 0–100 risk score
    private String message;     // Human-readable advice
    private int interruptions;  // total interruptions in recent logs
    private int avgInterruptions; // avg interruptions per session

    public BurnoutStatus() {}

    public BurnoutStatus(String level, int score, String message, int interruptions, int avgInterruptions) {
        this.level = level;
        this.score = score;
        this.message = message;
        this.interruptions = interruptions;
        this.avgInterruptions = avgInterruptions;
    }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public int getInterruptions() { return interruptions; }
    public void setInterruptions(int interruptions) { this.interruptions = interruptions; }
    public int getAvgInterruptions() { return avgInterruptions; }
    public void setAvgInterruptions(int avgInterruptions) { this.avgInterruptions = avgInterruptions; }
}
