/* ==========================================================================
   Visualizer — render list/tuple/dict/str thành cell trực quan
   ========================================================================== */

(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function fmtPrim(v) {
    if (!v) return 'None';
    if (v.type === 'str') return `"${v.value}"`;
    if (v.type === 'NoneType') return 'None';
    if (v.type === 'bool') return v.value ? 'True' : 'False';
    if (v.type === 'list') return '[' + v.value.map(fmtPrim).join(', ') + ']';
    if (v.type === 'tuple') return '(' + v.value.map(fmtPrim).join(', ') + ')';
    if (v.type === 'dict') return '{' + v.value.map(([k, vv]) => `${k}: ${fmtPrim(vv)}`).join(', ') + '}';
    return String(v.value);
  }

  /** Render 1 biến thành HTML (gắn vào .var-row) */
  function renderVarBody(val) {
    if (!val) return '<em class="text-slate-500">None</em>';
    const t = val.type;

    if (t === 'list' || t === 'tuple') {
      const items = val.value;
      if (items.length === 0) return '<em class="text-slate-500 text-xs">(rỗng)</em>';
      const cells = items.map((v, i) => `
        <div class="flex flex-col items-center gap-1">
          <div class="cell cell-primary">${escapeHtml(fmtPrim(v))}</div>
          <div class="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">[${i}]</div>
          <div class="text-[10px] text-rose-500 font-mono">[${i - items.length}]</div>
        </div>`).join('');
      return `<div class="flex gap-1.5 flex-wrap">${cells}</div>
        <div class="text-[11px] text-slate-500 mt-2 font-mono">len = ${items.length}${t === 'tuple' ? ' · tuple' : ''}</div>`;
    }

    if (t === 'str') {
      const s = val.value;
      if (s.length === 0) return '<em class="text-slate-500 text-xs">(xâu rỗng)</em>';
      const chars = [...s];
      const cells = chars.map((c, i) => `
        <div class="char-cell">
          <div class="char-box ${c === ' ' ? 'space' : ''}">${c === ' ' ? '␣' : escapeHtml(c)}</div>
          <div class="char-idx">${i}</div>
        </div>`).join('');
      return `<div class="flex gap-0.5 flex-wrap">${cells}</div>
        <div class="text-[11px] text-slate-500 mt-2 font-mono">len = ${s.length}</div>`;
    }

    if (t === 'dict') {
      if (val.value.length === 0) return '<em class="text-slate-500 text-xs">{}</em>';
      const rows = val.value.map(([k, vv]) => `
        <tr>
          <td class="text-amber-600 dark:text-amber-400 font-mono text-xs py-1 pr-4">${escapeHtml(k)}</td>
          <td class="text-slate-400">→</td>
          <td class="text-emerald-600 dark:text-emerald-400 font-mono text-xs py-1 pl-4">${escapeHtml(fmtPrim(vv))}</td>
        </tr>`).join('');
      return `<table class="text-sm">${rows}</table>`;
    }

    return `<span class="font-mono text-sm text-amber-700 dark:text-amber-300">${escapeHtml(fmtPrim(val))}</span>`;
  }

  /** Render static array (dùng cho static visualization) */
  function renderStaticArray(items, highlights = []) {
    return `<div class="flex gap-1.5 flex-wrap">
      ${items.map((v, i) => `
        <div class="flex flex-col items-center gap-1">
          <div class="cell ${highlights.includes(i) ? 'cell-success' : 'cell-primary'}">${escapeHtml(String(v))}</div>
          <div class="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">[${i}]</div>
          <div class="text-[10px] text-rose-500 font-mono">[${i - items.length}]</div>
        </div>`).join('')}
    </div>`;
  }

  function renderStaticString(s, startEnd = null) {
    const chars = [...s];
    return `<div class="flex gap-0.5 flex-wrap">${chars.map((c, i) => {
      const inside = startEnd && i >= startEnd[0] && i < startEnd[1];
      return `<div class="char-cell">
        <div class="char-box ${inside ? 'highlight' : ''} ${c === ' ' ? 'space' : ''}">${c === ' ' ? '␣' : escapeHtml(c)}</div>
        <div class="char-idx">${i}</div>
      </div>`;
    }).join('')}</div>`;
  }

  window.Visualizer = { escapeHtml, fmtPrim, renderVarBody, renderStaticArray, renderStaticString };
})();
