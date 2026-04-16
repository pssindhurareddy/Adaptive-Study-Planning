package com.studyflow.model;

import java.util.List;

/**
 * ProcrastinationDebt — tracks overdue tasks and a cumulative "debt score".
 * debtScore: 0–100+ penalty points from overdue / stale tasks
 */
public class ProcrastinationDebt {

    private int overdueCount;
    private int staleCount;       // tasks not touched for > 7 days
    private int debtScore;        // 0–100+ computed penalty
    private String debtLevel;     // "none" | "low" | "medium" | "high" | "critical"
    private List<Integer> overdueTaskIds;
    private String advice;

    public ProcrastinationDebt() {}

    public ProcrastinationDebt(int overdueCount, int staleCount, int debtScore,
                                String debtLevel, List<Integer> overdueTaskIds, String advice) {
        this.overdueCount = overdueCount;
        this.staleCount = staleCount;
        this.debtScore = debtScore;
        this.debtLevel = debtLevel;
        this.overdueTaskIds = overdueTaskIds;
        this.advice = advice;
    }

    public int getOverdueCount() { return overdueCount; }
    public void setOverdueCount(int overdueCount) { this.overdueCount = overdueCount; }
    public int getStaleCount() { return staleCount; }
    public void setStaleCount(int staleCount) { this.staleCount = staleCount; }
    public int getDebtScore() { return debtScore; }
    public void setDebtScore(int debtScore) { this.debtScore = debtScore; }
    public String getDebtLevel() { return debtLevel; }
    public void setDebtLevel(String debtLevel) { this.debtLevel = debtLevel; }
    public List<Integer> getOverdueTaskIds() { return overdueTaskIds; }
    public void setOverdueTaskIds(List<Integer> overdueTaskIds) { this.overdueTaskIds = overdueTaskIds; }
    public String getAdvice() { return advice; }
    public void setAdvice(String advice) { this.advice = advice; }
}
