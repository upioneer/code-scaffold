#!/usr/bin/env python3
"""Pali bridge: headless BREP modeling via the Pali Ijo CLI.

Zero-dependency wrapper with the cad-tools bridge UX (status/measure/export/
run) plus an offline self-test. Mirrors the engine contract: exit 0 success,
1 command failed, 2 usage error. pali_ijo codes 64/65/66/70 map to 1 with
stderr preserved.

Usage:
    python scripts/pali_bridge.py status [--engine-path P]
    python scripts/pali_bridge.py measure FILE [--json]
    python scripts/pali_bridge.py export IN OUT [--in-place]
    python scripts/pali_bridge.py run --ops OPS.json [-o OUT.json]
    python scripts/pali_bridge.py --self-test
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

ENGINE_DEFAULT = "pali_ijo"
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


def run_engine(binary, args, runner=None, timeout=120, input_text=None):
    """Run the engine, returning CompletedProcess. Never raises on rc != 0."""
    def default_run(argv, **kwargs):
        return subprocess.run(
            argv, input=input_text, capture_output=True, text=True, **kwargs
        )

    run = runner or default_run
    try:
        return run([binary] + args, timeout=timeout)
    except FileNotFoundError:
        raise UsageError(f"engine binary not executable: {binary}")
    except subprocess.TimeoutExpired:
        raise EngineError(f"engine timed out after {timeout}s: {' '.join(args)}")


def check_result(proc, binary, args):
    """Raise EngineError when the engine reports failure, else return stdout."""
    if proc.returncode != 0:
        detail = (proc.stderr or "").strip() or f"exit {proc.returncode}"
        raise EngineError(f"{binary} {' '.join(args)} failed: {detail}")
    return proc.stdout or ""


def cmd_status(engine, runner=None):
    proc = run_engine(engine, ["--help"], runner=runner)
    out = check_result(proc, engine, ["--help"])
    head = out.strip().splitlines()[0] if out.strip() else "(no help text)"
    return f"engine: {engine}\n{head}\n"


def cmd_measure(engine, path, as_json, runner=None):
    if not os.path.isfile(path):
        raise UsageError(f"input file not found: {path}")
    args = ["measure", "--in", path] + (["--json"] if as_json else [])
    out = check_result(run_engine(engine, args, runner=runner), engine, args)
    if as_json:
        try:
            json.loads(out)
        except json.JSONDecodeError as exc:
            raise EngineError(f"engine returned invalid JSON: {exc}")
    return out if out.endswith("\n") else out + "\n"


def cmd_export(engine, src, dst, in_place, runner=None):
    if not os.path.isfile(src):
        raise UsageError(f"input file not found: {src}")
    if os.path.abspath(src) == os.path.abspath(dst) and not in_place:
        raise UsageError("output identical to input (pass --in-place to allow)")
    args = ["export", "--in", src, "--out", dst]
    check_result(run_engine(engine, args, runner=runner), engine, args)
    return f"wrote {dst}\n"


def load_ops_file(path):
    """Load {"ops": [{"cmd": str, "args": [str, ...]}, ...]}."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        raise UsageError(f"ops file not found: {path}")
    except json.JSONDecodeError as exc:
        raise UsageError(f"ops file is not valid JSON: {exc}")
    items = data.get("ops") if isinstance(data, dict) else None
    if not isinstance(items, list) or not items:
        raise UsageError('ops file must hold {"ops": [{cmd, args?}, ...]}')
    out = []
    for entry in items:
        if not isinstance(entry, dict) or not entry.get("cmd"):
            raise UsageError("each ops entry needs a 'cmd' string")
        args = entry.get("args", [])
        if not isinstance(args, list) or not all(isinstance(a, str) for a in args):
            raise UsageError(f"args for '{entry['cmd']}' must be a string list")
        out.append((entry["cmd"], args))
    return out


def cmd_run(engine, ops_path, out_path, runner=None):
    ops = load_ops_file(ops_path)
    doc = None
    for cmd, args in ops:
        proc = run_engine(engine, [cmd] + args, runner=runner, input_text=doc)
        doc = check_result(proc, engine, [cmd] + args)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(doc)
        return f"wrote {out_path}\n"
    return doc if doc.endswith("\n") else doc + "\n"


def build_parser():
    parser = argparse.ArgumentParser(prog="pali_bridge.py")
    parser.add_argument("--engine-path", default=None)
    parser.add_argument("--self-test", action="store_true")
    flag_parent = argparse.ArgumentParser(add_help=False)
    flag_parent.add_argument("--engine-path", default=argparse.SUPPRESS)
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("status", parents=[flag_parent])
    measure = sub.add_parser("measure", parents=[flag_parent])
    measure.add_argument("file")
    measure.add_argument("--json", action="store_true")
    export = sub.add_parser("export", parents=[flag_parent])
    export.add_argument("src")
    export.add_argument("dst")
    export.add_argument("--in-place", action="store_true")
    run = sub.add_parser("run", parents=[flag_parent])
    run.add_argument("--ops", required=True)
    run.add_argument("-o", "--out", default=None)
    return parser


def main(argv):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.self_test:
        return self_test()
    if not args.command:
        parser.print_help()
        return EXIT_USAGE
    try:
        engine = resolve_engine(args.engine_path)
        if args.command == "status":
            sys.stdout.write(cmd_status(engine))
        elif args.command == "measure":
            sys.stdout.write(cmd_measure(engine, args.file, args.json))
        elif args.command == "export":
            sys.stdout.write(cmd_export(engine, args.src, args.dst, args.in_place))
        elif args.command == "run":
            sys.stdout.write(cmd_run(engine, args.ops, args.out))
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return EXIT_USAGE
    except EngineError as exc:
        sys.stderr.write(f"engine error: {exc}\n")
        return EXIT_FAIL
    return EXIT_OK


class StubProc:
    def __init__(self, returncode=0, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def self_test():
    import tempfile

    passed = 0
    total = 0

    def check(label, cond):
        nonlocal passed, total
        total += 1
        if not cond:
            raise AssertionError("self test failed: " + label)
        passed += 1

    def expect_usage(label, func):
        try:
            func()
        except UsageError:
            check(label, True)
            return
        check(label, False)

    def expect_engine(label, func):
        try:
            func()
        except EngineError:
            check(label, True)
            return
        check(label, False)

    calls = []

    def stub(argv, timeout=None):
        calls.append(argv)
        if argv[1] == "--help":
            return StubProc(0, "pali_ijo 0.1.0 test stub\n")
        if argv[1] == "measure":
            return StubProc(0, '{"volume": 6000.0}\n')
        if argv[1] == "export":
            return StubProc(0, "")
        if argv[1] == "box":
            return StubProc(0, '{"kind": "brep", "name": "box"}\n')
        if argv[1] == "hollow":
            return StubProc(0, '{"kind": "brep", "name": "tray"}\n')
        return StubProc(70, "", "unknown command")

    out = cmd_status("pali_ijo", runner=stub)
    check("status prints engine path", "pali_ijo" in out)
    parsed = build_parser().parse_args(["status", "--engine-path", "X"])
    check("engine path parses after subcommand", parsed.engine_path == "X")
    parsed = build_parser().parse_args(["--engine-path", "Y", "status"])
    check("engine path parses before subcommand", parsed.engine_path == "Y")
    parsed = build_parser().parse_args(["measure", "f.json"])
    check("engine path defaults to none", parsed.engine_path is None)

    real_which = shutil.which
    shutil.which = lambda _name: None
    try:
        expect_usage("missing engine is usage error", lambda: resolve_engine(None))
    finally:
        shutil.which = real_which
    expect_usage(
        "missing explicit path is usage error",
        lambda: resolve_engine("/no/such/pali_ijo"),
    )

    with tempfile.TemporaryDirectory() as tmp:
        model = os.path.join(tmp, "part.json")
        with open(model, "w", encoding="utf-8") as fh:
            fh.write("{}")
        out = cmd_measure("pali_ijo", model, True, runner=stub)
        check("measure json passes through", '"volume"' in out)
        expect_usage(
            "measure missing file is usage error",
            lambda: cmd_measure("pali_ijo", os.path.join(tmp, "nope.json"), False, runner=stub),
        )
        check(
            "export writes note",
            cmd_export("pali_ijo", model, os.path.join(tmp, "p.stl"), False, runner=stub).startswith("wrote "),
        )
        expect_usage(
            "export identical paths refused",
            lambda: cmd_export("pali_ijo", model, model, False, runner=stub),
        )
        check(
            "export in place allowed",
            cmd_export("pali_ijo", model, model, True, runner=stub).startswith("wrote "),
        )
        ops_path = os.path.join(tmp, "ops.json")
        with open(ops_path, "w", encoding="utf-8") as fh:
            json.dump({"ops": [
                {"cmd": "box", "args": ["--size", "30,20,10"]},
                {"cmd": "hollow", "args": ["--thickness", "2"]},
            ]}, fh)
        calls.clear()
        doc_path = os.path.join(tmp, "tray.json")
        cmd_run("pali_ijo", ops_path, doc_path, runner=stub)
        with open(doc_path, "r", encoding="utf-8") as fh:
            check("run chains ops to file", '"tray"' in fh.read())
        check("run issued two engine calls", len(calls) == 2)
        bad_ops = os.path.join(tmp, "bad.json")
        with open(bad_ops, "w", encoding="utf-8") as fh:
            json.dump({"ops": []}, fh)
        expect_usage("empty ops rejected", lambda: cmd_run("pali_ijo", bad_ops, None, runner=stub))
        fail_ops = os.path.join(tmp, "fail.json")
        with open(fail_ops, "w", encoding="utf-8") as fh:
            json.dump({"ops": [{"cmd": "bogus"}]}, fh)
        expect_engine("engine failure surfaces", lambda: cmd_run("pali_ijo", fail_ops, None, runner=stub))

    def timeout_runner(argv, timeout=None):
        raise subprocess.TimeoutExpired(argv, timeout)

    expect_engine(
        "timeout is engine error",
        lambda: run_engine("pali_ijo", ["measure"], runner=timeout_runner, timeout=1),
    )

    print(f"SELF TEST PASSED ({passed}/{total})")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
