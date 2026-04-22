/* ==========================================================================
   Progress tracking — lưu trạng thái làm bài trong localStorage
   ========================================================================== */

(function () {
  const KEY = 'python-hub-progress-v1';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('progress-change', { detail: data }));
  }

  const Progress = {
    get(id) {
      return getAll()[id] || null;
    },
    getAll,

    markAttempted(id) {
      const data = getAll();
      const cur = data[id] || {};
      if (cur.status === 'done') return;
      data[id] = {
        status: 'attempted',
        attempts: (cur.attempts || 0) + 1,
        firstAttemptAt: cur.firstAttemptAt || Date.now(),
      };
      save(data);
    },

    markDone(id) {
      const data = getAll();
      const cur = data[id] || {};
      if (cur.status === 'done') return;
      const firstAttempt = cur.firstAttemptAt || Date.now();
      data[id] = {
        status: 'done',
        attempts: (cur.attempts || 0) + 1,
        firstAttemptAt: firstAttempt,
        passedAt: Date.now(),
        timeSpent: Date.now() - firstAttempt,
      };
      save(data);
    },

    reset() {
      localStorage.removeItem(KEY);
      document.dispatchEvent(new CustomEvent('progress-change', { detail: {} }));
    },

    getStatus(id) {
      return (getAll()[id] || {}).status || 'pending';
    },

    getStats() {
      const data = getAll();
      const entries = Object.values(data);
      return {
        done: entries.filter(e => e.status === 'done').length,
        attempted: entries.filter(e => e.status === 'attempted').length,
        total: (window.QUESTIONS || []).length,
      };
    },

    formatTimeSpent(id) {
      const e = getAll()[id];
      if (!e || !e.timeSpent) return null;
      const sec = Math.round(e.timeSpent / 1000);
      if (sec < 60) return `${sec}s`;
      return `${Math.floor(sec / 60)}p${(sec % 60).toString().padStart(2, '0')}`;
    },
  };

  window.Progress = Progress;
})();
