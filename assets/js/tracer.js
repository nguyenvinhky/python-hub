/* ==========================================================================
   Tracer — dùng sys.settrace để ghi snapshot từng dòng code người dùng
   Trả về mảng snapshots: [{line, vars, stdout, done?, error?}, ...]
   ========================================================================== */

(function () {
  const TRACER_PY = `
import sys, json, io, types

def _safe_repr(v, depth=0):
    if depth > 4:
        return {"type": "other", "value": "..."}
    if v is None:
        return {"type": "NoneType", "value": None}
    if isinstance(v, bool):
        return {"type": "bool", "value": v}
    if isinstance(v, int):
        return {"type": "int", "value": v}
    if isinstance(v, float):
        return {"type": "float", "value": v}
    if isinstance(v, str):
        return {"type": "str", "value": v}
    if isinstance(v, list):
        return {"type": "list", "value": [_safe_repr(x, depth+1) for x in v]}
    if isinstance(v, tuple):
        return {"type": "tuple", "value": [_safe_repr(x, depth+1) for x in v]}
    if isinstance(v, dict):
        return {"type": "dict", "value": [[str(k), _safe_repr(vv, depth+1)] for k, vv in v.items()]}
    if isinstance(v, (range, types.GeneratorType, types.ModuleType, type)):
        return None
    if callable(v):
        return None
    try:
        return {"type": "other", "value": repr(v)[:80]}
    except Exception:
        return {"type": "other", "value": "?"}

def _capture(globs):
    out = {}
    for k, v in list(globs.items()):
        if k.startswith("_"):
            continue
        r = _safe_repr(v)
        if r is not None:
            out[k] = r
    return out

_snapshots = []
_buf = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _buf
_user_ns = {"__name__": "__main__"}

try:
    _compiled = compile(_user_code, "<user>", "exec")
except Exception as e:
    sys.stdout = _old_stdout
    _result = json.dumps([{"error": f"Lỗi cú pháp: {e}"}])
else:
    def _tracer(frame, event, arg):
        if frame.f_code.co_filename != "<user>":
            return _tracer
        if event == "line":
            _snapshots.append({
                "line": frame.f_lineno,
                "vars": _capture(frame.f_locals if frame.f_locals is not frame.f_globals else frame.f_globals),
                "stdout": _buf.getvalue(),
            })
        return _tracer

    _err = None
    sys.settrace(_tracer)
    try:
        exec(_compiled, _user_ns)
    except Exception as e:
        _err = f"{type(e).__name__}: {e}"
    sys.settrace(None)
    sys.stdout = _old_stdout

    _snapshots.append({
        "line": -1,
        "vars": _capture(_user_ns),
        "stdout": _buf.getvalue(),
        "done": True,
        "error": _err,
    })
    _result = json.dumps(_snapshots)

_result
`;

  const Tracer = {
    async trace(code) {
      if (!window.PyRunner || !window.PyRunner.ready) {
        return [{ error: 'Pyodide chưa sẵn sàng' }];
      }
      const pyodide = window.PyRunner.pyodide;
      pyodide.globals.set('_user_code', code);
      try {
        const resultStr = await pyodide.runPythonAsync(TRACER_PY);
        return JSON.parse(resultStr);
      } catch (err) {
        return [{ error: 'Tracer lỗi: ' + (err.message || String(err)) }];
      }
    },
  };

  window.Tracer = Tracer;
})();
