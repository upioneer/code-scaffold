#!/usr/bin/env python3
"""Validate a Floorplan Architect room brief (offline).

Checks schema shape, dimension ranges, opening references, style and shot
names against templates.json. Estimated briefs validate structurally but
report that user dimension confirmation is still required.

Usage:
    python validate_brief.py --brief tour/brief.json [--templates templates.json]
    python validate_brief.py --self-test

Exit codes: 0 valid (or valid-but-unconfirmed), 1 invalid, 2 usage error.
"""

import argparse
import json
import os
import sys
import tempfile

ROOM_MIN, ROOM_MAX = 0.5, 40.0
WALL_MIN, WALL_MAX = 2.2, 6.0


class UsageError(Exception):
    pass


def load_json(path, label):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        raise UsageError(f"{label} not found: {path}")
    except json.JSONDecodeError as exc:
        raise UsageError(f"{label} is not valid JSON: {exc}")


def default_templates_path():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(os.path.dirname(here), "templates.json")


def validate_brief(brief, templates):
    """Return (errors, warnings). Pure function, no I/O."""
    errors, warnings = [], []
    if not isinstance(brief, dict):
        return ["brief root must be an object"], warnings
    if brief.get("version") != 1:
        errors.append("brief.version must be 1")
    if brief.get("units") != "m":
        errors.append('brief.units must be "m"')
    wall_h = brief.get("wallHeight")
    if not isinstance(wall_h, (int, float)) or not (WALL_MIN <= wall_h <= WALL_MAX):
        errors.append(f"wallHeight must be a number between {WALL_MIN} and {WALL_MAX}")

    rooms = brief.get("rooms")
    if not isinstance(rooms, list) or not rooms:
        errors.append("rooms must be a non-empty array")
        rooms = []
    seen, ids = set(), set()
    for i, room in enumerate(rooms):
        tag = f"rooms[{i}]"
        if not isinstance(room, dict):
            errors.append(f"{tag} must be an object")
            continue
        rid = room.get("id")
        if not rid or not isinstance(rid, str):
            errors.append(f"{tag}.id must be a non-empty string")
        elif rid in seen:
            errors.append(f"duplicate room id: {rid}")
        else:
            seen.add(rid)
            ids.add(rid)
        rect = room.get("rect")
        if (not isinstance(rect, list) or len(rect) != 4
                or not all(isinstance(v, (int, float)) for v in rect)):
            errors.append(f"{tag}.rect must be [x, y, width, depth] numbers")
            continue
        _, _, w, d = rect
        if not (ROOM_MIN <= w <= ROOM_MAX and ROOM_MIN <= d <= ROOM_MAX):
            errors.append(f"{tag}.rect width/depth must be between {ROOM_MIN} and {ROOM_MAX}")

    for i, opening in enumerate(brief.get("openings", [])):
        tag = f"openings[{i}]"
        if not isinstance(opening, dict):
            errors.append(f"{tag} must be an object")
            continue
        if opening.get("room") not in ids:
            errors.append(f"{tag} references unknown room: {opening.get('room')!r}")
        if opening.get("wall") not in ("north", "south", "east", "west"):
            errors.append(f"{tag}.wall must be north/south/east/west")
        for key in ("center", "width"):
            if not isinstance(opening.get(key), (int, float)):
                errors.append(f"{tag}.{key} must be a number")

    styles = (templates or {}).get("styles", {})
    if brief.get("style") not in styles:
        errors.append(f"style {brief.get('style')!r} is not in templates.json")
    lighting = (templates or {}).get("lighting", {})
    if brief.get("lighting") not in lighting:
        errors.append(f"lighting {brief.get('lighting')!r} is not in templates.json")
    known_shots = set((templates or {}).get("shots", [])) or {"orbit", "stills", "walkthrough"}
    for shot in brief.get("shots", []):
        if shot not in known_shots:
            errors.append(f"unknown shot: {shot!r}")

    if brief.get("estimated") is True:
        warnings.append("brief is estimated: user dimension confirmation required before build")
    return errors, warnings


def run_self_test():
    failures = []

    def check(name, cond, detail=""):
        if not cond:
            failures.append(f"{name}: {detail}")

    templates = {"styles": {"contemporary": {}}, "lighting": {"daylight": {}},
                 "shots": ["orbit", "stills", "walkthrough"]}
    good = {"version": 1, "units": "m", "wallHeight": 2.7, "style": "contemporary",
            "lighting": "daylight", "shots": ["orbit"],
            "rooms": [{"id": "living", "name": "Living", "rect": [0, 0, 5.2, 4.1]}],
            "openings": [{"room": "living", "wall": "north", "type": "window",
                          "center": 2.6, "width": 1.8, "sill": 0.9, "height": 1.4}]}
    errors, warnings = validate_brief(good, templates)
    check("valid", not errors, "; ".join(errors))

    bad_dims = dict(good, rooms=[{"id": "x", "rect": [0, 0, 0.1, 99]}])
    errors, _ = validate_brief(bad_dims, templates)
    check("bad-dims", any("rect" in e for e in errors), "; ".join(errors))

    bad_style = dict(good, style="nope")
    errors, _ = validate_brief(bad_style, templates)
    check("bad-style", any("style" in e for e in errors), "; ".join(errors))

    bad_open = dict(good, openings=[{"room": "ghost", "wall": "up", "center": 1, "width": 1}])
    errors, _ = validate_brief(bad_open, templates)
    check("bad-opening", len(errors) >= 2, "; ".join(errors))

    est = dict(good, estimated=True)
    errors, warnings = validate_brief(est, templates)
    check("estimated", not errors and any("confirmation" in w for w in warnings), "; ".join(warnings))

    with tempfile.TemporaryDirectory() as tmp:
        missing = os.path.join(tmp, "nope.json")
        try:
            load_json(missing, "brief")
            check("missing-file", False, "should have raised")
        except UsageError:
            pass

    if failures:
        for failure in failures:
            print(f"self-test failure: {failure}", file=sys.stderr)
        return 1
    print("self-test: 6 assertions, all passed")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(prog="validate_brief.py", description="Validate a room brief.")
    parser.add_argument("--brief", default=None)
    parser.add_argument("--templates", default=None)
    parser.add_argument("--self-test", action="store_true")
    ns = parser.parse_args(argv)
    if ns.self_test:
        return run_self_test()
    if not ns.brief:
        parser.print_usage(sys.stderr)
        return 2
    try:
        brief = load_json(ns.brief, "brief")
        templates = load_json(ns.templates or default_templates_path(), "templates")
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return 2
    errors, warnings = validate_brief(brief, templates)
    for error in errors:
        print(f"error: {error}", file=sys.stderr)
    for warning in warnings:
        print(f"warning: {warning}")
    if errors:
        print("brief: INVALID")
        return 1
    print("brief: VALID")
    return 0


if __name__ == "__main__":
    sys.exit(main())
