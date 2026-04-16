package com.studyflow.model;

/**
 * TaskDependency — records that one task depends on another being completed first.
 * Java equivalent of a directed edge in a dependency graph.
 */
public class TaskDependency {

    private int taskId;          // The dependent task
    private int dependsOnTaskId; // Must be completed before taskId

    public TaskDependency() {}

    public TaskDependency(int taskId, int dependsOnTaskId) {
        this.taskId = taskId;
        this.dependsOnTaskId = dependsOnTaskId;
    }

    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }
    public int getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(int dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }
}
