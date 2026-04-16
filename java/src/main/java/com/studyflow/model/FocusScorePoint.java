package com.studyflow.model;

public class FocusScorePoint {
    private String date;
    private int score;

    public FocusScorePoint() {}

    public FocusScorePoint(String date, int score) {
        this.date = date;
        this.score = score;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
