/**
 * analytics.js — Analytics page logic.
 * Loads: analytics data, subject leaderboard, dashboard metrics.
 * Renders charts using Chart.js.
 */

async function loadAnalyticsPage() {
    await Promise.all([loadAnalytics(), loadLeaderboard(), loadDashMetrics()]);
}

async function loadDashMetrics() {
    try {
        const dash = await api.get('/dashboard');
        setVal('a-focus', dash.focusScore);
        setVal('a-stability', dash.stabilityScore);
        setVal('a-streak', dash.studyStreak);
        setVal('a-completed', dash.completedTasks);
    } catch (e) {
        console.error('Failed to load dashboard metrics', e);
    }
}

async function loadAnalytics() {
    try {
        const data = await api.get('/analytics');
        renderFocusChart(data.focusScoreHistory);
        renderSubjectChart(data.subjectPerformance);
        renderWeeklyChart(data.weeklyHours);
    } catch (e) {
        console.error('Failed to load analytics', e);
        showToast('Failed to load analytics.', 'error');
    }
}

async function loadLeaderboard() {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    el.innerHTML = loadingHtml();
    try {
        const entries = await api.get('/subject-leaderboard') || [];
        if (entries.length === 0) {
            el.innerHTML = emptyHtml('🏆', 'No subjects yet.');
            return;
        }
        el.innerHTML = entries.map((e, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            const pct = e.completionRate;
            return `
            <div class="leaderboard-row">
              <div class="leaderboard-rank">${medal || (i + 1)}</div>
              <div class="leaderboard-info">
                <div class="leaderboard-name">${escHtml(e.subjectName)}</div>
                <div class="leaderboard-meta">${e.completedTasks}/${e.totalTasks} tasks</div>
                <div class="progress-bar-container mt-1">
                  <div class="progress-bar-fill" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="leaderboard-rate">${pct}%</div>
            </div>`;
        }).join('');
    } catch (e) {
        el.innerHTML = emptyHtml('⚠️', 'Failed to load leaderboard.');
        console.error(e);
    }
}

// ── Chart.js renderers ────────────────────────────────────────────────────────

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#a89fc0', font: { size: 11 } } },
        tooltip: {
            backgroundColor: '#1e1a2e',
            borderColor: 'rgba(120,80,200,0.3)',
            borderWidth: 1,
            titleColor: '#f0ecff',
            bodyColor: '#a89fc0'
        }
    }
};

function renderFocusChart(history) {
    const ctx = document.getElementById('focus-chart');
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    ctx._chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(p => p.date),
            datasets: [{
                label: 'Focus Score',
                data: history.map(p => p.score),
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168,85,247,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#a855f7',
                pointRadius: 4
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: { ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } },
                y: { min: 0, max: 100, ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } }
            }
        }
    });
}

function renderSubjectChart(performance) {
    const ctx = document.getElementById('subject-chart');
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    const colors = ['#a855f7', '#22d3ee', '#3b4dc8', '#f59e0b', '#10b981'];
    ctx._chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: performance.map(p => p.subjectName),
            datasets: [{
                label: 'Avg Score',
                data: performance.map(p => p.avgScore),
                backgroundColor: performance.map((_, i) => colors[i % colors.length] + '99'),
                borderColor: performance.map((_, i) => colors[i % colors.length]),
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: { ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } },
                y: { min: 0, max: 100, ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } }
            }
        }
    });
}

function renderWeeklyChart(weekly) {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    ctx._chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekly.map(w => w.day),
            datasets: [{
                label: 'Hours',
                data: weekly.map(w => w.hours),
                backgroundColor: 'rgba(34,211,238,0.25)',
                borderColor: '#22d3ee',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: { ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } },
                y: { min: 0, ticks: { color: '#6b5f80' }, grid: { color: 'rgba(120,80,200,0.08)' } }
            }
        }
    });
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

document.addEventListener('DOMContentLoaded', loadAnalyticsPage);
