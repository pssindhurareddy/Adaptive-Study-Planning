/**
 * tasks.js — Tasks page logic.
 * Features: list tasks, add task, delete task, update status,
 *           manage subjects, start/end focus sessions,
 *           monthly calendar view, dependency graph, undo/redo.
 */

let allTasks = [];
let allSubjects = [];
let activeSession = null;
let currentView = 'list'; // 'list' | 'calendar'

// ── Milliseconds per day constant ─────────────────────────────────────────────
const MS_PER_DAY = 86_400_000;

async function loadTasksPage() {
    await Promise.all([loadTasks(), loadSubjects(), loadSession()]);
    await Promise.all([loadUndoRedoState(), loadDependencyGraph()]);
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────

async function loadUndoRedoState() {
    try {
        const state = await api.get('/tasks/history');
        updateUndoRedoBtns(state.canUndo, state.canRedo);
    } catch (e) { /* silent */ }
}

function updateUndoRedoBtns(canUndo, canRedo) {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
}

async function undoTask() {
    try {
        const res = await api.post('/tasks/undo');
        allTasks = res.tasks || [];
        renderTasksOrCalendar();
        updateUndoRedoBtns(res.canUndo, res.canRedo);
        showToast(res.success ? 'Undo successful.' : 'Nothing to undo.', res.success ? 'success' : 'error');
    } catch (e) {
        showToast('Undo failed.', 'error');
    }
}

async function redoTask() {
    try {
        const res = await api.post('/tasks/redo');
        allTasks = res.tasks || [];
        renderTasksOrCalendar();
        updateUndoRedoBtns(res.canUndo, res.canRedo);
        showToast(res.success ? 'Redo successful.' : 'Nothing to redo.', res.success ? 'success' : 'error');
    } catch (e) {
        showToast('Redo failed.', 'error');
    }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

async function loadTasks() {
    const el = document.getElementById('task-list');
    if (el) el.innerHTML = loadingHtml('Loading tasks...');
    try {
        allTasks = await api.get('/tasks') || [];
        renderTasksOrCalendar();
    } catch (e) {
        if (el) el.innerHTML = emptyHtml('⚠️', 'Failed to load tasks.');
        console.error(e);
    }
}

function renderTasksOrCalendar() {
    if (currentView === 'calendar') {
        renderCalendar(allTasks);
    } else {
        renderTasks(allTasks);
    }
}

function renderTasks(tasks) {
    const el = document.getElementById('task-list');
    if (!el) return;
    if (tasks.length === 0) {
        el.innerHTML = emptyHtml('📋', 'No tasks yet. Add one above!');
        return;
    }
    el.innerHTML = tasks.map(t => {
        const subj = allSubjects.find(s => s.id === t.subjectId);
        const subjName = subj ? subj.name : `Subject #${t.subjectId}`;
        const canStart = t.status !== 'Completed' && (!activeSession || activeSession.taskId === t.id);
        const isActive = activeSession && activeSession.taskId === t.id;
        const deadlineFormatted = formatDate(t.deadline);
        return `
        <div class="task-row" id="task-${t.id}">
          <div class="task-info">
            <div class="task-title">${escHtml(t.title)}</div>
            <div class="task-meta">
              <span>${escHtml(subjName)}</span>
              <span>·</span>
              <span>⏱ ${t.estimatedMinutes} min</span>
              <span>·</span>
              <span>📅 ${deadlineFormatted}</span>
              ${isActive ? `<span style="color:var(--primary);font-weight:600">· 🎯 Active</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            ${diffBadge(t.difficulty)}
            ${statusBadge(t.status)}
            ${t.status === 'Scheduled' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Mark In Progress"
                onclick="changeStatus(${t.id}, 'InProgress')">▶</button>` : ''}
            ${t.status === 'InProgress' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Mark Completed"
                onclick="changeStatus(${t.id}, 'Completed')">✓</button>` : ''}
            ${canStart && t.status !== 'Completed' ? `
              <button class="btn btn-primary btn-sm" onclick="startSession(${t.id})">
                ${isActive ? '⏹ End' : '▶ Focus'}
              </button>` : ''}
            <button class="btn btn-danger btn-sm btn-icon" title="Delete"
              onclick="deleteTask(${t.id})">🗑</button>
          </div>
        </div>`;
    }).join('');
}

async function changeStatus(taskId, status) {
    try {
        await api.put(`/tasks/${taskId}/status`, { status });
        showToast('Status updated.', 'success');
        await loadTasks();
        await loadUndoRedoState();
    } catch (e) {
        showToast('Failed to update status.', 'error');
        console.error(e);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
        await api.delete(`/tasks/${taskId}`);
        showToast('Task deleted.', 'success');
        await loadTasks();
        await loadUndoRedoState();
    } catch (e) {
        showToast('Failed to delete task.', 'error');
        console.error(e);
    }
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

function openAddTaskModal() {
    populateSubjectSelect();
    document.getElementById('add-task-modal').classList.remove('hidden');
}

function closeAddTaskModal() {
    document.getElementById('add-task-modal').classList.add('hidden');
    document.getElementById('add-task-form').reset();
}

function populateSubjectSelect() {
    const sel = document.getElementById('task-subject');
    if (!sel) return;
    sel.innerHTML = allSubjects.length === 0
        ? '<option value="">No subjects — add one first</option>'
        : allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-task-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subjectId = parseInt(document.getElementById('task-subject').value);
            const title = document.getElementById('task-title').value.trim();
            const difficulty = document.getElementById('task-difficulty').value;
            const estimatedMinutes = parseInt(document.getElementById('task-minutes').value);
            const deadline = document.getElementById('task-deadline').value;
            if (!title || !deadline || !subjectId) {
                showToast('Please fill all fields.', 'error');
                return;
            }
            try {
                await api.post('/tasks', { subjectId, title, difficulty, estimatedMinutes, deadline });
                showToast('Task added!', 'success');
                closeAddTaskModal();
                await loadTasks();
                await loadUndoRedoState();
            } catch (err) {
                showToast('Failed to add task.', 'error');
                console.error(err);
            }
        });
    }
});

// ── Subjects ──────────────────────────────────────────────────────────────────

async function loadSubjects() {
    const el = document.getElementById('subject-list');
    try {
        allSubjects = await api.get('/subjects') || [];
        if (el) renderSubjects(allSubjects);
        populateDepSelects();
    } catch (e) {
        if (el) el.innerHTML = emptyHtml('⚠️', 'Failed to load subjects.');
        console.error(e);
    }
}

function renderSubjects(subjects) {
    const el = document.getElementById('subject-list');
    if (!el) return;
    if (subjects.length === 0) {
        el.innerHTML = emptyHtml('📚', 'No subjects yet.');
        return;
    }
    el.innerHTML = subjects.map(s => `
      <div class="task-row">
        <div class="task-info">
          <div class="task-title">${escHtml(s.name)}</div>
          <div class="task-meta">Weight: ${s.weight}</div>
        </div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeSubject(${s.id})">🗑</button>
      </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-subject-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('subject-name').value.trim();
            const weight = parseInt(document.getElementById('subject-weight').value);
            if (!name) return;
            try {
                await api.post('/subjects', { name, weight });
                showToast('Subject added!', 'success');
                form.reset();
                await loadSubjects();
            } catch (err) {
                showToast('Failed to add subject.', 'error');
            }
        });
    }
});

async function removeSubject(id) {
    if (!confirm('Remove this subject?')) return;
    try {
        await api.delete(`/subjects/${id}`);
        showToast('Subject removed.', 'success');
        await loadSubjects();
        await loadTasks();
    } catch (e) {
        showToast('Failed to remove subject.', 'error');
    }
}

// ── Focus Session ─────────────────────────────────────────────────────────────

let sessionTimerInterval = null;

async function loadSession() {
    try {
        activeSession = await api.get('/sessions/active');
        renderSessionBanner(activeSession);
    } catch (e) {
        activeSession = null;
        renderSessionBanner(null);
    }
}

function renderSessionBanner(session) {
    const banner = document.getElementById('session-banner');
    if (!banner) return;

    if (sessionTimerInterval) { clearInterval(sessionTimerInterval); sessionTimerInterval = null; }

    if (!session) {
        banner.classList.add('hidden');
        return;
    }
    banner.classList.remove('hidden');
    const type = session.isBreak ? '☕ Break' : '🎯 Focus';

    // Live countdown timer
    const sessionKey = `session_start_tasks_${session.taskId}_${session.sessionNumber}`;
    if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, Date.now().toString());
    }
    const startTime = parseInt(sessionStorage.getItem(sessionKey), 10);
    const totalMs = (session.durationMinutes || 25) * 60 * 1000;

    function getCountdown() {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    banner.innerHTML = `
      <div>
        <span style="font-weight:700;color:var(--primary)">${type} Session Active</span>
        <span style="color:var(--text-secondary);margin-left:12px;font-size:0.85rem">
          Task #${session.taskId} · Session ${session.sessionNumber}
        </span>
      </div>
      <div class="flex gap-2 items-center">
        <span id="session-countdown" style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;color:var(--accent);min-width:50px;text-align:center">${getCountdown()}</span>
        <button class="btn btn-ghost btn-sm" onclick="recordInterruption()">⚡ Interruption</button>
        <button class="btn btn-secondary btn-sm" onclick="endSession()">⏹ End</button>
      </div>`;

    sessionTimerInterval = setInterval(() => {
        const el = document.getElementById('session-countdown');
        if (el) el.textContent = getCountdown();
    }, 1000);
}

async function startSession(taskId) {
    if (activeSession && activeSession.taskId === taskId) {
        await endSession();
        return;
    }
    if (activeSession) {
        showToast('End current session first.', 'error');
        return;
    }
    try {
        activeSession = await api.post(`/sessions/start/${taskId}`);
        showToast(`Session started! ${activeSession.durationMinutes} min ${activeSession.isBreak ? 'break' : 'focus'}.`, 'success');
        renderSessionBanner(activeSession);
        await loadTasks();
    } catch (e) {
        showToast('Failed to start session.', 'error');
        console.error(e);
    }
}

async function endSession() {
    try {
        await api.post('/sessions/end');
        showToast('Session ended and progress logged!', 'success');
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        activeSession = null;
        renderSessionBanner(null);
        await loadTasks();
    } catch (e) {
        showToast('Failed to end session.', 'error');
    }
}

async function recordInterruption() {
    try {
        await api.post('/sessions/interruption');
        showToast('Interruption recorded.', 'success');
    } catch (e) {
        showToast('Failed to record interruption.', 'error');
    }
}

// ── Filter ────────────────────────────────────────────────────────────────────

function filterTasks(status) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('btn-primary'));
    event.target.classList.add('btn-primary');
    const filtered = status === 'All' ? allTasks : allTasks.filter(t => t.status === status);
    if (currentView === 'calendar') renderCalendar(filtered);
    else renderTasks(filtered);
}

// ── View Toggle (List / Calendar) ─────────────────────────────────────────────

function setView(view) {
    currentView = view;
    document.getElementById('task-list').classList.toggle('hidden', view !== 'list');
    document.getElementById('calendar-view').classList.toggle('hidden', view !== 'calendar');
    document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
    document.getElementById('view-cal-btn').classList.toggle('active', view === 'calendar');
    if (view === 'calendar') renderCalendar(allTasks);
    else renderTasks(allTasks);
}

// ── Monthly Calendar View ─────────────────────────────────────────────────────

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed

function renderCalendar(tasks) {
    const el = document.getElementById('calendar-view');
    if (!el) return;

    const year = calendarYear;
    const month = calendarMonth;

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    const today = new Date();

    // Build a map: "YYYY-MM-DD" → [tasks]
    const tasksByDay = {};
    for (const t of tasks) {
        if (t.deadline) {
            const key = t.deadline.slice(0, 10);
            if (!tasksByDay[key]) tasksByDay[key] = [];
            tasksByDay[key].push(t);
        }
    }

    const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = `
      <div class="cal-nav">
        <button class="btn btn-ghost btn-sm" onclick="calNavMonth(-1)">‹ Prev</button>
        <span class="cal-month-label">${monthName}</span>
        <button class="btn btn-ghost btn-sm" onclick="calNavMonth(1)">Next ›</button>
      </div>
      <div class="cal-grid">
        ${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}`;

    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
        html += `<div class="cal-cell cal-empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasksByDay[dateKey] || [];
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        html += `<div class="cal-cell${isToday ? ' cal-today' : ''}${dayTasks.length > 0 ? ' cal-has-tasks' : ''}">
          <div class="cal-day-num">${day}</div>
          ${dayTasks.slice(0, 3).map(t => `
            <div class="cal-task-chip cal-${t.difficulty.toLowerCase()}" title="${escHtml(t.title)} (${t.status})">
              ${escHtml(t.title.length > 12 ? t.title.slice(0, 12) + '…' : t.title)}
            </div>`).join('')}
          ${dayTasks.length > 3 ? `<div class="cal-more">+${dayTasks.length - 3} more</div>` : ''}
        </div>`;
    }

    html += `</div>`;
    el.innerHTML = html;
}

function calNavMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
    if (calendarMonth > 11) { calendarMonth = 0;  calendarYear++; }
    renderCalendar(allTasks);
}

// ── Dependency Graph ──────────────────────────────────────────────────────────

async function loadDependencyGraph() {
    const container = document.getElementById('dep-graph-container');
    if (!container) return;
    try {
        const [deps, tasks] = await Promise.all([
            api.get('/dependency-graph'),
            api.get('/tasks')
        ]);
        renderDepGraph(deps, tasks, container);
        populateDepSelects();
    } catch (e) {
        container.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:16px">Failed to load dependency graph.</p>`;
    }
}

function renderDepGraph(deps, tasks, container) {
    if (!deps || deps.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:16px">No dependencies defined yet.</p>`;
        return;
    }

    const taskMap = {};
    (tasks || []).forEach(t => taskMap[t.id] = t);

    const rows = deps.map(d => {
        const task = taskMap[d.taskId];
        const dep  = taskMap[d.dependsOnTaskId];
        const taskTitle = task ? escHtml(task.title) : `#${d.taskId}`;
        const depTitle  = dep  ? escHtml(dep.title)  : `#${d.dependsOnTaskId}`;
        const depStatus = dep  ? dep.status : '';
        const completed = depStatus === 'Completed';
        return `
          <div class="dep-row">
            <span class="dep-arrow">→</span>
            <span class="dep-task">${taskTitle}</span>
            <span class="dep-label">depends on</span>
            <span class="dep-prereq ${completed ? 'dep-done' : 'dep-pending'}">${depTitle}</span>
            <span class="badge ${completed ? 'badge-completed' : 'badge-scheduled'}" style="font-size:0.65rem">${completed ? '✓' : '⏳'}</span>
            <button class="btn btn-ghost btn-sm btn-icon" title="Remove dependency"
              onclick="removeDependency(${d.taskId}, ${d.dependsOnTaskId})">✕</button>
          </div>`;
    });

    container.innerHTML = `<div class="dep-graph">${rows.join('')}</div>`;
}

function populateDepSelects() {
    const sel1 = document.getElementById('dep-task-id');
    const sel2 = document.getElementById('dep-on-id');
    if (!sel1 || !sel2) return;
    const opts = allTasks.map(t => `<option value="${t.id}">${escHtml(t.title)}</option>`).join('');
    sel1.innerHTML = opts;
    sel2.innerHTML = opts;
}

async function addDependency() {
    const taskId = parseInt(document.getElementById('dep-task-id').value);
    const dependsOnTaskId = parseInt(document.getElementById('dep-on-id').value);
    if (!taskId || !dependsOnTaskId || taskId === dependsOnTaskId) {
        showToast('Select two different tasks.', 'error');
        return;
    }
    try {
        await api.post(`/tasks/${taskId}/dependencies`, { dependsOnTaskId });
        showToast('Dependency added.', 'success');
        await loadDependencyGraph();
    } catch (e) {
        showToast('Failed to add dependency.', 'error');
    }
}

async function removeDependency(taskId, dependsOnId) {
    try {
        await api.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
        showToast('Dependency removed.', 'success');
        await loadDependencyGraph();
    } catch (e) {
        showToast('Failed to remove dependency.', 'error');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format ISO date "YYYY-MM-DD" to locale-friendly string. */
function formatDate(isoDate) {
    if (!isoDate) return '—';
    try {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return isoDate; }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadTasksPage);


// ── Tasks ─────────────────────────────────────────────────────────────────────

async function loadTasks() {
    const el = document.getElementById('task-list');
    if (!el) return;
    el.innerHTML = loadingHtml('Loading tasks...');
    try {
        allTasks = await api.get('/tasks') || [];
        renderTasks(allTasks);
    } catch (e) {
        el.innerHTML = emptyHtml('⚠️', 'Failed to load tasks.');
        console.error(e);
    }
}

function renderTasks(tasks) {
    const el = document.getElementById('task-list');
    if (!el) return;
    if (tasks.length === 0) {
        el.innerHTML = emptyHtml('📋', 'No tasks yet. Add one above!');
        return;
    }
    el.innerHTML = tasks.map(t => {
        const subj = allSubjects.find(s => s.id === t.subjectId);
        const subjName = subj ? subj.name : `Subject #${t.subjectId}`;
        const canStart = t.status !== 'Completed' && (!activeSession || activeSession.taskId === t.id);
        const isActive = activeSession && activeSession.taskId === t.id;
        return `
        <div class="task-row" id="task-${t.id}">
          <div class="task-info">
            <div class="task-title">${escHtml(t.title)}</div>
            <div class="task-meta">
              <span>${escHtml(subjName)}</span>
              <span>·</span>
              <span>⏱ ${t.estimatedMinutes} min</span>
              <span>·</span>
              <span>📅 ${t.deadline}</span>
              ${isActive ? `<span style="color:var(--primary);font-weight:600">· 🎯 Active</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            ${diffBadge(t.difficulty)}
            ${statusBadge(t.status)}
            ${t.status === 'Scheduled' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Mark In Progress"
                onclick="changeStatus(${t.id}, 'InProgress')">▶</button>` : ''}
            ${t.status === 'InProgress' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Mark Completed"
                onclick="changeStatus(${t.id}, 'Completed')">✓</button>` : ''}
            ${canStart && t.status !== 'Completed' ? `
              <button class="btn btn-primary btn-sm" onclick="startSession(${t.id})">
                ${isActive ? '⏹ End' : '▶ Focus'}
              </button>` : ''}
            <button class="btn btn-danger btn-sm btn-icon" title="Delete"
              onclick="deleteTask(${t.id})">🗑</button>
          </div>
        </div>`;
    }).join('');
}

async function changeStatus(taskId, status) {
    try {
        await api.put(`/tasks/${taskId}/status`, { status });
        showToast('Status updated.', 'success');
        await loadTasks();
    } catch (e) {
        showToast('Failed to update status.', 'error');
        console.error(e);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
        await api.delete(`/tasks/${taskId}`);
        showToast('Task deleted.', 'success');
        await loadTasks();
    } catch (e) {
        showToast('Failed to delete task.', 'error');
        console.error(e);
    }
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

function openAddTaskModal() {
    populateSubjectSelect();
    document.getElementById('add-task-modal').classList.remove('hidden');
}

function closeAddTaskModal() {
    document.getElementById('add-task-modal').classList.add('hidden');
    document.getElementById('add-task-form').reset();
}

function populateSubjectSelect() {
    const sel = document.getElementById('task-subject');
    if (!sel) return;
    sel.innerHTML = allSubjects.length === 0
        ? '<option value="">No subjects — add one first</option>'
        : allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-task-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subjectId = parseInt(document.getElementById('task-subject').value);
            const title = document.getElementById('task-title').value.trim();
            const difficulty = document.getElementById('task-difficulty').value;
            const estimatedMinutes = parseInt(document.getElementById('task-minutes').value);
            const deadline = document.getElementById('task-deadline').value;
            if (!title || !deadline || !subjectId) {
                showToast('Please fill all fields.', 'error');
                return;
            }
            try {
                await api.post('/tasks', { subjectId, title, difficulty, estimatedMinutes, deadline });
                showToast('Task added!', 'success');
                closeAddTaskModal();
                await loadTasks();
            } catch (err) {
                showToast('Failed to add task.', 'error');
                console.error(err);
            }
        });
    }
});

// ── Subjects ──────────────────────────────────────────────────────────────────

async function loadSubjects() {
    const el = document.getElementById('subject-list');
    try {
        allSubjects = await api.get('/subjects') || [];
        if (el) renderSubjects(allSubjects);
    } catch (e) {
        if (el) el.innerHTML = emptyHtml('⚠️', 'Failed to load subjects.');
        console.error(e);
    }
}

function renderSubjects(subjects) {
    const el = document.getElementById('subject-list');
    if (!el) return;
    if (subjects.length === 0) {
        el.innerHTML = emptyHtml('📚', 'No subjects yet.');
        return;
    }
    el.innerHTML = subjects.map(s => `
      <div class="task-row">
        <div class="task-info">
          <div class="task-title">${escHtml(s.name)}</div>
          <div class="task-meta">Weight: ${s.weight}</div>
        </div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeSubject(${s.id})">🗑</button>
      </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-subject-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('subject-name').value.trim();
            const weight = parseInt(document.getElementById('subject-weight').value);
            if (!name) return;
            try {
                await api.post('/subjects', { name, weight });
                showToast('Subject added!', 'success');
                form.reset();
                await loadSubjects();
            } catch (err) {
                showToast('Failed to add subject.', 'error');
            }
        });
    }
});

async function removeSubject(id) {
    if (!confirm('Remove this subject?')) return;
    try {
        await api.delete(`/subjects/${id}`);
        showToast('Subject removed.', 'success');
        await loadSubjects();
        await loadTasks();
    } catch (e) {
        showToast('Failed to remove subject.', 'error');
    }
}

// ── Focus Session ─────────────────────────────────────────────────────────────

async function loadSession() {
    try {
        activeSession = await api.get('/sessions/active');
        renderSessionBanner(activeSession);
    } catch (e) {
        activeSession = null;
        renderSessionBanner(null);
    }
}

function renderSessionBanner(session) {
    const banner = document.getElementById('session-banner');
    if (!banner) return;
    if (!session) {
        banner.classList.add('hidden');
        return;
    }
    banner.classList.remove('hidden');
    const type = session.isBreak ? '☕ Break' : '🎯 Focus';
    banner.innerHTML = `
      <div>
        <span style="font-weight:700;color:var(--primary)">${type} Session Active</span>
        <span style="color:var(--text-secondary);margin-left:12px;font-size:0.85rem">
          Task #${session.taskId} · ${session.durationMinutes} min · Session ${session.sessionNumber}
        </span>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" onclick="recordInterruption()">⚡ Interruption</button>
        <button class="btn btn-secondary btn-sm" onclick="endSession()">⏹ End</button>
      </div>`;
}

async function startSession(taskId) {
    if (activeSession && activeSession.taskId === taskId) {
        await endSession();
        return;
    }
    if (activeSession) {
        showToast('End current session first.', 'error');
        return;
    }
    try {
        activeSession = await api.post(`/sessions/start/${taskId}`);
        showToast(`Session started! ${activeSession.durationMinutes} min ${activeSession.isBreak ? 'break' : 'focus'}.`, 'success');
        renderSessionBanner(activeSession);
        await loadTasks();
    } catch (e) {
        showToast('Failed to start session.', 'error');
        console.error(e);
    }
}

async function endSession() {
    try {
        await api.post('/sessions/end');
        showToast('Session ended and progress logged!', 'success');
        activeSession = null;
        renderSessionBanner(null);
        await loadTasks();
    } catch (e) {
        showToast('Failed to end session.', 'error');
    }
}

async function recordInterruption() {
    try {
        await api.post('/sessions/interruption');
        showToast('Interruption recorded.', 'success');
    } catch (e) {
        showToast('Failed to record interruption.', 'error');
    }
}

// ── Filter ────────────────────────────────────────────────────────────────────

function filterTasks(status) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('btn-primary'));
    event.target.classList.add('btn-primary');
    if (status === 'All') {
        renderTasks(allTasks);
    } else {
        renderTasks(allTasks.filter(t => t.status === status));
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadTasksPage);
