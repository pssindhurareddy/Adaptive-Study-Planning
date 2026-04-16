/**
 * app.js — shared utilities, API client, and toast notifications.
 * Called by all page-specific JS files.
 */

// ── Toast notifications ──────────────────────────────────────────────────────

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; }, 2500);
    setTimeout(() => toast.remove(), 3000);
}

// ── API client ───────────────────────────────────────────────────────────────

const api = {
    async get(path) {
        const r = await fetch('/api' + path);
        if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
        if (r.status === 204) return null;
        return r.json();
    },
    async post(path, body) {
        const r = await fetch('/api' + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        });
        if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
        if (r.status === 204) return null;
        return r.json();
    },
    async put(path, body) {
        const r = await fetch('/api' + path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error(`PUT ${path} failed: ${r.status}`);
        return r.json();
    },
    async delete(path) {
        const r = await fetch('/api' + path, { method: 'DELETE' });
        if (!r.ok) throw new Error(`DELETE ${path} failed: ${r.status}`);
        return r.json();
    }
};

// ── Badge helpers ────────────────────────────────────────────────────────────

function diffBadge(difficulty) {
    const map = {
        Low: 'badge-low',
        Medium: 'badge-medium',
        High: 'badge-high'
    };
    return `<span class="badge ${map[difficulty] || 'badge-gray'}">${difficulty}</span>`;
}

function statusBadge(status) {
    const map = {
        Scheduled: 'badge-scheduled',
        InProgress: 'badge-inprogress',
        Completed: 'badge-completed'
    };
    const labels = {
        Scheduled: 'Scheduled',
        InProgress: 'In Progress',
        Completed: 'Completed'
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${labels[status] || status}</span>`;
}

function scoreBadge(score) {
    const cls = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';
    return `<span class="badge ${cls === 'text-success' ? 'badge-completed' : cls === 'text-warning' ? 'badge-inprogress' : 'badge-high'}">${score}</span>`;
}

// ── SVG Focus Ring ────────────────────────────────────────────────────────────

function buildFocusRingSVG(score, size = 140) {
    const r = (size - 16) / 2;
    const circumference = 2 * Math.PI * r;
    const filled = circumference * (score / 100);
    const cx = size / 2;
    const cy = size / 2;
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="focus-ring-svg">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7"/>
          <stop offset="50%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#3b4dc8"/>
        </linearGradient>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="rgba(120,80,200,0.15)" stroke-width="10"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="url(#ringGrad)" stroke-width="10"
        stroke-dasharray="${filled} ${circumference}"
        stroke-dashoffset="0"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
    </svg>`;
}

// ── Loading / empty helpers ───────────────────────────────────────────────────

function loadingHtml(message = 'Loading...') {
    return `<div class="loading-overlay"><div class="spinner"></div>${message}</div>`;
}

function emptyHtml(icon, message) {
    return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-text">${message}</div>
    </div>`;
}
