# Adaptive Study Planning System — Java

A full Java rewrite of the Adaptive Study Planning System using **Spring Boot** (backend REST API) and **Thymeleaf** (server-rendered frontend) with vanilla JavaScript for dynamic interactions.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Backend Framework | Spring Boot 3.2 |
| Frontend Framework | Thymeleaf (server-side templates) |
| Data Store | In-memory (ArrayList + HashMap) |
| Charts | Chart.js 4 (CDN) |
| Build Tool | Maven |
| Fonts | Google Fonts (Space Grotesk, DM Sans, JetBrains Mono) |

## Project Structure

```
java/
├── pom.xml
├── README.md
└── src/main/
    ├── java/com/studyflow/
    │   ├── StudyFlowApplication.java        # Spring Boot entry point
    │   ├── model/                           # Data model classes
    │   │   ├── User.java
    │   │   ├── Subject.java
    │   │   ├── TaskUnit.java
    │   │   ├── TaskDifficulty.java          # enum { Low, Medium, High }
    │   │   ├── TaskStatus.java              # enum { Scheduled, InProgress, Completed }
    │   │   ├── ProgressLog.java
    │   │   ├── ActiveFocusSession.java
    │   │   ├── DashboardData.java
    │   │   ├── FocusSession.java
    │   │   ├── ScheduledBlock.java
    │   │   ├── PriorityQueueItem.java
    │   │   ├── TaskStats.java
    │   │   ├── SubjectLeaderboardEntry.java
    │   │   ├── AnalyticsData.java
    │   │   ├── FocusScorePoint.java
    │   │   ├── SubjectPerformance.java
    │   │   └── WeeklyHours.java
    │   ├── service/                         # Business logic services
    │   │   ├── StudyDataStore.java          # In-memory data store (ArrayList + HashMap)
    │   │   ├── UserService.java             # User CRUD
    │   │   ├── SubjectService.java          # Subject CRUD
    │   │   ├── TaskService.java             # TaskManager (add, delete, sort, filter, updateStatus)
    │   │   ├── ScoreCalculator.java         # focusScore, stabilityScore, studyStreak, dashboard
    │   │   ├── SessionService.java          # SessionManager (Pomodoro, HashMap<userId, session>)
    │   │   ├── AnalyticsService.java        # Analytics aggregation
    │   │   ├── SchedulingService.java       # Daily schedule, priority queue, task stats, leaderboard
    │   │   └── SeedService.java             # Demo data seeding (@PostConstruct)
    │   └── controller/
    │       ├── ApiController.java           # REST API (@RestController, /api/**)
    │       └── WebController.java           # Page routes (@Controller, Thymeleaf)
    └── resources/
        ├── application.properties
        ├── templates/                       # Thymeleaf HTML templates
        │   ├── layout.html                  # Shared sidebar layout
        │   ├── dashboard.html               # Dashboard page
        │   ├── tasks.html                   # Tasks + Subjects page
        │   └── analytics.html               # Analytics + Charts page
        └── static/
            ├── css/style.css                # Dark theme CSS
            └── js/
                ├── app.js                   # Shared utilities + API client
                ├── dashboard.js             # Dashboard page JS
                ├── tasks.js                 # Tasks page JS
                └── analytics.js             # Analytics + Chart.js renderers
```

## Features

### Pages

| Page | URL | Features |
|------|-----|---------|
| Dashboard | `/` or `/dashboard` | Focus score ring, stability/streak metrics, today's schedule, priority queue |
| Tasks | `/tasks` | Add/delete tasks, status transitions, focus sessions (Pomodoro), subject management |
| Analytics | `/analytics` | 7-day focus score chart, weekly hours chart, subject performance bar chart, subject leaderboard |

### REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user` | Get user profile |
| POST | `/api/user` | Create user |
| PUT | `/api/user` | Update user |
| GET | `/api/subjects` | List all subjects |
| POST | `/api/subjects` | Add subject |
| DELETE | `/api/subjects/{id}` | Remove subject |
| GET | `/api/tasks` | List tasks sorted by priority |
| POST | `/api/tasks` | Add task |
| DELETE | `/api/tasks/{id}` | Delete task |
| PUT | `/api/tasks/{id}/status` | Update task status |
| GET | `/api/dashboard` | Get dashboard metrics |
| POST | `/api/sessions/start/{taskId}` | Start Pomodoro focus session |
| POST | `/api/sessions/end` | End active session + log progress |
| POST | `/api/sessions/interruption` | Record an interruption |
| GET | `/api/sessions/active` | Get active session info |
| POST | `/api/progress` | Manual progress log |
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/schedule` | Get daily schedule (top 5 tasks) |
| GET | `/api/priority-queue` | Get priority queue (top 5 tasks) |
| GET | `/api/task-stats` | Get task counts by status |
| GET | `/api/subject-leaderboard` | Get subject leaderboard |
| POST | `/api/seed` | Re-seed demo data |

### Adaptive Study Logic (Java Implementation)

- **Priority Score** = `deadlineUrgency(1–5)` + `difficultyWeight(1/3/5)` + `subjectWeight`
- **Schedule Priority** = `urgencyScore(20/40/60/80/100)` × `difficultyMultiplier(1/2/3)`
- **Focus Score** = `completedSessions × 15 − interruptions × 3 + consistencyBonus`
- **Stability Score** = `(onTimeTasks / total) × 100` (on-time = within 120% of estimate)
- **Adaptive Pomodoro**: 20 min (≥4 avg interruptions), 25 min (normal), 30 min (<2 interruptions with history)

### Java Patterns Demonstrated

| Pattern | Where |
|---------|-------|
| `ArrayList<T>` (add, removeIf, stream) | `StudyDataStore` + services |
| `HashMap<K,V>` (put, get, remove) | `SessionService` — active sessions |
| `Comparator.comparingInt().reversed()` | `TaskService.listTasksSorted()`, `SchedulingService` |
| `stream().filter().collect()` | All services |
| `stream().limit(5)` | `SchedulingService.getDailySchedule()` |
| `Collectors.groupingBy()` equivalent | `SchedulingService.getTaskStats()` |
| Iterator pattern (for-loop update) | `TaskService.updateTaskStatus()` |
| `Math.min / Math.max` | `ScoreCalculator` |
| `@PostConstruct` lifecycle | `SeedService.seedOnStartup()` |

## Prerequisites

- **Java 17** or newer
- **Maven 3.8+**

## Build & Run

```bash
# From the java/ directory:
cd java

# Build (skip tests for fast build):
mvn package -DskipTests

# Run:
java -jar target/adaptive-study-planning-1.0.0.jar

# Or run directly with Maven:
mvn spring-boot:run
```

The application starts on **http://localhost:8080**.

Demo data (4 subjects, 8 tasks, 3 progress logs, 1 user) is seeded automatically on first startup.

## Development

```bash
# Run with live reload (requires spring-boot-devtools):
mvn spring-boot:run

# Run tests:
mvn test
```
