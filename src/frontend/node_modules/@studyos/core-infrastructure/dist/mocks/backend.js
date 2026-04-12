export const mockBackend = (() => {
  let user = { id: 1n, name: "Student", fatigueLevel: 0n, maxDailyHours: 8n, startTime: "08:00 AM" };
  let subjects = [];
  let tasks = [];
  let nextSubjectId = 4n;
  let nextTaskId = 5n;
  let activeSession = null;
  let logs = [];
  let isSeeded = false;
  
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
      tasks = tasks.filter(t => t.id !== BigInt(taskId));
      return true;
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
      return activeSession || null;
    },
    startFocusSession: async (taskId) => {
      let parsedId = BigInt(taskId);
      let task = tasks.find(t => t.id === parsedId);
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
      return activeSession;
    },
    endFocusSession: async () => {
      if (!activeSession) return null;
      // Removed interruptions from the progress log as per requirements
      let log = { completed: true, taskId: activeSession.taskId, actualTime: 25n };
      logs.push(log);
      activeSession = null;
      return log;
    },
    recordInterruption: async () => {
       return undefined;
    },
    logProgress: async () => {
       return undefined;
    },
    getAnalytics: async () => {
       const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
       const history = days.map((day, idx) => ({
         date: `2026-04-${10+idx}`,
         score: BigInt(70 + Math.floor(Math.random() * 20))
       }));
       
       const performance = subjects.map(s => ({
         subjectName: s.name,
         completedTasks: BigInt(tasks.filter(t => t.subjectId === s.id && getStatusString(t.status) === 'Completed').length),
         avgScore: BigInt(80 + Math.floor(Math.random() * 15))
       }));

       const weekly = days.map(day => ({
         day,
         hours: BigInt(2 + Math.floor(Math.random() * 4))
       }));

       return {
         subjectPerformance: performance,
         weeklyHours: weekly,
         focusScoreHistory: history
       };
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
