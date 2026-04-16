/**
 * dashboard.js — Dashboard page logic.
 * Loads: dashboard data, daily schedule, priority queue, task stats, active session.
 */

let activeSessionData = null;

async function loadDashboard() {
    await Promise.all([
        loadMetrics(),
        loadDailySchedule(),
        loadPriorityQueue(),
        loadActiveSession()
    ]);
}

async function loadMetrics() {
    try {
        const [dash, stats] = await Promise.all([
            api.get('/dashboard'),
            api.get('/task-stats')
        ]);
        renderMetrics(dash, stats);
    } catch (e) {
        console.error('Failed to load metrics', e);
    }
}

function renderMetrics(dash, stats) {
    // Focus Score Ring
    const ringWrap = document.getElementById('focus-ring');
    if (ringWrap) {
        ringWrap.innerHTML = buildFocusRingSVG(dash.focusScore, 140);
        const inner = document.createElement('div');
        inner.className = 'score-ring-inner';
        inner.innerHTML = `<span class="score-number">${dash.focusScore}</span><span class="score-label">Focus Score</span>`;
        ringWrap.style.position = 'relative';
        ringWrap.appendChild(inner);
    }

    setVal('stat-focus', dash.focusScore);
    setVal('stat-stability', dash.stabilityScore);
    setVal('stat-streak', dash.studyStreak + ' days');
    setVal('stat-total', dash.totalTasks);
    setVal('stat-completed', dash.completedTasks);
    setVal('stat-inprogress', dash.inProgressTasks);
    setVal('stat-scheduled', dash.scheduledTasks);

    // Progress bar
    const pct = dash.totalTasks > 0 ? Math.round((dash.completedTasks / dash.totalTasks) * 100) : 0;
    const bar = document.getElementById('progress-bar');
    if (bar) { bar.style.width = pct + '%'; }
    setVal('progress-pct', pct + '%');
}

async function loadDailySchedule() {
    const el = document.getElementById('daily-schedule');
    if (!el) return;
    el.innerHTML = loadingHtml('Loading schedule...');
    try {
        const blocks = await api.get('/schedule');
        if (!blocks || blocks.length === 0) {
            el.innerHTML = emptyHtml('📅', 'No tasks scheduled for today.');
            return;
        }
        el.innerHTML = blocks.map(b => `
          <div class="task-row">
            <div style="min-width:70px">
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--accent)">${b.timeSlot}</span>
            </div>
            <div class="task-info">
              <div class="task-title">${escHtml(b.taskTitle)}</div>
              <div class="task-meta">
                <span>${escHtml(b.subjectName)}</span>
                <span>·</span>
                <span>${b.estimatedMinutes} min</span>
              </div>
            </div>
            <div class="task-actions">
              ${diffBadge(b.difficulty)}
              <span class="badge badge-gray" title="Priority Score">⬆ ${b.priorityScore}</span>
            </div>
          </div>`).join('');
    } catch (e) {
        el.innerHTML = emptyHtml('⚠️', 'Failed to load schedule.');
        console.error(e);
    }
}

async function loadPriorityQueue() {
    const el = document.getElementById('priority-queue');
    if (!el) return;
    el.innerHTML = loadingHtml();
    try {
        const items = await api.get('/priority-queue');
        if (!items || items.length === 0) {
            el.innerHTML = emptyHtml('🎯', 'No pending tasks.');
            return;
        }
        el.innerHTML = `<table class="data-table">
          <thead><tr>
            <th>#</th>
            <th>Task</th>
            <th>Subject</th>
            <th>Deadline</th>
            <th>Difficulty</th>
            <th>Priority</th>
          </tr></thead>
          <tbody>
            ${items.map((item, i) => `
              <tr>
                <td style="font-family:'JetBrains Mono',monospace;color:var(--text-muted)">${i + 1}</td>
                <td>${escHtml(item.taskTitle)}</td>
                <td style="color:var(--text-secondary)">${escHtml(item.subjectName)}</td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem">${item.deadline}</td>
                <td>${diffBadge(item.difficulty)}</td>
                <td><span style="color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700">${item.priorityScore}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (e) {
        el.innerHTML = emptyHtml('⚠️', 'Failed to load priority queue.');
        console.error(e);
    }
}

async function loadActiveSession() {
    try {
        activeSessionData = await api.get('/sessions/active');
        renderSessionBanner(activeSessionData);
    } catch (e) {
        activeSessionData = null;
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

async function recordInterruption() {
    try {
        await api.post('/sessions/interruption');
        showToast('Interruption recorded.', 'success');
    } catch (e) {
        showToast('Failed to record interruption.', 'error');
    }
}

async function endSession() {
    try {
        await api.post('/sessions/end');
        showToast('Session ended and progress logged!', 'success');
        activeSessionData = null;
        await loadDashboard();
    } catch (e) {
        showToast('Failed to end session.', 'error');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadDashboard);
