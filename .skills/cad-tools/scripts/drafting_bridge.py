#!/usr/bin/env python3
"""Drafting bridge: headless 2D drafting via cadcraft-cli.

Zero-dependency CLI wrapper with the cad-tools bridge UX (status/info/run/
convert/render/audit) plus an offline self-test. Mirrors the engine contract:
exit 0 success, 1 command failed, 2 usage error.

Usage:
    python scripts/drafting_bridge.py status [--engine-path P]
    python scripts/drafting_bridge.py info FILE [--json]
    python scripts/drafting_bridge.py run FILE --commands CMDS.json -o OUT [--export PNG] [--script-file S]
    python scripts/drafting_bridge.py convert IN OUT [--in-place]
    python scripts/drafting_bridge.py render FILE -o PNG [--window=x0,y0,x1,y1]
    python scripts/drafting_bridge.py audit FILE [--json] [--deep]
    python scripts/drafting_bridge.py --self-test
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

ENGINE_DEFAULT = "cadcraft-cli"
EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2


class UsageError(Exception):
    pass


class EngineError(Exception):
    pass


def resolve_engine(engine_path):
    """Return an executable engine path or raise UsageError."""
    if engine_path:
        if not os.path.isfile(engine_path):
            raise UsageError(f"engine binary not found: {engine_path}")
        return engine_path
    candidate = shutil.which(ENGINE_DEFAULT)
    if not candidate:
        raise UsageError(
            f"engine binary '{ENGINE_DEFAULT}' not found on PATH "
            "(pass --engine-path to point at an install)"
        )
    return candidate


def run_engine(binary, args, runner=None, timeout=120):
    """Run the engine, returning CompletedProcess. Never raises on rc != 0."""
    run = runner or (lambda a, **k: subprocess.run(a, capture_output=True, text=True, **k))
    try:
        return run([binary] + args, timeout=timeout)
    except FileNotFoundError:
        raise UsageError(f"engine binary not executable: {binary}")
    except subprocess.TimeoutExpired:
        raise EngineError(f"engine timed out after {timeout}s: {' '.join(args)}")


def parse_window(value):
    """Validate '--window=x0,y0,x1,y1' into a float quad."""
    try:
        parts = [float(p) for p in value.split(",")]
    except ValueError:
        raise UsageError(f"malformed --window (want x0,y0,x1,y1): {value!r}")
    if len(parts) != 4:
        raise UsageError(f"malformed --window (want x0,y0,x1,y1): {value!r}")
    return parts


def load_commands_file(path):
    """Load {"commands": [{"id": str, "params": {...}}, ...]}."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        raise UsageError(f"commands file not found: {path}")
    except json.JSONDecodeError as exc:
        raise UsageError(f"commands file is not valid JSON: {exc}")
    items = data.get("commands") if isinstance(data, dict) else None
    if not isinstance(items, list) or not items:
        raise UsageError('commands file must hold {"commands": [{id, params?}, ...]}')
    out = []
    for entry in items:
        if not isinstance(entry, dict) or not entry.get("id"):
            raise UsageError("each commands entry needs an 'id' string")
        params = entry.get("params", {})
        if not isinstance(params, dict):
            raise UsageError(f"params for '{entry['id']}' must be an object")
        out.append((entry["id"], params))
    return out


def triage_inspect(data):
    """Turn inspect/info JSON into audit findings (pure, offline)."""
    findings = []
    if not isinstance(data, dict):
        return [{"level": "error", "message": "inspect payload is not an object"}]
    counts = data.get("counts", {})
    findings.append({
        "level": "info",
        "message": f"entities={counts.get('entities', '?')} layers={counts.get('layers', '?')} "
                   f"blocks={counts.get('blocks', '?')} layouts={counts.get('layouts', '?')}",
    })
    skipped = data.get("skipped", [])
    if isinstance(skipped, list):
        for record in skipped:
            findings.append({"level": "warning", "message": f"skipped on read: {record}"})
    notes = data.get("readNotes", [])
    if isinstance(notes, list):
        for note in notes:
            findings.append({"level": "warning", "message": f"read note: {note}"})
    extents = data.get("extents")
    if extents is None:
        findings.append({"level": "warning", "message": "no extents reported (empty drawing?)"})
    return findings


def cmd_status(ns, runner=None):
    try:
        binary = resolve_engine(ns.engine_path)
    except UsageError as exc:
        print(json.dumps({"present": False, "error": str(exc)}))
        return EXIT_FAIL
    proc = run_engine(binary, ["--version"], runner=runner, timeout=ns.timeout)
    version = (proc.stdout or proc.stderr or "").strip().splitlines()
    print(json.dumps({
        "present": True,
        "path": binary,
        "version": version[0] if version else "unknown",
        "probed": proc.returncode == 0,
    }))
    return EXIT_OK


def cmd_info(ns, runner=None):
    binary = resolve_engine(ns.engine_path)
    proc = run_engine(binary, ["info", ns.file], runner=runner, timeout=ns.timeout)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr or f"info failed for {ns.file}\n")
        return EXIT_FAIL
    if ns.json:
        try:
            print(json.dumps(json.loads(proc.stdout)))
        except json.JSONDecodeError:
            sys.stderr.write("engine info output is not JSON\n")
            return EXIT_FAIL
    else:
        sys.stdout.write(proc.stdout)
    return EXIT_OK


def cmd_run(ns, runner=None):
    binary = resolve_engine(ns.engine_path)
    args = ["run", ns.file]
    if ns.script_file:
        args += ["--script-file", ns.script_file]
    if ns.commands:
        for cmd_id, params in load_commands_file(ns.commands):
            args += ["--cmd", f"{cmd_id} {json.dumps(params, separators=(',', ':'))}"]
    if not ns.script_file and not ns.commands:
        raise UsageError("run needs --commands CMDS.json and/or --script-file S")
    args += ["--save", ns.output]
    if ns.export:
        args += ["--export", ns.export]
    proc = run_engine(binary, args, runner=runner, timeout=ns.timeout)
    sys.stdout.write(proc.stdout or "")
    if proc.stderr:
        sys.stderr.write(proc.stderr)
    return EXIT_OK if proc.returncode == 0 else EXIT_FAIL


def cmd_convert(ns, runner=None):
    binary = resolve_engine(ns.engine_path)
    if os.path.abspath(ns.input) == os.path.abspath(ns.output) and not ns.in_place:
        raise UsageError("refusing to overwrite the input (pass --in-place to allow)")
    args = ["convert", ns.input, ns.output]
    if ns.in_place:
        args.append("--in-place")
    proc = run_engine(binary, args, runner=runner, timeout=ns.timeout)
    if proc.stderr:
        sys.stderr.write(proc.stderr)
    return EXIT_OK if proc.returncode == 0 else EXIT_FAIL


def cmd_render(ns, runner=None):
    binary = resolve_engine(ns.engine_path)
    args = ["run", ns.file, "--export", ns.output]
    if ns.window:
        parse_window(ns.window)  # validate client side; engine revalidates
        args += [f"--window={ns.window}"]
    proc = run_engine(binary, args, runner=runner, timeout=ns.timeout)
    if proc.stderr:
        sys.stderr.write(proc.stderr)
    return EXIT_OK if proc.returncode == 0 else EXIT_FAIL


def cmd_audit(ns, runner=None):
    binary = resolve_engine(ns.engine_path)
    proc = run_engine(binary, ["info", ns.file], runner=runner, timeout=ns.timeout)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr or f"audit info failed for {ns.file}\n")
        return EXIT_FAIL
    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError:
        sys.stderr.write("engine info output is not JSON\n")
        return EXIT_FAIL
    report = {"file": ns.file, "findings": triage_inspect(data), "deep": {"available": False}}
    if ns.deep:
        usage = run_engine(binary, ["run", ns.file, "--cmd", "usage {}"], runner=runner, timeout=ns.timeout)
        if usage.returncode == 0 and usage.stdout.strip():
            try:
                report["deep"] = {"available": True, "usage": json.loads(usage.stdout.splitlines()[0])}
            except (json.JSONDecodeError, IndexError):
                report["deep"] = {"available": False, "reason": "usage output is not JSON"}
        else:
            report["deep"] = {"available": False, "reason": (usage.stderr or "usage command failed").strip()}
    if ns.json:
        print(json.dumps(report, indent=2))
    else:
        for finding in report["findings"]:
            print(f"{finding['level']}: {finding['message']}")
        deep = report["deep"]
        if deep.get("available"):
            unused = (deep.get("usage", {}) or {}).get("unused", "?")
            print(f"info: purge preview unused={unused}")
        else:
            print(f"info: deep usage unavailable ({deep.get('reason', 'n/a')})")
    return EXIT_OK


def build_parser():
    parser = argparse.ArgumentParser(prog="drafting_bridge.py", description="Headless 2D drafting bridge (cadcraft-cli).")
    parser.add_argument("--engine-path", default=None, help="engine binary (default: cadcraft-cli on PATH)")
    parser.add_argument("--timeout", type=int, default=120, help="per-command timeout in seconds")
    parser.add_argument("--self-test", action="store_true", help="run offline self-test fixtures")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("status", help="report engine presence and version")
    p_info = sub.add_parser("info", help="summarize a drawing as JSON")
    p_info.add_argument("file")
    p_info.add_argument("--json", action="store_true")
    p_run = sub.add_parser("run", help="run commands/scripts and save")
    p_run.add_argument("file")
    p_run.add_argument("--commands", default=None, help="JSON command file {commands:[{id,params}]}")
    p_run.add_argument("--script-file", default=None)
    p_run.add_argument("-o", "--output", required=True)
    p_run.add_argument("--export", default=None)
    p_convert = sub.add_parser("convert", help="convert across interchange formats")
    p_convert.add_argument("input")
    p_convert.add_argument("output")
    p_convert.add_argument("--in-place", action="store_true")
    p_render = sub.add_parser("render", help="export a viewport PNG snapshot")
    p_render.add_argument("file")
    p_render.add_argument("-o", "--output", required=True)
    p_render.add_argument("--window", default=None, help="x0,y0,x1,y1")
    p_audit = sub.add_parser("audit", help="inspect drawing and triage losses")
    p_audit.add_argument("file")
    p_audit.add_argument("--json", action="store_true")
    p_audit.add_argument("--deep", action="store_true", help="also query usage/PURGE preview")
    return parser


def run_self_test():
    """Offline fixtures: no engine binary required."""
    failures = []

    def check(name, cond, detail=""):
        if not cond:
            failures.append(f"{name}: {detail}")

    # Window validation
    try:
        check("window-ok", parse_window("0,0,10,10") == [0.0, 0.0, 10.0, 10.0])
        parse_window("0,0,10")
        check("window-short", False, "should have raised")
    except UsageError:
        pass
    try:
        parse_window("a,b,c,d")
        check("window-alpha", False, "should have raised")
    except UsageError:
        pass

    # Commands file parsing
    with tempfile.TemporaryDirectory() as tmp:
        good = os.path.join(tmp, "cmds.json")
        with open(good, "w", encoding="utf-8") as fh:
            json.dump({"commands": [{"id": "zoom", "params": {"mode": "extents"}}, {"id": "save"}]}, fh)
        try:
            items = load_commands_file(good)
            check("cmds-ok", items == [("zoom", {"mode": "extents"}), ("save", {})], str(items))
        except UsageError as exc:
            check("cmds-ok", False, str(exc))
        bad = os.path.join(tmp, "bad.json")
        with open(bad, "w", encoding="utf-8") as fh:
            fh.write("{not json")
        try:
            load_commands_file(bad)
            check("cmds-malformed", False, "should have raised")
        except UsageError:
            pass
        try:
            load_commands_file(os.path.join(tmp, "missing.json"))
            check("cmds-missing", False, "should have raised")
        except UsageError:
            pass

    # Audit triage pure function
    findings = triage_inspect({"counts": {"entities": 3}, "skipped": ["ACAD_PROXY"], "readNotes": ["code page guess"]})
    text = " ".join(f["message"] for f in findings)
    check("triage", "ACAD_PROXY" in text and "code page guess" in text and "entities=3" in text, text)

    # Missing binary path (no engine needed)
    try:
        resolve_engine("/nonexistent/drafting-engine-xyz")
        check("missing-binary", False, "should have raised")
    except UsageError:
        pass

    # Full run path against a stubbed engine runner
    calls = []

    def fake_runner(argv, **kwargs):
        calls.append(argv)
        class Proc:
            returncode = 0
            stdout = '{"ok": true}\n'
            stderr = ""
        return Proc()

    ns = argparse.Namespace(engine_path=sys.executable, file="in.dxf", script_file=None,
                            commands=None, output="out.dxf", export=None, timeout=5)
    with tempfile.TemporaryDirectory() as tmp:
        cmds = os.path.join(tmp, "c.json")
        with open(cmds, "w", encoding="utf-8") as fh:
            json.dump({"commands": [{"id": "zoom", "params": {}}]}, fh)
        ns.commands = cmds
        rc = cmd_run(ns, runner=fake_runner)
        check("run-stub", rc == EXIT_OK and any(a == "--save" for a in calls[0]), str(calls))

    if failures:
        for failure in failures:
            print(f"self-test failure: {failure}", file=sys.stderr)
        return EXIT_FAIL
    print("self-test: 10 assertions, all passed")
    return EXIT_OK


def main(argv=None):
    parser = build_parser()
    ns = parser.parse_args(argv)
    if ns.self_test:
        return run_self_test()
    handlers = {
        "status": cmd_status,
        "info": cmd_info,
        "run": cmd_run,
        "convert": cmd_convert,
        "render": cmd_render,
        "audit": cmd_audit,
    }
    if ns.command not in handlers:
        parser.print_usage(sys.stderr)
        return EXIT_USAGE
    try:
        return handlers[ns.command](ns)
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return EXIT_USAGE
    except EngineError as exc:
        sys.stderr.write(f"engine error: {exc}\n")
        return EXIT_FAIL


if __name__ == "__main__":
    sys.exit(main())
