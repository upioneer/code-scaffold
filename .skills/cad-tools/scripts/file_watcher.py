#!/usr/bin/env python3
"""Generic file watcher: poll paths and run a command on change.

Zero-dependency fallback behind the native watcher surfaces in Section 24.
Polls mtime plus size fingerprints, coalesces bursts with a debounce window,
and logs one JSON line per rebuild. Exits 0 on clean stop, 1 on command
failure in --once mode, 2 on usage error.

Usage:
    python scripts/file_watcher.py watch PATH [PATH...] [--interval S] [--debounce S] [--once] [--timeout S] [--log FILE] -- COMMAND [ARGS...]
    python scripts/file_watcher.py --self-test
"""

import argparse
import json
import os
import subprocess
import sys
import time

EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2


class UsageError(Exception):
    pass


def fingerprint(path):
    """Return (mtime_ns, size) for a path, or None when it is absent."""
    try:
        stat = os.stat(path)
    except OSError:
        return None
    return (stat.st_mtime_ns, stat.st_size)


def scan(paths):
    """Fingerprint every path. Return {path: fingerprint}."""
    return {path: fingerprint(path) for path in paths}


def detect_changes(before, after):
    """Return sorted paths whose fingerprint appeared, vanished, or changed."""
    changed = []
    for path in after:
        if before.get(path) != after[path]:
            changed.append(path)
    return sorted(changed)


def watch(paths, command, interval=0.5, debounce=0.5, once=False,
          timeout=None, log_fh=None, runner=None, clock=None):
    """Poll until timeout. Return (events, last_rc)."""
    now = clock or time.time
    run = runner or (lambda cmd: subprocess.run(cmd).returncode)
    missing = [p for p in paths if fingerprint(p) is None]
    if missing:
        raise UsageError("watched path not found: " + ", ".join(missing))
    if not command:
        raise UsageError("no command after '--'")
    before = scan(paths)
    events = 0
    last_rc = 0
    last_fire = 0.0
    start = now()
    deadline = None if timeout is None else start + timeout
    while True:
        time.sleep(interval)
        after = scan(paths)
        changed = detect_changes(before, after)
        before = after
        if not changed:
            if deadline is not None and now() >= deadline:
                return events, last_rc
            continue
        if now() - last_fire < debounce and events > 0:
            if deadline is not None and now() >= deadline:
                return events, last_rc
            continue
        fired = now()
        t0 = now()
        last_rc = run(command)
        duration = now() - t0
        last_fire = fired
        events += 1
        if log_fh is not None:
            log_fh.write(json.dumps({
                "trigger": changed,
                "rc": last_rc,
                "duration_s": round(duration, 3),
            }) + "\n")
            log_fh.flush()
        if once:
            return events, last_rc
        if deadline is not None and now() >= deadline:
            return events, last_rc


def build_parser():
    parser = argparse.ArgumentParser(prog="file_watcher.py")
    parser.add_argument("--self-test", action="store_true")
    sub = parser.add_subparsers(dest="command")
    watch_parser = sub.add_parser("watch")
    watch_parser.add_argument("paths", nargs="+")
    watch_parser.add_argument("--interval", type=float, default=0.5)
    watch_parser.add_argument("--debounce", type=float, default=0.5)
    watch_parser.add_argument("--once", action="store_true")
    watch_parser.add_argument("--timeout", type=float, default=None)
    watch_parser.add_argument("--log", default=None)
    watch_parser.add_argument("command", nargs=argparse.REMAINDER)
    return parser


def main(argv):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.self_test:
        return self_test()
    if args.command != "watch":
        parser.print_help()
        return EXIT_USAGE
    command = [c for c in args.command if c != "--"]
    try:
        log_fh = open(args.log, "a", encoding="utf-8") if args.log else None
        try:
            _events, rc = watch(
                args.paths, command, interval=args.interval,
                debounce=args.debounce, once=args.once,
                timeout=args.timeout, log_fh=log_fh,
            )
        finally:
            if log_fh is not None:
                log_fh.close()
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return EXIT_USAGE
    if args.once and rc != 0:
        return EXIT_FAIL
    return EXIT_OK


def self_test():
    import tempfile
    import threading

    passed = 0
    total = 0

    def check(label, cond):
        nonlocal passed, total
        total += 1
        if not cond:
            raise AssertionError("self test failed: " + label)
        passed += 1

    with tempfile.TemporaryDirectory() as tmp:
        target = os.path.join(tmp, "part.json")
        with open(target, "w", encoding="utf-8") as fh:
            fh.write("{}")

        calls = []

        def runner(cmd):
            calls.append(cmd)
            return 0

        def run_watch(**kwargs):
            box = {}
            thread = threading.Thread(
                target=lambda: box.update(result=watch(
                    [target], ["rebuild"], runner=runner, **kwargs)))
            thread.start()
            return thread, box

        thread, _box = run_watch(interval=0.02, debounce=0.0, timeout=0.6)
        time.sleep(0.1)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write('{"v": 1}')
        thread.join(timeout=5)
        check("modification fires the command", calls == [["rebuild"]])

        calls.clear()
        thread, _box = run_watch(interval=0.02, debounce=0.4, timeout=0.8)
        time.sleep(0.1)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write('{"v": 2}')
        time.sleep(0.05)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write('{"v": 3}')
        thread.join(timeout=5)
        check("debounce coalesces bursts", calls == [["rebuild"]])

        calls.clear()
        thread, _box = run_watch(interval=0.02, debounce=0.0, timeout=0.25)
        thread.join(timeout=5)
        check("silence on no change", calls == [])

        calls.clear()
        fresh = os.path.join(tmp, "fresh.txt")
        with open(fresh, "w", encoding="utf-8") as fh:
            fh.write("x")
        thread, _box = run_watch(interval=0.02, debounce=0.0, timeout=0.6)
        time.sleep(0.1)
        os.remove(fresh)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write('{"v": 4}')
        thread.join(timeout=5)
        check("change still fires once per window", len(calls) == 1)

        log_lines = []
        import io as _io

        def failing_runner(cmd):
            calls.append(cmd)
            return 3

        buf = _io.StringIO()
        thread = threading.Thread(
            target=lambda: watch([target], ["bad"], runner=failing_runner,
                                 interval=0.02, debounce=0.0, timeout=0.5,
                                 log_fh=buf))
        thread.start()
        time.sleep(0.1)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write('{"v": 5}')
        thread.join(timeout=5)
        log_lines = [ln for ln in buf.getvalue().splitlines() if ln.strip()]
        check("failure is logged with rc", len(log_lines) == 1
              and json.loads(log_lines[0])["rc"] == 3)
        check("log names the trigger",
              json.loads(log_lines[0])["trigger"] == [target])

        try:
            watch([os.path.join(tmp, "nope.txt")], ["x"], timeout=0.1)
            check("missing path raises", False)
        except UsageError:
            check("missing path raises", True)
        try:
            watch([target], [], timeout=0.1)
            check("empty command raises", False)
        except UsageError:
            check("empty command raises", True)

    print(f"SELF TEST PASSED ({passed}/{total})")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
