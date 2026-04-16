/**
 * tasks.js — Tasks page logic.
 * Features: list tasks, add task, delete task, update status,
 *           manage subjects, start/end focus sessions.
 */

let allTasks = [];
let allSubjects = [];
let activeSession = null;

async function loadTasksPage() {
    await Promise.all([loadTasks(), loadSubjects(), loadSession()]);
}

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
