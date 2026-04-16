export const mockBackend = (() => {
  let user = { id: 1n, name: "Student", fatigueLevel: 0n, maxDailyHours: 8n, startTime: "08:00 AM" };
  let subjects = [];
  let tasks = [];
  let nextSubjectId = 4n;
  let nextTaskId = 5n;
  let activeSession = null;
  let sessionStartedAt = null;
  let logs = [];
  let isSeeded = false;
  let dependencies = []; // { taskId, dependsOnId }
  let undoStack = []; // snapshots of tasks array
  let redoStack = [];
  
  // Pre-populate demo data on load
  subjects = [
    { id: 1n, name: "Mathematics", weight: 3n },
    { id: 2n, name: "English", weight: 2n },
    { id: 3n, name: "Science", weight: 3n }
  ];
  
  tasks = [
    {
      id: 1n,
      subjectId: 1n,
      title: "CIE 3 PROJECT",
      difficulty: "Medium",
      status: "Scheduled",
      estimatedMinutes: 60n,
      deadline: "2026-04-13",
      subjectName: "Mathematics"
    },
    {
      id: 2n,
      subjectId: 1n,
      title: "Calculus Problem Set",
      difficulty: "Low",
      status: "Scheduled",
      estimatedMinutes: 60n,
      deadline: "2026-04-17",
      subjectName: "Mathematics"
    },
    {
      id: 3n,
      subjectId: 2n,
      title: "Essay Writing Assignment",
      difficulty: "Medium",
      status: "Scheduled",
      estimatedMinutes: 90n,
      deadline: "2026-04-20",
      subjectName: "English"
    },
    {
      id: 4n,
      subjectId: 3n,
      title: "Lab Report Submission",
      difficulty: "High",
      status: "Scheduled",
      estimatedMinutes: 120n,
      deadline: "2026-04-18",
      subjectName: "Science"
    }
  ];
  
  function snapshotTasks() {
    return tasks.map(t => ({ ...t }));
  }

  function getPriorityScore(task) {
    // Basic priority calculation demonstrating Java queue concepts
    let diffScore = task.difficulty === "High" || (task.difficulty && task.difficulty.High) ? 3 : task.difficulty === "Medium" || (task.difficulty && task.difficulty.Medium) ? 2 : 1;
    let daysLeft = 14;
    if (task.deadline) {
      daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 3600 * 24));
    }
    let sub = subjects.find(s => s.id === task.subjectId);
    let weight = sub ? Number(sub.weight) : 1;
    let p = Math.floor((weight * diffScore * 100) / Math.max(1, daysLeft + 1));
    return BigInt(p);
  }

  function getStatusString(status) {
    if (typeof status === 'string') return status;
    return Object.keys(status || { Scheduled: null })[0];
  }

  function formatTime(minutes) {
    let h = Math.floor(minutes / 60) % 24;
    let m = minutes % 60;
    let ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  function parseStartTime(str) {
    if (!str) return 8 * 60; // Default 8 AM
    // Handle both HH:mm and HH:mm AM/PM
    let match = str.match(/(\d{1,2})[:.](\d{2})\s*([AP]M)?/i);
    if (!match) return 8 * 60;
    
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    let ampm = match[3];
    
    let minutes = h * 60 + m;
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && h < 12) minutes += 12 * 60;
      if (ampm.toUpperCase() === 'AM' && h === 12) minutes -= 12 * 60;
    }
    return minutes;
  }

  return {
    getUser: async () => [user],
    createUser: async (name, maxDailyHours, fatigueLevel) => {
      user = { id: 1n, name, maxDailyHours: BigInt(maxDailyHours), fatigueLevel: BigInt(fatigueLevel) };
      return user;
    },
    updateUser: async (name, maxDailyHours, fatigueLevel, startTime) => {
       user.name = name; 
       user.maxDailyHours = BigInt(maxDailyHours); 
       user.fatigueLevel = BigInt(fatigueLevel);
       if (startTime) user.startTime = startTime;
       return user;
    },
    listSubjects: async () => [...subjects],
    addSubject: async (name, weight) => {
      // Java Concept: Using a Set-like check for unique names
      if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`Subject with name "${name}" already exists.`);
      }
      let s = { id: nextSubjectId++, name, weight: BigInt(weight) };
      subjects.push(s);
      return s;
    },
    removeSubject: async (id) => {
      let parsedId = BigInt(id);
      subjects = subjects.filter(s => s.id !== parsedId);
      tasks = tasks.filter(t => t.subjectId !== parsedId);
      return true;
    },
    listTasks: async () => [...tasks],
    addTask: async (subjectId, title, difficulty, estimatedMinutes, deadline) => {
      // Java Concept: Preventing duplicate task titles under the same subject
      let parsedSubjectId = BigInt(subjectId);
      if (tasks.some(t => t.subjectId === parsedSubjectId && t.title.toLowerCase() === title.toLowerCase())) {
        throw new Error(`Task "${title}" already exists for this subject.`);
      }
      undoStack.push(snapshotTasks());
      redoStack = [];
      let t = {
        id: nextTaskId++,
        subjectId: parsedSubjectId,
        title,
        difficulty,
        status: "Scheduled",
        estimatedMinutes: BigInt(estimatedMinutes),
        deadline
      };
      tasks.push(t);
      return t;
    },
    updateTaskStatus: async (taskId, status) => {
      let parsedId = BigInt(taskId);
      let t = tasks.find(x => x.id === parsedId);
      if (t) {
         t.status = typeof status === 'string' ? status : Object.keys(status || {})[0] || "Scheduled";
      }
      return t ? [t] : [];
    },
    deleteTask: async (taskId) => {
      undoStack.push(snapshotTasks());
      redoStack = [];
      tasks = tasks.filter(t => t.id !== BigInt(taskId));
      return true;
    },
    // ── Undo / Redo ─────────────────────────────────────────────────────────
    undoLastTaskChange: async () => {
      if (undoStack.length === 0) return [...tasks];
      redoStack.push(snapshotTasks());
      tasks = undoStack.pop();
      return [...tasks];
    },
    redoLastTaskChange: async () => {
      if (redoStack.length === 0) return [...tasks];
      undoStack.push(snapshotTasks());
      tasks = redoStack.pop();
      return [...tasks];
    },
    canUndo: async () => undoStack.length > 0,
    canRedo: async () => redoStack.length > 0,
    // ── Dependency Graph ────────────────────────────────────────────────────
    getDependencyGraph: async () => [...dependencies],
    addDependency: async (taskId, dependsOnId) => {
      let tId = BigInt(taskId);
      let dId = BigInt(dependsOnId);
      if (!dependencies.some(d => d.taskId === tId && d.dependsOnId === dId)) {
        dependencies.push({ taskId: tId, dependsOnId: dId });
      }
      return [...dependencies];
    },
    removeDependency: async (taskId, dependsOnId) => {
      let tId = BigInt(taskId);
      let dId = BigInt(dependsOnId);
      dependencies = dependencies.filter(d => !(d.taskId === tId && d.dependsOnId === dId));
      return [...dependencies];
    },
    getPriorityQueue: async () => {
      let active = tasks.filter(t => getStatusString(t.status) !== "Completed");
      let mapped = active.map(t => ({
         subjectName: subjects.find(s => s.id === t.subjectId)?.name || 'Unknown',
         difficulty: t.difficulty,
         taskTitle: t.title,
         deadline: t.deadline || "",
         taskId: t.id,
         priorityScore: getPriorityScore(t)
      }));
      return mapped.sort((a,b) => Number(b.priorityScore - a.priorityScore));
    },
    getDailySchedule: async () => {
      let filtered = tasks.filter(t => getStatusString(t.status) !== "Completed");
      let sorted = filtered.sort((a, b) => Number(getPriorityScore(b) - getPriorityScore(a)));
      
      let currentTime = parseStartTime(user.startTime);
      return sorted.slice(0, 5).map(t => {
        let startStr = formatTime(currentTime);
        let duration = Number(t.estimatedMinutes);
        currentTime += duration + 5; // 5 min transition
        let endStr = formatTime(currentTime);
        
        return {
           subjectName: subjects.find(s => s.id === t.subjectId)?.name || 'Unknown',
           difficulty: t.difficulty,
           taskTitle: t.title,
           taskId: t.id,
           priorityScore: getPriorityScore(t),
           estimatedMinutes: t.estimatedMinutes,
           timeSlot: `${startStr} - ${endStr}`
        };
      });
    },
    getSubjectLeaderboard: async () => {
      return subjects.map(sub => {
         let subTasks = tasks.filter(t => t.subjectId === sub.id);
         let completed = subTasks.filter(t => getStatusString(t.status) === "Completed").length;
         let cr = subTasks.length > 0 ? (completed * 100) / subTasks.length : 0;
         return {
           subjectId: sub.id,
           subjectName: sub.name,
           totalTasks: BigInt(subTasks.length),
           completedTasks: BigInt(completed),
           completionRate: BigInt(cr)
         };
      }).sort((a,b) => Number(b.completionRate - a.completionRate));
    },
    getTaskStats: async () => {
      let s = tasks.filter(x => getStatusString(x.status) === "Scheduled").length;
      let i = tasks.filter(x => getStatusString(x.status) === "InProgress").length;
      let c = tasks.filter(x => getStatusString(x.status) === "Completed").length;
      return { scheduledCount: BigInt(s), inProgressCount: BigInt(i), completedCount: BigInt(c) };
    },
    getDashboard: async () => {
      let tts = tasks.length;
      let cts = tasks.filter(x => getStatusString(x.status) === "Completed").length;
      let its = tasks.filter(x => getStatusString(x.status) === "InProgress").length;
      let sts = tasks.filter(x => getStatusString(x.status) === "Scheduled").length;
      
      // Dynamic Focus Score calculation
      const scores = [85, 90, 78, 92, 88]; // Mock historical scores
      const avgFocus = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Dynamic Streak calculation (mock logic)
      const streak = cts > 0 ? 3 : 0; 
      
      // Dynamic Stability calculation (consistency metric)
      const variance = 5; // Low variance for high stability
      const stability = 100 - (variance * 2);

      return {
        totalTasks: BigInt(tts),
        completedTasks: BigInt(cts),
        inProgressTasks: BigInt(its),
        scheduledTasks: BigInt(sts),
        dailyProgress: BigInt(tts > 0 ? (cts*100)/tts : 0),
        focusScore: BigInt(Math.round(avgFocus)),
        studyStreak: BigInt(streak),
        stabilityScore: BigInt(stability)
      };
    },
    getActiveSession: async () => {
      return activeSession ? { ...activeSession, startedAt: sessionStartedAt } : null;
    },
    startFocusSession: async (taskId) => {
      let parsedId = BigInt(taskId);
      let task = tasks.find(t => t.id === parsedId);
      sessionStartedAt = Date.now();
      activeSession = { 
        isBreak: false, 
        taskId: parsedId, 
        sessionNumber: 1n, 
        durationMinutes: 25n,
        taskTitle: task ? task.title : `Task #${taskId}`
      };
      // Update task status to InProgress
      if (task) {
        task.status = "InProgress";
      }
      return { ...activeSession, startedAt: sessionStartedAt };
    },
    endFocusSession: async () => {
      if (!activeSession) return null;
      // Removed interruptions from the progress log as per requirements
      let log = { completed: true, taskId: activeSession.taskId, actualTime: 25n };
      logs.push(log);
      activeSession = null;
      sessionStartedAt = null;
      return log;
    },
    recordInterruption: async () => {
       return undefined;
    },
    logProgress: async () => {
       return undefined;
    },
    // ── Analytics (stable, not random) ──────────────────────────────────────
    getAnalytics: async () => {
       // Use stable seeded scores instead of Math.random() so charts don't flicker
       const stableScores = [72, 78, 81, 75, 88, 83, 90];
       const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
       const history = days.map((_, idx) => ({
         date: `2026-04-${10+idx}`,
         score: BigInt(stableScores[idx])
       }));
       
       const stableHours = [3, 2, 4, 3, 5, 2, 1];
       const performance = subjects.map((s, si) => ({
         subjectName: s.name,
         completedTasks: BigInt(tasks.filter(t => t.subjectId === s.id && getStatusString(t.status) === 'Completed').length),
         avgScore: BigInt(78 + si * 5)
       }));

       const weekly = days.map((day, idx) => ({
         day,
         hours: BigInt(stableHours[idx])
       }));

       return {
         subjectPerformance: performance,
         weeklyHours: weekly,
         focusScoreHistory: history
       };
    },
    // ── Burnout Detector ────────────────────────────────────────────────────
    getBurnout: async () => {
      let fatigue = Number(user.fatigueLevel);
      let recentSessions = logs.length;
      let completedCount = tasks.filter(t => getStatusString(t.status) === 'Completed').length;
      // Score: higher fatigue + many sessions with few completions = burnout
      let score = Math.min(100, fatigue * 10 + Math.max(0, recentSessions * 5 - completedCount * 8));
      let level = score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low';
      let advice =
        level === 'High' ? 'Take a long break — reschedule non-urgent tasks and rest today.' :
        level === 'Medium' ? 'Consider a 15-min break between every two study blocks.' :
        'You\'re doing great! Keep your current rhythm.';
      return { level, score, advice };
    },
    // ── Exam Collision Detector ─────────────────────────────────────────────
    getCollisions: async () => {
      const MS_PER_DAY = 86400000;
      let pending = tasks.filter(t => getStatusString(t.status) !== 'Completed' && t.deadline);
      let collisions = [];
      for (let i = 0; i < pending.length; i++) {
        for (let j = i + 1; j < pending.length; j++) {
          let a = pending[i], b = pending[j];
          let da = new Date(a.deadline).getTime();
          let db = new Date(b.deadline).getTime();
          let diffDays = Math.abs(da - db) / MS_PER_DAY;
          if (diffDays <= 1) {
            let aHard = a.difficulty === 'High';
            let bHard = b.difficulty === 'High';
            let severity = (aHard && bHard) ? 'High' : (aHard || bHard) ? 'Medium' : 'Low';
            let dateStr = new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            let penaltyLabel = `${severity}-difficulty ${diffDays === 0 ? 'same-day' : '1-day'} collision on ${dateStr}`;
            collisions.push({
              taskId: a.id,
              taskTitle: a.title,
              conflictsWith: b.id,
              conflictsWithTitle: b.title,
              sharedDate: a.deadline,
              severity,
              penaltyLabel
            });
          }
        }
      }
      return collisions;
    },
    resolveCollision: async (taskId, shiftDays) => {
      let parsedId = BigInt(taskId);
      let task = tasks.find(t => t.id === parsedId);
      if (task && task.deadline) {
        let d = new Date(task.deadline);
        d.setDate(d.getDate() + Number(shiftDays));
        task.deadline = d.toISOString().slice(0, 10);
      }
      return task || null;
    },
    // ── Procrastination Debt Tracker ────────────────────────────────────────
    getProcrastinationDebt: async () => {
      let now = Date.now();
      let overdue = tasks.filter(t => {
        if (getStatusString(t.status) === 'Completed') return false;
        if (!t.deadline) return false;
        return new Date(t.deadline).getTime() < now;
      });
      let debtScore = Math.min(100, overdue.length * 20);
      return {
        overdueCount: BigInt(overdue.length),
        debtScore: BigInt(debtScore),
        overdueTaskTitles: overdue.map(t => t.title)
      };
    },
    // ── Achievements ────────────────────────────────────────────────────────
    getAchievements: async () => {
      let completed = tasks.filter(t => getStatusString(t.status) === 'Completed').length;
      let totalTasks = tasks.length;
      let hasSession = logs.length > 0;
      return [
        { id: 1n, title: 'First Step', description: 'Add your first task', icon: '🎯', earned: totalTasks >= 1 },
        { id: 2n, title: 'Task Master', description: 'Complete 1 task', icon: '✅', earned: completed >= 1 },
        { id: 3n, title: 'Focused', description: 'Complete a focus session', icon: '🔥', earned: hasSession },
        { id: 4n, title: 'Scheduler', description: 'Have 3+ tasks scheduled', icon: '📅', earned: tasks.filter(t => getStatusString(t.status) === 'Scheduled').length >= 3 },
        { id: 5n, title: 'Overachiever', description: 'Complete 3 tasks', icon: '🏆', earned: completed >= 3 },
        { id: 6n, title: 'Multi-Subject', description: 'Study 2+ subjects', icon: '📚', earned: subjects.length >= 2 },
        { id: 7n, title: 'Planner', description: 'Add 5+ tasks', icon: '📋', earned: totalTasks >= 5 },
        { id: 8n, title: 'Streak Starter', description: 'Log 3+ sessions', icon: '🌟', earned: logs.length >= 3 },
      ];
    },
    // ── Break Scheduler ─────────────────────────────────────────────────────
    getBreaks: async () => {
      let pending = tasks.filter(t => getStatusString(t.status) !== 'Completed');
      return pending.slice(0, 5).map((t, i) => ({
        afterTaskId: t.id,
        breakType: (i + 1) % 4 === 0 ? 'Long' : 'Short',
        durationMinutes: (i + 1) % 4 === 0 ? 15n : 5n
      }));
    },
    seedDemoData: async () => {
      if (isSeeded) return;
      isSeeded = true;
      
      const mathId = 1n;
      subjects.push({ id: mathId, name: "Mathematics", weight: 3n });
      const englishId = 2n;
      subjects.push({ id: englishId, name: "English", weight: 2n });
      const scienceId = 3n;
      subjects.push({ id: scienceId, name: "Science", weight: 3n });
      
      nextSubjectId = 4n;
      nextTaskId = 5n;
      
      tasks.push({
        id: 1n,
        subjectId: mathId,
        title: "CIE 3 PROJECT",
        difficulty: "Medium",
        status: "Completed",
        estimatedMinutes: 60n,
        deadline: "2026-04-13"
      });
      
      tasks.push({
        id: 2n,
        subjectId: mathId,
        title: "Calculus Problem Set",
        difficulty: "Low",
        status: "Completed",
        estimatedMinutes: 60n,
        deadline: "2026-04-17"
      });
      
      tasks.push({
        id: 3n,
        subjectId: englishId,
        title: "Essay Writing Assignment",
        difficulty: "Medium",
        status: "Scheduled",
        estimatedMinutes: 90n,
        deadline: "2026-04-20"
      });
      
      tasks.push({
        id: 4n,
        subjectId: scienceId,
        title: "Lab Report Submission",
        difficulty: "High",
        status: "Scheduled",
        estimatedMinutes: 120n,
        deadline: "2026-04-18"
      });
    }
  };
})();
