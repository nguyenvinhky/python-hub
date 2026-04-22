/* ==========================================================================
   App — bootstrap: theme, Pyodide boot, DEV mode, event wiring
   ========================================================================== */

(function () {
  // --- Dev mode (?dev=1) ---
  const params = new URLSearchParams(location.search);
  window.DEV = params.get('dev') === '1';

  // --- Theme ---
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    root.classList.add('dark');
  }

  function toggleTheme() {
    root.classList.toggle('dark');
    localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
  }

  // --- DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    // Theme button
    document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);

    // Hamburger (mobile)
    document.getElementById('btnHamburger')?.addEventListener('click', () => window.UI.openDrawer());
    document.getElementById('drawerBackdrop')?.addEventListener('click', () => window.UI.closeDrawer());

    // Global Escape: close drawer
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') window.UI.closeDrawer();
    });

    // Init UI
    window.UI.init();

    // Listen progress changes → refresh sidebar
    document.addEventListener('progress-change', () => window.UI.updateProgressUI());

    // Viewport badge
    const vpw = document.getElementById('vpw');
    const vph = document.getElementById('vph');
    function updVp() {
      if (vpw) vpw.textContent = window.innerWidth;
      if (vph) vph.textContent = window.innerHeight;
    }
    updVp();
    addEventListener('resize', updVp);

    // Boot Pyodide in background
    document.addEventListener('pyodide-ready', () => window.UI.setPyodideReady());
    document.addEventListener('pyodide-error', (e) => window.UI.setPyodideError(e.detail));
    window.PyRunner.boot();

    // Enable DEV indicator
    if (window.DEV) {
      const banner = document.createElement('div');
      banner.className = 'fixed top-20 right-4 z-50 px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-semibold shadow-lg';
      banner.textContent = '🔧 DEV MODE';
      document.body.appendChild(banner);
    }
  });
})();
