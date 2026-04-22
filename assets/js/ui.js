/* ==========================================================================
   UI — render toàn bộ giao diện: sidebar, question card, editor, output,
   test results, step-through timeline, variables panel.
   ========================================================================== */

(function () {
  const { escapeHtml, renderVarBody, renderStaticArray, renderStaticString } = window.Visualizer;

  const UI = {
    currentId: null,      // id của câu đang mở
    stepState: null,      // {snapshots, current, playing, timer, code}
    testsState: {},       // {[id]: results[]}
    runStats: {},         // {[id]: {lines, ms}}

    init() {
      this.renderShell();
      this.buildSidebar();
      this.buildMobileNav();
      this.openQuestion(window.QUESTIONS[0].id);
      this.updateProgressUI();
    },

    /* ------------------------------- SHELL ------------------------------- */
    renderShell() {
      document.getElementById('main-content').innerHTML = `
        <div class="max-w-[1600px] mx-auto flex">
          <aside id="sidebar" class="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40"></aside>
          <main id="mainArea" class="flex-1 min-w-0 p-4 lg:p-8 pb-24 lg:pb-8"></main>
        </div>
      `;
    },

    /* ------------------------------- SIDEBAR ------------------------------- */
    buildSidebar() {
      const stats = window.Progress.getStats();
      const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

      const items = window.QUESTIONS.map(q => this.renderSidebarItem(q)).join('');

      const listCount = window.QUESTIONS.filter(q => q.category === 'list').length;
      const strCount = window.QUESTIONS.filter(q => q.category === 'string').length;

      const html = `
        <div class="p-4 border-b border-slate-200 dark:border-slate-800">
          <div class="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-sm" role="tablist">
            <button data-filter="all" class="filter-tab flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm font-semibold">Tất cả</button>
            <button data-filter="list" class="filter-tab flex-1 py-1.5 rounded-lg text-slate-500">List (${listCount})</button>
            <button data-filter="string" class="filter-tab flex-1 py-1.5 rounded-lg text-slate-500">String (${strCount})</button>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>${stats.total} câu hỏi</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold" id="pctLabel">${pct}%</span>
          </div>
          <div class="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div id="pctBar" class="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-2 px-2" id="sidebarList" aria-label="Danh sách câu hỏi">
          <div class="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kiểu danh sách</div>
          ${window.QUESTIONS.filter(q => q.category === 'list').map(q => this.renderSidebarItem(q)).join('')}
          <div class="px-3 py-2 mt-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Xâu ký tự</div>
          ${window.QUESTIONS.filter(q => q.category === 'string').map(q => this.renderSidebarItem(q)).join('')}
        </nav>

        <div class="p-3 border-t border-slate-200 dark:border-slate-800">
          <div id="pyStatusChip" class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
            <span class="w-2 h-2 rounded-full bg-amber-500 status-pulse"></span>
            <span>Đang tải Python...</span>
          </div>
          <button id="resetProgress" class="mt-2 w-full px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            ↺ Reset tiến độ học
          </button>
        </div>
      `;

      document.getElementById('sidebar').innerHTML = html;

      document.querySelectorAll('.sidebar-item').forEach(el => {
        el.addEventListener('click', e => {
          e.preventDefault();
          this.openQuestion(parseInt(el.dataset.id));
          this.closeDrawer();
        });
      });

      document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', () => this.applyFilter(btn.dataset.filter, btn));
      });

      document.getElementById('resetProgress').addEventListener('click', () => {
        if (confirm('Xoá toàn bộ tiến độ học?')) window.Progress.reset();
      });
    },

    renderSidebarItem(q) {
      const status = window.Progress.getStatus(q.id);
      const active = this.currentId === q.id;
      const timeSpent = window.Progress.formatTimeSpent(q.id);

      let badge;
      if (status === 'done') {
        badge = `<span class="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px]">✓</span>`;
      } else if (status === 'attempted') {
        badge = `<span class="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[11px]">◐</span>`;
      } else {
        badge = `<span class="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-mono">${q.id}</span>`;
      }

      const subtitle = status === 'done'
        ? `Hoàn thành${timeSpent ? ' · ' + timeSpent : ''}`
        : status === 'attempted' ? 'Đang làm' : 'Chưa bắt đầu';

      const activeClass = active
        ? 'bg-gradient-to-r from-brand-500/10 to-accent-500/10 border border-brand-500/30'
        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent';

      return `
        <a href="#" data-id="${q.id}" data-category="${q.category}" class="sidebar-item group relative flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeClass} mb-0.5">
          ${active ? '<span class="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-brand-500 to-accent-500 rounded-r"></span>' : ''}
          ${badge}
          <div class="flex-1 min-w-0">
            <div class="text-sm ${active ? 'font-semibold' : 'font-medium'} truncate">Câu ${q.id} — ${escapeHtml(q.title.split('—')[0].trim())}</div>
            <div class="text-[11px] text-slate-500">${subtitle}</div>
          </div>
        </a>`;
    },

    applyFilter(filter, btn) {
      document.querySelectorAll('.filter-tab').forEach(b => {
        b.classList.remove('bg-white', 'dark:bg-slate-900', 'shadow-sm', 'font-semibold');
        b.classList.add('text-slate-500');
      });
      btn.classList.add('bg-white', 'dark:bg-slate-900', 'shadow-sm', 'font-semibold');
      btn.classList.remove('text-slate-500');

      document.querySelectorAll('.sidebar-item').forEach(el => {
        if (filter === 'all') {
          el.style.display = '';
        } else {
          el.style.display = el.dataset.category === filter ? '' : 'none';
        }
      });
    },

    updateProgressUI() {
      const stats = window.Progress.getStats();
      const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
      const label = document.getElementById('pctLabel');
      const bar = document.getElementById('pctBar');
      if (label) label.textContent = pct + '%';
      if (bar) bar.style.width = pct + '%';

      const topPill = document.getElementById('topProgressPill');
      if (topPill) topPill.textContent = `${stats.done}/${stats.total} hoàn thành`;

      // refresh sidebar items (lighter: just re-render list body)
      const list = document.getElementById('sidebarList');
      if (list) {
        list.innerHTML = `
          <div class="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kiểu danh sách</div>
          ${window.QUESTIONS.filter(q => q.category === 'list').map(q => this.renderSidebarItem(q)).join('')}
          <div class="px-3 py-2 mt-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Xâu ký tự</div>
          ${window.QUESTIONS.filter(q => q.category === 'string').map(q => this.renderSidebarItem(q)).join('')}
        `;
        list.querySelectorAll('.sidebar-item').forEach(el => {
          el.addEventListener('click', e => {
            e.preventDefault();
            this.openQuestion(parseInt(el.dataset.id));
            this.closeDrawer();
          });
        });
      }
    },

    /* --------------------------- PYODIDE STATUS --------------------------- */
    setPyodideReady() {
      const chip = document.getElementById('pyStatusChip');
      if (chip) {
        chip.className = 'flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs';
        chip.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Python sẵn sàng</span>
          <span class="ml-auto text-slate-500 font-mono">v0.26</span>`;
      }
      document.querySelectorAll('[data-needs-py]').forEach(b => { b.disabled = false; b.classList.remove('opacity-50'); });
    },

    setPyodideError(msg) {
      const chip = document.getElementById('pyStatusChip');
      if (chip) {
        chip.className = 'flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg text-xs';
        chip.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>Lỗi Python: ${escapeHtml(msg)}</span>`;
      }
    },

    /* --------------------------- MOBILE DRAWER --------------------------- */
    openDrawer() {
      document.getElementById('drawerBackdrop').classList.add('show');
      document.getElementById('drawer').classList.add('show');
    },
    closeDrawer() {
      document.getElementById('drawerBackdrop').classList.remove('show');
      document.getElementById('drawer').classList.remove('show');
    },

    buildMobileNav() {
      // Copy sidebar content into drawer
      const drawer = document.getElementById('drawer');
      if (drawer) drawer.innerHTML = document.getElementById('sidebar').innerHTML;
      // Re-bind
      drawer?.querySelectorAll('.sidebar-item').forEach(el => {
        el.addEventListener('click', e => {
          e.preventDefault();
          this.openQuestion(parseInt(el.dataset.id));
          this.closeDrawer();
        });
      });
    },

    /* ------------------------------- MAIN AREA ------------------------------- */
    openQuestion(id) {
      this.currentId = id;
      const q = window.QUESTIONS.find(x => x.id === id);
      if (!q) return;

      const mainArea = document.getElementById('mainArea');
      mainArea.innerHTML = this.renderQuestionPage(q);
      this.bindQuestionEvents(q);
      this.buildSidebar(); // refresh active state
      this.buildMobileNav();
    },

    renderQuestionPage(q) {
      const diffColor = {
        'Dễ': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        'Trung bình': 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
        'Khó': 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
      }[q.difficulty] || 'bg-slate-100 text-slate-700';

      const catLabel = q.category === 'list' ? 'Danh sách' : 'Xâu ký tự';

      // Breadcrumb
      const breadcrumb = `
        <nav class="flex items-center gap-2 text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
          <span>Ôn tập</span><span>/</span>
          <span>${catLabel}</span><span>/</span>
          <span class="text-slate-900 dark:text-slate-100 font-medium">Câu ${q.id}</span>
        </nav>`;

      // Question header card
      const headerCard = `
        <section class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="p-6 lg:p-7">
            <div class="flex items-start gap-2 flex-wrap">
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">CÂU ${q.id}</span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${catLabel}</span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${diffColor}">${q.difficulty}</span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Mode: ${q.mode}</span>
            </div>
            <h2 class="mt-4 text-2xl lg:text-3xl font-bold tracking-tight">${escapeHtml(q.title)}</h2>
            <div class="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">${q.body}</div>
          </div>

          <div class="border-t border-slate-200 dark:border-slate-800">
            <div class="flex gap-0 px-4 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist">
              <button data-tab="de" class="tab-btn active">📖 Đề bài</button>
              <button data-tab="goi-y" class="tab-btn">💡 Gợi ý</button>
              <button data-tab="loi-giai" class="tab-btn">📘 Lời giải</button>
            </div>

            <div id="tab-de" class="tab-panel p-5 lg:p-6 text-sm text-slate-600 dark:text-slate-400">${q.explain}</div>
            <div id="tab-goi-y" class="tab-panel p-5 lg:p-6 hidden">
              <div class="text-center py-8 text-slate-500">
                <div class="text-4xl mb-2">💭</div>
                <p>Tính năng gợi ý thông minh đang được phát triển cho v2.</p>
                <p class="text-xs mt-2">Hiện tại bạn có thể xem trực tiếp tab <b>📘 Lời giải</b>.</p>
              </div>
            </div>
            <div id="tab-loi-giai" class="tab-panel p-5 lg:p-6 hidden">
              <div class="md-body">${this.renderMarkdown(q.solution || '_Chưa có lời giải_')}</div>
            </div>
          </div>
        </section>`;

      // Body depending on mode
      let bodyContent;
      if (q.mode === 'readonly') {
        bodyContent = this.renderReadonlyBody(q);
      } else {
        bodyContent = this.renderCodeBody(q);
      }

      return `${breadcrumb}${headerCard}${bodyContent}`;
    },

    renderReadonlyBody(q) {
      const done = window.Progress.getStatus(q.id) === 'done';
      return `
        <section class="mt-6 bg-gradient-to-br from-brand-50 to-accent-50/40 dark:from-brand-500/10 dark:to-accent-500/5 rounded-2xl border border-brand-200 dark:border-brand-800/30 p-6 lg:p-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-lg">📚</div>
            <h3 class="text-lg font-bold">Câu học lý thuyết</h3>
          </div>
          <p class="text-slate-600 dark:text-slate-400 mb-5">Câu này tập trung giải thích khái niệm. Hãy đọc kỹ phần <b>Đề bài</b> và <b>Lời giải</b> bên trên, sau đó xác nhận đã hiểu.</p>
          <button id="btnMarkRead" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ${done
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-brand-500 to-accent-500 text-white'} font-semibold shadow-sm hover:brightness-110 transition">
            ${done ? '✓ Đã hoàn thành' : '📖 Tôi đã đọc hiểu'}
          </button>
          ${q.visual ? `<div class="mt-6">${this.renderStaticVisual(q.visual)}</div>` : ''}
        </section>`;
    },

    renderCodeBody(q) {
      const testsPanel = q.mode === 'function'
        ? `
          <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
              <h3 class="text-sm font-semibold">🧪 Test cases</h3>
              <span class="ml-auto text-xs text-slate-500 font-mono">${q.tests.length} tests · hàm <b>${q.signature.name}()</b></span>
            </div>
            <div id="testsBody" class="p-4 text-sm">
              <div class="text-center py-6 text-slate-500 text-sm">
                Bấm <b>🧪 Chạy test</b> để kiểm tra hàm của bạn.
              </div>
            </div>
          </div>`
        : q.mode === 'stdout'
        ? `
          <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
              <h3 class="text-sm font-semibold">🎯 Output mong đợi</h3>
              <span class="ml-auto text-xs text-slate-500 font-mono">stdout match · fuzzy</span>
            </div>
            <pre class="p-4 text-xs font-mono bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 overflow-auto max-h-[220px] whitespace-pre">${escapeHtml(q.expectedStdout || '')}</pre>
          </div>`
        : '';

      return `
        <div class="mt-6 grid lg:grid-cols-5 gap-4">
          <section class="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              <div class="flex gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <span class="ml-2 text-xs text-slate-500 font-mono">cau${q.id}.py</span>
              <span class="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded text-[10px] font-semibold font-mono">PYTHON 3.12</span>
              <button id="btnCopy" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" aria-label="Copy code">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>

            <div class="editor-wrap">
              <pre class="editor-highlight" aria-hidden="true"><code id="codeHighlight" class="language-python"></code></pre>
              <textarea id="codeEditor" class="editor-input" spellcheck="false" autocomplete="off" autocapitalize="off">${escapeHtml(q.starterCode || '')}</textarea>
            </div>

            <div class="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
              <button id="btnRun" data-needs-py class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg opacity-50" disabled>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Chạy code
                <kbd class="text-[10px] opacity-80 font-mono">⌘⏎</kbd>
              </button>
              ${q.mode === 'function'
                ? `<button id="btnTest" data-needs-py class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold rounded-lg opacity-50" disabled>🧪 Chạy test</button>`
                : `<button id="btnTest" data-needs-py class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold rounded-lg opacity-50" disabled>🎯 Kiểm tra output</button>`}
              <button id="btnTrace" data-needs-py class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg opacity-50" disabled>🔍 Từng bước</button>
              <button id="btnReset" class="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">↺ Reset</button>
              <div class="ml-auto flex items-center gap-3 text-xs text-slate-500" id="runStats"></div>
            </div>
          </section>

          <section class="lg:col-span-2 flex flex-col gap-4">
            <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div class="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                <button data-panel="out" class="panel-tab px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-semibold">📤 Output</button>
                <button data-panel="err" class="panel-tab px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">🐛 Lỗi</button>
              </div>
              <div id="panelOut" class="p-4 font-mono text-sm bg-slate-50 dark:bg-slate-950/50 min-h-[180px] whitespace-pre-wrap text-emerald-700 dark:text-emerald-400">— Output sẽ hiện ở đây —</div>
              <div id="panelErr" class="p-4 text-sm min-h-[180px] hidden"></div>
            </div>

            ${testsPanel}
          </section>
        </div>

        <section id="tracerSection" class="mt-6 hidden"></section>

        ${q.visual ? `<section class="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <h3 class="font-semibold mb-3 flex items-center gap-2">🎨 Trực quan hoá demo</h3>
          ${this.renderStaticVisual(q.visual)}
        </section>` : ''}
      `;
    },

    /* ----------------------------- EVENT BINDING ----------------------------- */
    bindQuestionEvents(q) {
      // Setup editor overlay (highlight + tab handling) nếu có editor
      this.setupCodeEditor();
      // Highlight code block trong tab Lời giải
      this.highlightSolutionCode();

      // Readonly "đã đọc" button
      const btnMarkRead = document.getElementById('btnMarkRead');
      if (btnMarkRead) {
        btnMarkRead.addEventListener('click', () => {
          window.Progress.markDone(q.id);
          this.showToast(`🎉 Đã hoàn thành câu ${q.id}!`);
        });
      }

      // Tab switching
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const key = btn.dataset.tab;
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
          document.getElementById('tab-' + key)?.classList.remove('hidden');
        });
      });

      // Code mode buttons
      const btnRun = document.getElementById('btnRun');
      const btnTest = document.getElementById('btnTest');
      const btnTrace = document.getElementById('btnTrace');
      const btnReset = document.getElementById('btnReset');
      const btnCopy = document.getElementById('btnCopy');

      if (btnRun) btnRun.addEventListener('click', () => this.runCode(q));
      if (btnTest) btnTest.addEventListener('click', () => this.runTests(q));
      if (btnTrace) btnTrace.addEventListener('click', () => this.traceCode(q));
      if (btnReset) btnReset.addEventListener('click', () => this.resetCode(q));
      if (btnCopy) btnCopy.addEventListener('click', () => {
        const code = document.getElementById('codeEditor').value;
        navigator.clipboard.writeText(code);
        this.showToast('📋 Đã sao chép code');
      });

      // Output panel tabs
      document.querySelectorAll('.panel-tab').forEach(btn => {
        btn.addEventListener('click', () => this.switchPanel(btn.dataset.panel));
      });

      // Ctrl+Enter shortcut
      const editor = document.getElementById('codeEditor');
      if (editor) {
        editor.addEventListener('keydown', e => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (q.mode === 'function' || q.mode === 'stdout') this.runTests(q);
            else this.runCode(q);
          }
        });
      }

      // Update Pyodide button states if ready
      if (window.PyRunner?.ready) this.setPyodideReady();
    },

    switchPanel(key) {
      document.querySelectorAll('.panel-tab').forEach(b => {
        b.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'font-semibold');
        b.classList.add('text-slate-500');
      });
      const active = document.querySelector(`.panel-tab[data-panel="${key}"]`);
      if (active) {
        active.classList.add('bg-slate-100', 'dark:bg-slate-800', 'font-semibold');
        active.classList.remove('text-slate-500');
      }
      document.getElementById('panelOut').classList.toggle('hidden', key !== 'out');
      document.getElementById('panelErr').classList.toggle('hidden', key !== 'err');
    },

    /* ------------------------------- ACTIONS ------------------------------- */
    async runCode(q) {
      window.Progress.markAttempted(q.id);
      const code = document.getElementById('codeEditor').value;
      const out = document.getElementById('panelOut');
      const t0 = performance.now();
      out.textContent = '⏳ Đang chạy...';
      out.classList.remove('text-rose-500');

      const { stdout, error } = await window.PyRunner.runCode(code);
      const dt = Math.round(performance.now() - t0);

      if (error) {
        out.textContent = '';
        this.renderError(error, stdout);
        this.switchPanel('err');
      } else {
        out.classList.add('text-emerald-700', 'dark:text-emerald-400');
        out.classList.remove('text-rose-500');
        out.textContent = stdout || '(không có output)';
        this.switchPanel('out');
      }

      const lines = (code.match(/\n/g) || []).length + 1;
      document.getElementById('runStats').innerHTML = `<span>📊 ${lines} dòng</span><span>·</span><span>⏱ ${dt}ms</span>`;
    },

    async runTests(q) {
      window.Progress.markAttempted(q.id);
      const code = document.getElementById('codeEditor').value;
      const t0 = performance.now();
      const body = document.getElementById('testsBody');
      if (body) body.innerHTML = '<div class="text-center py-6 text-slate-500">⏳ Đang chạy test...</div>';

      let results;
      if (q.mode === 'function') {
        results = await window.TestRunner.runFunctionTests(code, q.signature, q.tests);
      } else if (q.mode === 'stdout') {
        const r = await window.TestRunner.runStdoutTest(code, q.expectedStdout);
        results = [{ ...r, name: 'Kiểm tra stdout', input: null, expected: q.expectedStdout }];
      } else {
        return;
      }

      this.testsState[q.id] = results;
      if (body) body.innerHTML = this.renderTestResults(results, q.mode);

      const dt = Math.round(performance.now() - t0);
      document.getElementById('runStats').innerHTML = `<span>🧪 ${results.length} test</span><span>·</span><span>⏱ ${dt}ms</span>`;

      // Show stdout too
      const rr = results[0];
      if (q.mode === 'stdout' && rr) {
        if (rr.status === 'error') {
          this.renderError(rr.message || '', rr.stdout);
          this.switchPanel('err');
        } else {
          document.getElementById('panelOut').textContent = rr.stdout || '(không có output)';
          this.switchPanel('out');
        }
      }

      const allPass = results.every(r => r.status === 'pass');
      if (allPass) {
        window.Progress.markDone(q.id);
        const time = window.Progress.formatTimeSpent(q.id);
        this.showToast(`🎉 Hoàn thành câu ${q.id}${time ? ' · ' + time : ''}!`);
      }
    },

    async traceCode(q) {
      const code = document.getElementById('codeEditor').value;
      const section = document.getElementById('tracerSection');
      section.classList.remove('hidden');
      section.innerHTML = `<div class="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center">⏳ Đang phân tích code từng dòng...</div>`;

      const snapshots = await window.Tracer.trace(code);
      if (snapshots.length && snapshots[0].error) {
        section.innerHTML = `<div class="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 text-rose-700 dark:text-rose-400">❌ ${escapeHtml(snapshots[0].error)}</div>`;
        return;
      }

      this.stepState = { snapshots, current: 0, playing: false, timer: null, code, qid: q.id, speed: 900 };
      section.innerHTML = this.renderTracerShell();
      this.renderStep();
      this.bindTracerEvents();
      section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    renderTracerShell() {
      return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-400 rounded-md text-xs font-semibold">
              <span class="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span> LIVE TRACER
            </span>
            <h3 class="font-semibold text-sm">Dòng thời gian thực thi</h3>
            <span class="ml-auto text-xs text-slate-500 font-mono" id="stepCounter">0/0</span>
            <button id="btnCloseTracer" class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" aria-label="Đóng">✖</button>
          </div>

          <div class="p-5 overflow-x-auto">
            <div id="stepTimeline" class="flex items-center gap-1 min-w-max"></div>
          </div>

          <div class="flex items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
            <button id="btnFirst" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg" aria-label="Đầu">⏪</button>
            <button id="btnPrev" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg" aria-label="Trước">◀</button>
            <button id="btnPlay" class="px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold rounded-lg">▶ Auto</button>
            <button id="btnNext" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg" aria-label="Sau">▶</button>
            <input type="range" id="stepSlider" min="0" max="0" value="0" class="flex-1 accent-brand-500">
            <select id="stepSpeed" class="text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1">
              <option value="1800">0.5x</option>
              <option value="900" selected>1x</option>
              <option value="450">2x</option>
            </select>
          </div>

          <div class="grid md:grid-cols-2 gap-3 p-5 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h5 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📝 Code — dòng vàng = đang chạy</h5>
              <div id="codeView" class="code-view"></div>
            </div>
            <div>
              <h5 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📊 Biến — viền xanh = vừa thay đổi</h5>
              <div id="varsView" class="space-y-2"></div>
            </div>
          </div>

          <div class="border-t border-slate-200 dark:border-slate-800 p-5">
            <h5 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📤 Output tích luỹ</h5>
            <pre id="stdoutView" class="font-mono text-xs bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap">(chưa có)</pre>
          </div>
        </div>`;
    },

    bindTracerEvents() {
      document.getElementById('btnCloseTracer').addEventListener('click', () => this.closeTracer());
      document.getElementById('btnFirst').addEventListener('click', () => this.stepGoto(0));
      document.getElementById('btnPrev').addEventListener('click', () => this.stepPrev());
      document.getElementById('btnNext').addEventListener('click', () => this.stepNext());
      document.getElementById('btnPlay').addEventListener('click', () => this.stepPlayPause());
      document.getElementById('stepSlider').addEventListener('input', e => this.stepGoto(parseInt(e.target.value)));
      document.getElementById('stepSpeed').addEventListener('change', e => {
        if (this.stepState) this.stepState.speed = parseInt(e.target.value);
        if (this.stepState?.playing) { this.stepPlayPause(); this.stepPlayPause(); }
      });

      document.addEventListener('keydown', this.handleTracerKeys);
    },

    handleTracerKeys: null, // set below

    closeTracer() {
      if (this.stepState?.timer) clearInterval(this.stepState.timer);
      this.stepState = null;
      document.getElementById('tracerSection').classList.add('hidden');
      document.removeEventListener('keydown', this.handleTracerKeys);
    },

    stepPrev() { if (this.stepState && this.stepState.current > 0) { this.stepState.current--; this.renderStep(); } },
    stepNext() { if (this.stepState && this.stepState.current < this.stepState.snapshots.length - 1) { this.stepState.current++; this.renderStep(); } },
    stepGoto(i) { if (this.stepState) { this.stepState.current = Math.max(0, Math.min(i, this.stepState.snapshots.length - 1)); this.renderStep(); } },
    stepPlayPause() {
      const s = this.stepState; if (!s) return;
      const btn = document.getElementById('btnPlay');
      if (s.playing) {
        clearInterval(s.timer); s.timer = null; s.playing = false;
        btn.textContent = '▶ Auto';
      } else {
        s.playing = true; btn.textContent = '⏸ Pause';
        s.timer = setInterval(() => {
          if (s.current < s.snapshots.length - 1) { s.current++; this.renderStep(); }
          else { clearInterval(s.timer); s.timer = null; s.playing = false; btn.textContent = '▶ Auto'; }
        }, s.speed);
      }
    },

    renderStep() {
      const s = this.stepState; if (!s) return;
      const snap = s.snapshots[s.current];

      // Code view — highlight mỗi dòng bằng Prism (nếu có)
      const lines = s.code.split('\n');
      const canHighlight = window.Prism && window.Prism.languages && window.Prism.languages.python;
      document.getElementById('codeView').innerHTML = lines.map((line, i) => {
        const ln = i + 1;
        const cls = ln === snap.line ? 'line current' : 'line';
        const html = canHighlight
          ? window.Prism.highlight(line, window.Prism.languages.python, 'python')
          : escapeHtml(line);
        return `<div class="${cls}"><span class="ln">${ln}</span><span>${html || '&nbsp;'}</span></div>`;
      }).join('');

      // Vars view
      const prev = s.current > 0 ? (s.snapshots[s.current - 1].vars || {}) : {};
      const cur = snap.vars || {};
      const varsHtml = Object.entries(cur).map(([name, val]) => {
        const changed = JSON.stringify(val) !== JSON.stringify(prev[name]);
        return `<div class="var-row ${changed ? 'changed' : ''}">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">${escapeHtml(name)}</span>
            <span class="text-[11px] text-slate-500 font-mono">: ${val?.type || '?'}</span>
            ${changed ? '<span class="ml-auto text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded font-semibold">CHANGED</span>' : ''}
          </div>
          <div class="mt-2">${renderVarBody(val)}</div>
        </div>`;
      }).join('');
      document.getElementById('varsView').innerHTML = varsHtml || '<em class="text-slate-500 text-sm">— chưa có biến —</em>';

      // Counter + slider
      document.getElementById('stepCounter').textContent = `${s.current + 1}/${s.snapshots.length}${snap.done ? ' (xong)' : ''}`;
      document.getElementById('stepSlider').max = s.snapshots.length - 1;
      document.getElementById('stepSlider').value = s.current;

      // Timeline
      const timeline = document.getElementById('stepTimeline');
      timeline.innerHTML = s.snapshots.map((sn, i) => {
        const done = i < s.current;
        const current = i === s.current;
        const cls = current
          ? 'w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-sm font-bold flex items-center justify-center shadow-lg ring-4 ring-brand-500/20'
          : done
          ? 'w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center'
          : 'w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center';
        const connector = i < s.snapshots.length - 1
          ? `<span class="w-4 h-0.5 ${i < s.current ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}"></span>`
          : '';
        const label = sn.line === -1 ? '✓' : `L${sn.line}`;
        return `<div class="flex items-center gap-1">
          <button class="step-node flex flex-col items-center gap-1" data-step="${i}">
            <span class="${cls}">${i + 1}</span>
            <span class="text-[10px] ${current ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500'} font-mono">${label}</span>
          </button>
          ${connector}
        </div>`;
      }).join('');
      timeline.querySelectorAll('.step-node').forEach(el => {
        el.addEventListener('click', () => this.stepGoto(parseInt(el.dataset.step)));
      });

      // Stdout
      document.getElementById('stdoutView').textContent = (snap.stdout || '').trimEnd() || '(chưa có)';
      if (snap.error) document.getElementById('stdoutView').textContent += '\n\n❌ ' + snap.error;

      // Scroll current line into view
      document.querySelector('#codeView .line.current')?.scrollIntoView({ block: 'nearest' });
    },

    /* ------------------------------- HELPERS ------------------------------- */
    resetCode(q) {
      const editor = document.getElementById('codeEditor');
      editor.value = q.starterCode || '';
      editor.dispatchEvent(new Event('input'));   // trigger highlight refresh
      document.getElementById('panelOut').textContent = '— Output sẽ hiện ở đây —';
      document.getElementById('panelOut').classList.remove('text-rose-500');
      document.getElementById('panelErr').innerHTML = '';
      const body = document.getElementById('testsBody');
      if (body) body.innerHTML = '<div class="text-center py-6 text-slate-500 text-sm">Bấm <b>🧪 Chạy test</b> để kiểm tra.</div>';
      this.closeTracer();
    },

    /* Overlay editor: sync textarea ↔ pre + Tab handling */
    setupCodeEditor() {
      const textarea = document.getElementById('codeEditor');
      const highlight = document.getElementById('codeHighlight');
      if (!textarea || !highlight) return;

      const preEl = highlight.parentElement;

      const syncHighlight = () => {
        // Append \n để Prism render đủ cả dòng trống cuối
        let v = textarea.value;
        if (!v.endsWith('\n')) v += '\n';
        highlight.textContent = v;
        if (window.Prism && window.Prism.languages && window.Prism.languages.python) {
          window.Prism.highlightElement(highlight);
        }
      };

      // Initial render
      syncHighlight();

      textarea.addEventListener('input', syncHighlight);

      // Scroll sync (textarea → pre)
      textarea.addEventListener('scroll', () => {
        preEl.scrollTop = textarea.scrollTop;
        preEl.scrollLeft = textarea.scrollLeft;
      });

      // Tab / Shift+Tab handling
      textarea.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;

        if (e.shiftKey) {
          // Dedent: tìm đầu dòng hiện tại, bỏ tối đa 4 spaces
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const leading = (val.substring(lineStart).match(/^ {1,4}/) || [''])[0].length;
          if (leading > 0) {
            textarea.value = val.substring(0, lineStart) + val.substring(lineStart + leading);
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - leading);
            syncHighlight();
          }
        } else if (start === end) {
          // Không có selection → chèn 4 spaces tại caret
          textarea.value = val.substring(0, start) + '    ' + val.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 4;
          syncHighlight();
        } else {
          // Có selection nhiều dòng → indent mỗi dòng 4 spaces
          const selStart = Math.min(start, end);
          const selEnd = Math.max(start, end);
          const lineStart = val.lastIndexOf('\n', selStart - 1) + 1;
          const before = val.substring(0, lineStart);
          const selected = val.substring(lineStart, selEnd);
          const after = val.substring(selEnd);
          const indented = selected.replace(/^/gm, '    ');
          textarea.value = before + indented + after;
          textarea.selectionStart = selStart + 4;
          textarea.selectionEnd = selEnd + (indented.length - selected.length);
          syncHighlight();
        }
      });
    },

    /* Gọi Prism cho tất cả code block trong tab "Lời giải" */
    highlightSolutionCode() {
      if (!window.Prism || !window.Prism.languages || !window.Prism.languages.python) return;
      document.querySelectorAll('.md-body pre code').forEach(el => {
        if (!el.className.includes('language-')) el.classList.add('language-python');
        try { window.Prism.highlightElement(el); } catch {}
      });
    },

    renderError(msg, stdout) {
      const err = document.getElementById('panelErr');
      if (!err) return;

      // Parse lỗi & gợi ý
      const type = (msg.match(/^(\w+Error)/) || [])[1] || 'Error';
      const hints = {
        'NameError': 'Bạn có thể đã gõ nhầm tên biến hoặc chưa định nghĩa biến.',
        'IndexError': 'Chỉ số truy cập ngoài khoảng của list/chuỗi.',
        'TypeError': 'Kiểu dữ liệu không hợp lệ — kiểm tra kiểu các biến.',
        'ValueError': 'Giá trị không hợp lệ cho thao tác đó.',
        'SyntaxError': 'Sai cú pháp — thường do thiếu dấu hai chấm, ngoặc, hoặc thụt lề.',
        'IndentationError': 'Lỗi thụt lề — Python yêu cầu thụt lề nhất quán.',
        'ZeroDivisionError': 'Chia cho 0 — kiểm tra mẫu số trước khi chia.',
        'AttributeError': 'Đối tượng không có thuộc tính/phương thức đó.',
      };
      const hint = hints[type] || 'Đọc kỹ thông báo lỗi để biết chi tiết.';

      err.innerHTML = `
        <div class="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-900/40">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.8-12.4a.8.8 0 111.6 0v5a.8.8 0 11-1.6 0zm.8 8.4a1 1 0 100-2 1 1 0 000 2z"/></svg>
            <span class="font-semibold text-rose-700 dark:text-rose-400 font-mono">${escapeHtml(type)}</span>
          </div>
          <p class="text-sm text-rose-600 dark:text-rose-400 font-mono">${escapeHtml(msg)}</p>
          <div class="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg text-sm">
            <div class="font-semibold text-slate-700 dark:text-slate-300 mb-1">💡 Gợi ý</div>
            <div class="text-slate-600 dark:text-slate-400">${hint}</div>
          </div>
          ${stdout ? `<details class="mt-3"><summary class="cursor-pointer text-xs text-slate-500">Xem output trước khi lỗi</summary><pre class="mt-2 text-xs font-mono bg-slate-950 text-slate-300 p-2 rounded whitespace-pre-wrap">${escapeHtml(stdout)}</pre></details>` : ''}
        </div>`;
    },

    renderTestResults(results, mode) {
      const dev = window.DEV === true;
      const passCount = results.filter(r => r.status === 'pass').length;
      const allPass = passCount === results.length;
      const firstFailIdx = results.findIndex(r => r.status !== 'pass');

      const header = `
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-semibold ${allPass ? 'text-emerald-600' : 'text-rose-600'}">
            ${allPass ? '✅ Tất cả tests PASS' : `❌ ${passCount}/${results.length} passed`}
          </span>
          ${dev ? '<span class="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded font-semibold">DEV MODE — show all</span>' : ''}
        </div>`;

      const items = results.map((r, i) => {
        const cls = r.status === 'pass' ? 'pass' : r.status === 'error' ? 'error' : 'fail';
        const icon = r.status === 'pass' ? '✓' : r.status === 'error' ? '⚠' : '✗';
        const iconCls = r.status === 'pass' ? 'text-emerald-500' : r.status === 'error' ? 'text-amber-500' : 'text-rose-500';

        const expanded = dev || (i === firstFailIdx && !allPass);

        let detail = '';
        if (expanded) {
          if (mode === 'function' && r.status !== 'error' && r.input) {
            detail = `
              <div class="mt-2 space-y-1 text-xs font-mono">
                <div><span class="text-slate-500">Input:  </span><span>${escapeHtml(JSON.stringify(r.input))}</span></div>
                <div><span class="text-slate-500">Expect: </span><span class="text-emerald-700 dark:text-emerald-400">${escapeHtml(JSON.stringify(r.expected))}</span></div>
                <div><span class="text-slate-500">Actual: </span><span class="${r.status === 'pass' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">${escapeHtml(JSON.stringify(r.actual))}</span></div>
              </div>`;
          } else if (mode === 'function' && r.status === 'error') {
            detail = `<div class="mt-2 text-xs font-mono text-amber-700 dark:text-amber-400">${escapeHtml(r.message || '')}</div>`;
          } else if (mode === 'stdout') {
            if (r.status === 'error') {
              detail = `<div class="mt-2 text-xs font-mono text-amber-700 dark:text-amber-400">${escapeHtml(r.message || '')}</div>`;
            } else {
              detail = `
                <div class="mt-2 grid md:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <div class="text-slate-500 mb-1">Expected:</div>
                    <pre class="p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">${escapeHtml(r.expected || '')}</pre>
                  </div>
                  <div>
                    <div class="text-slate-500 mb-1">Your output:</div>
                    <pre class="p-2 bg-slate-50 dark:bg-slate-950/50 rounded border ${r.status === 'pass' ? 'border-emerald-300' : 'border-rose-300'} whitespace-pre-wrap">${escapeHtml(r.stdout || '')}</pre>
                  </div>
                </div>`;
            }
          }
        }

        return `
          <div class="test-item ${cls} mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg ${iconCls} font-bold">${icon}</span>
              <span class="text-sm font-medium flex-1 truncate">${escapeHtml(r.name || `Test ${i + 1}`)}</span>
              <span class="text-[11px] font-mono uppercase ${iconCls}">${r.status}</span>
            </div>
            ${detail}
          </div>`;
      }).join('');

      const dev_hint = !dev && !allPass
        ? `<div class="mt-3 text-[11px] text-slate-500">💡 Xem tất cả test cases bằng cách mở <code>?dev=1</code> trên URL</div>`
        : '';

      return header + items + dev_hint;
    },

    /* --------------------------- STATIC VISUALIZATION --------------------------- */
    renderStaticVisual(kind) {
      if (kind === 'listOps') {
        const steps = [
          { title: 'Bước 0: Ban đầu', arr: ['An', 'Bình', 'Chi'], hl: [] },
          { title: "Bước 1: append('Dương')", arr: ['An', 'Bình', 'Chi', 'Dương'], hl: [3] },
          { title: "Bước 2: insert(1,'Yến')", arr: ['An', 'Yến', 'Bình', 'Chi', 'Dương'], hl: [1] },
          { title: "Bước 3: remove('Dương')", arr: ['An', 'Yến', 'Bình', 'Chi'], hl: [] },
        ];
        return steps.map(s => `
          <div class="mb-4">
            <div class="text-xs text-slate-500 mb-2">${s.title}</div>
            ${renderStaticArray(s.arr, s.hl)}
          </div>`).join('');
      }
      if (kind === 'sumList') {
        const A = [10, 20, 30, 40, 50];
        let tong = 0;
        let inner = renderStaticArray(A) + '<div class="mt-3 space-y-1 text-sm font-mono">';
        A.forEach((x, i) => { tong += x; inner += `<div>Bước ${i + 1}: tong += ${x} → <b class="text-emerald-600">${tong}</b></div>`; });
        inner += '</div>';
        inner += `<div class="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-sm">✅ Tổng = <b>${tong}</b></div>`;
        return inner;
      }
      if (kind === 'indexView') {
        return renderStaticArray(['An', 'Bình', 'Chi', 'Dương', 'Yến']) +
          `<div class="mt-3 p-3 bg-sky-50 dark:bg-sky-500/10 rounded-lg text-sm">
            <b>n = 5</b> → chỉ số dương [0..4], chỉ số âm [-5..-1]<br>
            <span class="text-cyan-600 dark:text-cyan-400">Xanh:</span> chỉ số dương &nbsp;
            <span class="text-rose-500">Đỏ:</span> chỉ số âm
          </div>`;
      }
      if (kind === 'stringSlice') {
        return renderStaticString('Học lập trình Python thật thú vị', [4, 13]) +
          `<div class="mt-3 p-3 bg-sky-50 dark:bg-sky-500/10 rounded-lg text-sm">
            Slicing <code>s[4:13]</code> lấy ký tự từ chỉ số <b>4</b> đến <b>12</b>.<br>
            Độ dài: <b>len(s) = 32</b> ký tự.
          </div>`;
      }
      return '';
    },

    /* ------------------------------- MARKDOWN ------------------------------- */
    renderMarkdown(md) {
      let html = md;
      // Code blocks ```python ... ```  (Prism dùng class `language-xxx`)
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, body) => {
        const l = lang || 'python';
        return `<pre><code class="language-${l}">${escapeHtml(body.trimEnd())}</code></pre>`;
      });
      // Inline code
      html = html.replace(/`([^`\n]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
      // Headings
      html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      // Bold
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Tables (basic)
      html = html.replace(/((?:^\|[^\n]+\|\n?)+)/gm, (table) => {
        const lines = table.trim().split('\n');
        if (lines.length < 2) return table;
        const headerCells = lines[0].split('|').slice(1, -1).map(c => `<th>${c.trim()}</th>`).join('');
        const body = lines.slice(2).map(l => {
          const cells = l.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${headerCells}</tr></thead><tbody>${body}</tbody></table>`;
      });
      // Paragraphs (split by double newline)
      html = html.split(/\n\n+/).map(p => {
        if (p.trim().startsWith('<')) return p;
        if (p.trim().startsWith('- ') || /^\d+\./.test(p.trim())) {
          const ordered = /^\d+\./.test(p.trim());
          const items = p.split('\n').map(l => l.replace(/^(?:- |\d+\. )/, '').trim()).filter(Boolean);
          const tag = ordered ? 'ol' : 'ul';
          return `<${tag}>${items.map(i => `<li>${i}</li>`).join('')}</${tag}>`;
        }
        return `<p>${p.trim()}</p>`;
      }).join('\n');
      return html;
    },

    /* ------------------------------- TOAST ------------------------------- */
    showToast(msg) {
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
    },
  };

  // Bind handleTracerKeys now that UI is defined
  UI.handleTracerKeys = (e) => {
    if (!UI.stepState) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); UI.stepPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); UI.stepNext(); }
    else if (e.key === 'Escape') { UI.closeTracer(); }
  };

  window.UI = UI;
})();
