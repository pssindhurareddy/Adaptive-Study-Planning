/**
 * dashboard.js — Dashboard page logic.
 * Features: metrics, daily schedule, priority queue, active session (with live
 * countdown), burnout detector, procrastination debt tracker, exam collision
 * detector, achievements.
 */

let activeSessionData = null;
let sessionTimerInterval = null; // live countdown timer handle

// ── Milliseconds per day constant ────────────────────────────────────────────
const MS_PER_DAY = 86_400_000;

async function loadDashboard() {
    // Set today's date in the subtitle
    const dateEl = document.getElementById('today-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    await Promise.all([
        loadMetrics(),
        loadDailySchedule(),
        loadPriorityQueue(),
        loadActiveSession(),
        loadBurnout(),
        loadDebt(),
        loadCollisions(),
        loadAchievements()
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
    // Focus Score card
    setVal('stat-focus', dash.focusScore);
    const focusBar = document.getElementById('focus-progress-bar');
    if (focusBar) { focusBar.style.width = dash.focusScore + '%'; }

    // Study Streak — show as "Xd" (consecutive days format)
    setVal('stat-streak', dash.studyStreak + 'd');

    // Daily Progress — "completedTasks / totalTasks"
    setVal('stat-daily-progress', dash.completedTasks + '/' + dash.totalTasks);

    // Stability Score
    setVal('stat-stability', dash.stabilityScore);

    // Hidden breakdown stats (kept for JS compatibility)
    setVal('stat-total', dash.totalTasks);
    setVal('stat-completed', dash.completedTasks);
    setVal('stat-inprogress', dash.inProgressTasks);
    setVal('stat-scheduled', dash.scheduledTasks);

    // Progress bar (daily progress card)
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
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem">${formatDate(item.deadline)}</td>
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

// ── Active Session + Live Countdown ──────────────────────────────────────────

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

    // Clear any existing countdown timer
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }

    if (!session) {
        banner.classList.add('hidden');
        return;
    }
    banner.classList.remove('hidden');

    const type = session.isBreak ? '☕ Break' : '🎯 Focus';
    // Store countdown start time in session storage so it survives page refreshes
    const sessionKey = `session_start_${session.taskId}_${session.sessionNumber}`;
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

    // Start live countdown
    sessionTimerInterval = setInterval(() => {
        const el = document.getElementById('session-countdown');
        if (el) el.textContent = getCountdown();
    }, 1000);
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
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        await loadDashboard();
    } catch (e) {
        showToast('Failed to end session.', 'error');
    }
}

// ── Burnout Detector ─────────────────────────────────────────────────────────

async function loadBurnout() {
    const el = document.getElementById('burnout-content');
    if (!el) return;
    try {
        const b = await api.get('/burnout');
        const levelColors = { none: '#6ee7b7', low: '#fcd34d', medium: '#fb923c', high: '#fca5a5' };
        const levelIcons  = { none: '😊', low: '😐', medium: '😟', high: '🚨' };
        const levelBadgeClass = { none: 'badge-completed', low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
        const color = levelColors[b.level] || '#a89fc0';
        const badgeClass = levelBadgeClass[b.level] || 'badge-gray';

        // Update card header with level badge
        const burnoutCard = document.getElementById('burnout-card');
        if (burnoutCard) {
            const titleEl = burnoutCard.querySelector('.card-title');
            if (titleEl) {
                titleEl.innerHTML = `🧠 Burnout Detector <span class="badge ${badgeClass}" style="float:right;text-transform:capitalize;font-size:0.7rem">${b.level}</span>`;
            }
        }

        el.innerHTML = `
          <div class="progress-bar-container mb-2">
            <div class="progress-bar-fill" style="width:${b.score}%;background:${color}"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:1.5rem">${levelIcons[b.level] || '❓'}</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;color:${color}">${b.score}%</span>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 4px">${escHtml(b.message)}</p>
          <p style="font-size:0.72rem;color:var(--text-muted);margin:0">Interruptions: ${b.interruptions} total · ${b.avgInterruptions} avg/session</p>`;
    } catch (e) {
        el.innerHTML = `<p class="text-muted" style="font-size:0.85rem">Unable to load burnout data.</p>`;
    }
}

// ── Procrastination Debt Tracker ─────────────────────────────────────────────

async function loadDebt() {
    const el = document.getElementById('debt-content');
    if (!el) return;
    try {
        const d = await api.get('/procrastination-debt');
        const levelColors = { none: '#6ee7b7', low: '#93c5fd', medium: '#fcd34d', high: '#fb923c', critical: '#fca5a5' };
        const color = levelColors[d.debtLevel] || '#a89fc0';
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="font-size:1.5rem;font-family:'JetBrains Mono',monospace;font-weight:700;color:${color}">${d.debtScore}</div>
            <div>
              <div style="font-size:0.85rem;font-weight:600;color:${color};text-transform:capitalize">${d.debtLevel}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Debt Score</div>
            </div>
          </div>
          <div class="progress-bar-container mb-2">
            <div class="progress-bar-fill" style="width:${Math.min(100, d.debtScore)}%;background:${color}"></div>
          </div>
          <div style="display:flex;gap:12px;font-size:0.75rem;color:var(--text-muted);margin-bottom:6px">
            <span>⚠️ ${d.overdueCount} overdue</span>
            <span>🕐 ${d.staleCount} stale</span>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:0">${escHtml(d.advice)}</p>`;
    } catch (e) {
        el.innerHTML = `<p class="text-muted" style="font-size:0.85rem">Unable to load debt data.</p>`;
    }
}

// ── Exam Collision Detector ───────────────────────────────────────────────────

async function loadCollisions() {
    const el = document.getElementById('collision-content');
    if (!el) return;
    try {
        const collisions = await api.get('/collisions');
        if (!collisions || collisions.length === 0) {
            el.innerHTML = `<div class="empty-state" style="padding:20px 0">
              <div style="font-size:1.4rem;margin-bottom:6px">✅</div>
              <div style="font-size:0.85rem;color:var(--text-secondary)">No deadline collisions found!</div>
            </div>`;
            return;
        }
        el.innerHTML = collisions.map(c => `
          <div class="collision-row" id="collision-${c.taskId1}-${c.taskId2}">
            <div style="flex:1;min-width:0">
              <div style="font-size:0.8rem;font-weight:600;color:var(--badge-red-text)">${escHtml(c.title1)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">vs. ${escHtml(c.title2)}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">${escHtml(c.penaltyLabel)}</div>
            </div>
            <button class="btn btn-sm btn-danger"
              onclick="resolveCollision(${c.taskId2}, '${escHtml(c.title2)}', this)">
              Resolve
            </button>
          </div>`).join('');
    } catch (e) {
        el.innerHTML = `<p class="text-muted" style="font-size:0.85rem">Unable to load collision data.</p>`;
    }
}

/**
 * Resolve a collision by shifting the task's deadline forward by 2 days.
 * Makes the backend call, then refreshes the collision list.
 */
async function resolveCollision(taskId, taskTitle, btnEl) {
    if (btnEl) btnEl.disabled = true;
    try {
        await api.post('/collisions/resolve', { taskId, shiftDays: 2 });
        showToast(`"${taskTitle}" rescheduled +2 days.`, 'success');
        await loadCollisions(); // Refresh the collision list
    } catch (e) {
        showToast('Failed to resolve collision.', 'error');
        if (btnEl) btnEl.disabled = false;
    }
}

// ── Achievements ──────────────────────────────────────────────────────────────

async function loadAchievements() {
    const strip = document.getElementById('achievements-strip');
    const label = document.getElementById('achievements-earned-label');
    if (!strip) return;
    try {
        const achievements = await api.get('/achievements');
        const earned = achievements.filter(a => a.earned);
        if (label) label.textContent = `${earned.length}/${achievements.length} earned`;

        // Show earned first, then unearned (greyed out)
        const sorted = [...achievements].sort((a, b) => b.earned - a.earned);
        strip.innerHTML = sorted.map(a => `
          <div class="achievement-badge ${a.earned ? 'earned' : 'unearned'}" title="${escHtml(a.description)}">
            <span class="achievement-icon">${a.icon}</span>
            <span class="achievement-title">${escHtml(a.title)}</span>
          </div>`).join('');
    } catch (e) {
        if (strip) strip.innerHTML = `<p class="text-muted" style="font-size:0.85rem">Unable to load achievements.</p>`;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
function formatDate(isoDate) {
    if (!isoDate) return '—';
    try {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return isoDate; }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadDashboard);
