/* ==========================================================================
   Pyodide Runner — boot Python runtime + chạy code người dùng trong sandbox
   ========================================================================== */

(function () {
  const PyRunner = {
    pyodide: null,
    ready: false,
    bootError: null,

    async boot() {
      try {
        this.pyodide = await loadPyodide();
        this.ready = true;
        document.dispatchEvent(new CustomEvent('pyodide-ready'));
      } catch (err) {
        this.bootError = err.message || String(err);
        document.dispatchEvent(new CustomEvent('pyodide-error', { detail: this.bootError }));
      }
    },

    /**
     * Chạy code trong namespace sạch, capture stdout/stderr.
     * @returns {{stdout: string, error: string|null}}
     */
    async runCode(code) {
      if (!this.ready) return { stdout: '', error: 'Pyodide chưa sẵn sàng' };
      this.pyodide.globals.set('_user_code', code);
      this.pyodide.runPython(`
import sys, io
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
_user_ns = {"__name__": "__main__"}
_user_err = None
try:
    exec(compile(_user_code, '<user>', 'exec'), _user_ns)
except Exception as e:
    _user_err = f"{type(e).__name__}: {e}"
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
      // Dùng runPython để lấy primitive string thẳng, tránh PyProxy leak
      const stdout = this.pyodide.runPython('_buf.getvalue()');
      const error = this.pyodide.runPython('_user_err');
      return { stdout, error };
    },
  };

  window.PyRunner = PyRunner;
})();
