#!/usr/bin/env python3
"""Probe the render environment: Blender, ffmpeg, versions (offline).

Reports presence and versions as JSON. Always exits 0; consumers check
the "ready" flag instead of the exit code.

Usage:
    python probe_render_env.py [--json] [--self-test]
"""

import argparse
import json
import shutil
import subprocess
import sys


def which_or_none(binary):
    return shutil.which(binary)


def version_line(binary, args, timeout=30):
    try:
        proc = subprocess.run([binary] + args, capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    text = (proc.stdout or proc.stderr or "").strip()
    return text.splitlines()[0] if text else None


def probe():
    blender = which_or_none("blender")
    ffmpeg = which_or_none("ffmpeg")
    report = {
        "blender": {"present": bool(blender), "path": blender,
                    "version": version_line(blender, ["--version"]) if blender else None},
        "ffmpeg": {"present": bool(ffmpeg), "path": ffmpeg,
                   "version": version_line(ffmpeg, ["-version"]) if ffmpeg else None},
        "python": {"present": True, "version": sys.version.split()[0]},
    }
    report["ready"] = bool(blender) and bool(ffmpeg)
    if not report["ready"]:
        missing = [k for k in ("blender", "ffmpeg") if not report[k]["present"]]
        report["nextAction"] = f"install missing render tools: {', '.join(missing)}"
    return report


def run_self_test():
    failures = []

    def check(name, cond, detail=""):
        if not cond:
            failures.append(f"{name}: {detail}")

    report = probe()
    check("shape", set(report) >= {"blender", "ffmpeg", "python", "ready"}, str(sorted(report)))
    check("ready-type", isinstance(report["ready"], bool), str(report["ready"]))
    check("self-path", report["python"]["version"] == sys.version.split()[0], str(report["python"]))
    missing = version_line("/nonexistent-binary-xyz", ["--version"], timeout=5)
    check("missing-binary", missing is None, str(missing))

    if failures:
        for failure in failures:
            print(f"self-test failure: {failure}", file=sys.stderr)
        return 1
    print("self-test: 4 assertions, all passed")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(prog="probe_render_env.py", description="Probe Blender/ffmpeg presence.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    ns = parser.parse_args(argv)
    if ns.self_test:
        return run_self_test()
    report = probe()
    if ns.json:
        print(json.dumps(report, indent=2))
    else:
        for key in ("blender", "ffmpeg", "python"):
            entry = report[key]
            state = entry["version"] or ("found at " + entry["path"] if entry["present"] else "MISSING")
            print(f"{key}: {state}")
        print("render environment: READY" if report["ready"] else f"render environment: NOT READY ({report['nextAction']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
