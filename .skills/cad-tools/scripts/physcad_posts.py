#!/usr/bin/env python3
"""PhysCAD post advisor: offline machine to post lookup plus format matrix.

Zero-dependency reference tool with an offline self-test. Data reflects the
PhysCAD v0.9.6 published post library and interchange formats.

Usage:
    python scripts/physcad_posts.py list
    python scripts/physcad_posts.py recommend --machine <name>
    python scripts/physcad_posts.py formats
    python scripts/physcad_posts.py --self-test
"""

import argparse
import sys

EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2

POSTS = {
    "tormach": {"post": "PathPilot", "kind": "mill",
                "note": "Tormach mills running PathPilot control."},
    "haas": {"post": "Haas", "kind": "mill",
             "note": "Haas mills and lathes with Fanuc style control."},
    "linuxcnc": {"post": "LinuxCNC", "kind": "mill",
                 "note": "Open control on retrofits and scratch builds."},
    "mach3": {"post": "Mach3", "kind": "mill",
              "note": "Legacy parallel port era control, still common."},
    "mach4": {"post": "Mach4", "kind": "mill",
              "note": "Modern Mach series control with plugins."},
    "uccnc": {"post": "UCCNC", "kind": "mill",
              "note": "USB and Ethernet motion control software."},
    "masso": {"post": "MASSO", "kind": "mill",
              "note": "Standalone touch control, no PC at the machine."},
    "centroid": {"post": "Centroid CNC12", "kind": "mill",
                 "note": "Centroid Acorn and Oak retrofit control."},
    "brother": {"post": "Brother", "kind": "mill",
                "note": "Brother Speedio drill tap centers."},
    "carvera": {"post": "Makera Carvera", "kind": "mill",
                "note": "Desktop enclosed mill with tool changer."},
    "grbl": {"post": "GRBL", "kind": "mill",
             "note": "Open sender stack on hobby routers and mills."},
    "grblhal": {"post": "grblHAL with tool changer", "kind": "mill",
                "note": "32 bit GRBL generation with changer support."},
    "fanuc": {"post": "Generic Fanuc", "kind": "mill",
              "note": "Starting point for unlisted Fanuc style controls."},
    "firecontrol": {"post": "Langmuir FireControl", "kind": "plasma",
                    "note": "Langmuir plasma tables."},
    "linuxcnc-plasma": {"post": "LinuxCNC plasma", "kind": "plasma",
                        "note": "LinuxCNC with torch height control."},
    "mach-plasma": {"post": "Mach plasma", "kind": "plasma",
                    "note": "Mach series plasma screenset."},
    "grbl-laser": {"post": "GRBL lasers", "kind": "laser",
                   "note": "Diode and CO2 gantry lasers on GRBL."},
}

FORMATS_OPEN = ["STEP", "IGES", "STL", "OBJ", "3MF", "glTF", "Blender", "native"]
FORMATS_EXPORT = ["STEP", "STL", "3MF", "OBJ", "DXF", "SVG", "PDF", "G-code"]


class UsageError(Exception):
    pass


def cmd_list():
    lines = []
    for key in sorted(POSTS):
        entry = POSTS[key]
        lines.append(f"{key:16} {entry['post']:24} [{entry['kind']}]")
    return "\n".join(lines) + "\n"


def recommend(machine):
    """Return (key, entry) for a machine name, or raise UsageError."""
    want = machine.strip().lower()
    if want in POSTS:
        return want, POSTS[want]
    starts = [k for k in POSTS if k.startswith(want)]
    if len(starts) == 1:
        return starts[0], POSTS[starts[0]]
    hits = [k for k in POSTS if want in k]
    if len(hits) == 1:
        return hits[0], POSTS[hits[0]]
    if hits or starts:
        raise UsageError("ambiguous machine, candidates: " + ", ".join(sorted(set(starts + hits))))
    raise UsageError(f"unknown machine '{machine}' (see `list` for families)")


def cmd_recommend(machine):
    key, entry = recommend(machine)
    return f"{key} -> post {entry['post']} [{entry['kind']}]: {entry['note']}\n"


def cmd_formats():
    lines = ["Opens:  " + ", ".join(FORMATS_OPEN)]
    lines.append("Exports: " + ", ".join(FORMATS_EXPORT))
    lines.append("Notes: meshes convert to solids; faces export as DXF or SVG;")
    lines.append("flat patterns export as DXF; drawings print to PDF booklet.")
    return "\n".join(lines) + "\n"


def build_parser():
    parser = argparse.ArgumentParser(prog="physcad_posts.py")
    parser.add_argument("--self-test", action="store_true")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("list")
    recommend_parser = sub.add_parser("recommend")
    recommend_parser.add_argument("--machine", required=True)
    sub.add_parser("formats")
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
        if args.command == "list":
            sys.stdout.write(cmd_list())
        elif args.command == "recommend":
            sys.stdout.write(cmd_recommend(args.machine))
        elif args.command == "formats":
            sys.stdout.write(cmd_formats())
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return EXIT_USAGE
    return EXIT_OK


def self_test():
    passed = 0
    total = 0

    def check(label, cond):
        nonlocal passed, total
        total += 1
        if not cond:
            raise AssertionError("self test failed: " + label)
        passed += 1

    check("post table covers 15 plus families", len(POSTS) >= 15)
    check(
        "every entry has post kind note",
        all(set(e) >= {"post", "kind", "note"} for e in POSTS.values()),
    )
    kinds = {e["kind"] for e in POSTS.values()}
    check("mill plasma laser kinds present", kinds >= {"mill", "plasma", "laser"})

    _key, entry = recommend("tormach")
    check("tormach maps to PathPilot", entry["post"] == "PathPilot")
    _key, entry = recommend("HAAS")
    check("matching is case insensitive", entry["post"] == "Haas")
    _key, entry = recommend("grblhal")
    check("grblhal exact wins", "tool changer" in entry["post"].lower())
    try:
        recommend("no-such-machine")
        check("unknown machine raises", False)
    except UsageError:
        check("unknown machine raises", True)
    try:
        recommend("mach")
        check("ambiguous machine raises", False)
    except UsageError as exc:
        check("ambiguous machine lists candidates", "mach3" in str(exc))

    check("open matrix holds STEP and IGES", "STEP" in FORMATS_OPEN and "IGES" in FORMATS_OPEN)
    check("export matrix holds G-code", "G-code" in FORMATS_EXPORT)
    check("formats command renders", cmd_formats().startswith("Opens:"))

    print(f"SELF TEST PASSED ({passed}/{total})")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
