/* ==========================================================================
   Test Runner — chạy test cases (function + stdout) và so khớp kết quả
   ========================================================================== */

(function () {
  /** Fuzzy match stdout: bỏ trailing whitespace + blank lines thừa */
  function normalizeStdout(s) {
    const lines = String(s || '').split('\n').map(l => l.replace(/[ \t\r]+$/, ''));
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }

  function fuzzyEqualStdout(a, b) {
    return normalizeStdout(a) === normalizeStdout(b);
  }

  const FUNCTION_TEST_PY = `
import sys, io, json, traceback
_buf = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _buf
_ns = {"__name__": "__main__"}
_code_err = None

try:
    exec(compile(_user_code, "<user>", "exec"), _ns)
except Exception as e:
    _code_err = f"{type(e).__name__}: {e}"

_func = _ns.get(_sig_name)
_tests = json.loads(_tests_json)
_results = []

def _safe(v, depth=0):
    if depth > 5: return "..."
    if v is None or isinstance(v, (bool, int, float, str)): return v
    if isinstance(v, (list, tuple)): return [_safe(x, depth+1) for x in v]
    if isinstance(v, dict): return {str(k): _safe(vv, depth+1) for k, vv in v.items()}
    try: return repr(v)[:120]
    except: return "?"

if _code_err:
    for t in _tests:
        _results.append({
            "name": t.get("name", ""),
            "status": "error",
            "message": _code_err,
            "input": t["input"],
            "expected": t["expected"],
        })
elif _func is None or not callable(_func):
    for t in _tests:
        _results.append({
            "name": t.get("name", ""),
            "status": "error",
            "message": f"Chưa định nghĩa hàm {_sig_name}(). Hãy viết 'def {_sig_name}(...)' trong code.",
            "input": t["input"],
            "expected": t["expected"],
        })
else:
    for t in _tests:
        try:
            _res = _func(*t["input"])
            _passed = _res == t["expected"]
            _results.append({
                "name": t.get("name", ""),
                "status": "pass" if _passed else "fail",
                "input": t["input"],
                "expected": t["expected"],
                "actual": _safe(_res),
            })
        except Exception as e:
            _results.append({
                "name": t.get("name", ""),
                "status": "error",
                "input": t["input"],
                "expected": t["expected"],
                "message": f"{type(e).__name__}: {e}",
            })

sys.stdout = _old_stdout
json.dumps(_results)
`;

  const TestRunner = {
    /**
     * Chạy tests function-based.
     * @returns {Array<{status, name, input, expected, actual?, message?}>}
     */
    async runFunctionTests(code, signature, tests) {
      if (!window.PyRunner || !window.PyRunner.ready) {
        return tests.map(t => ({
          ...t, status: 'error', message: 'Pyodide chưa sẵn sàng'
        }));
      }
      const pyodide = window.PyRunner.pyodide;
      pyodide.globals.set('_user_code', code);
      pyodide.globals.set('_sig_name', signature.name);
      pyodide.globals.set('_tests_json', JSON.stringify(tests));
      try {
        const resultStr = await pyodide.runPythonAsync(FUNCTION_TEST_PY);
        return JSON.parse(resultStr);
      } catch (err) {
        return tests.map(t => ({
          ...t, status: 'error', message: 'Test runner lỗi: ' + (err.message || String(err))
        }));
      }
    },

    /**
     * Chạy test stdout: so fuzzy stdout với expected.
     * @returns {{status, stdout, expected, error?}}
     */
    async runStdoutTest(code, expectedStdout) {
      const { stdout, error } = await window.PyRunner.runCode(code);
      if (error) return { status: 'error', stdout, expected: expectedStdout, message: error };
      const passed = fuzzyEqualStdout(stdout, expectedStdout);
      return {
        status: passed ? 'pass' : 'fail',
        stdout,
        expected: expectedStdout,
      };
    },

    fuzzyEqualStdout,
    normalizeStdout,
  };

  window.TestRunner = TestRunner;
})();
