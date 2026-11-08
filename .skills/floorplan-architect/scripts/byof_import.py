#!/usr/bin/env python3
"""BYOF importer: source-app exports into Floorplan Architect briefs (offline).

Registry of supported floorplan apps over shared stdlib parsers (DXF/SVG).
Vector sources build measured briefs; raster sources emit estimated stubs
that require --accept-estimated plus user dimension confirmation.

Usage:
    python byof_import.py --list-sources
    python byof_import.py --source magicplan --format dxf --input plan.dxf -o tour/brief.json
    python byof_import.py --source roomsketcher --format png --input plan.png -o tour/brief.json --accept-estimated
    python byof_import.py --self-test

Exit codes: 0 ok, 1 failed, 2 usage error.
"""

import argparse
import json
import math
import os
import re
import sys
import tempfile
import xml.etree.ElementTree as ET

SOURCES = {
    "magicplan": {
        "label": "MagicPlan",
        "formats": ["dxf", "svg", "png", "jpg", "pdf"],
        "preferred": "dxf",
        "tier": "measured",
        "testedAgainst": "help center export list (DXF/SVG/CSV/PDF/JPG/PNG/OBJ/USDZ)",
        "notes": "CSV measurement import refused until column layout is verified; OBJ/USDZ feed mesh massing, not the brief.",
    },
    "roomsketcher": {
        "label": "RoomSketcher",
        "formats": ["png", "jpg", "pdf"],
        "preferred": "png",
        "tier": "estimated",
        "testedAgainst": "help center (JPG/PNG/PDF only, no CAD formats)",
        "notes": "No CAD export exists; every brief from this app needs dimension confirmation.",
    },
    "live-home-3d": {
        "label": "Live Home 3D",
        "formats": ["pdf", "png", "jpg", "tiff", "bmp", "obj", "fbx", "gltf", "usdz"],
        "preferred": "png",
        "tier": "estimated",
        "testedAgainst": "vendor export list (2D plans PDF/images; 3D meshes OBJ/FBX/glTF/USDZ; no DXF)",
        "notes": "Plan path is raster with confirmation; mesh exports feed the massing track.",
    },
    "floorplanner": {
        "label": "Floorplanner",
        "formats": ["dxf", "svg", "png", "jpg", "pdf"],
        "preferred": "dxf",
        "tier": "measured",
        "testedAgainst": "API export enum (jpg/png/pdf/dxf/svg) plus editor manuals",
        "notes": "File based only in v1; FML XML parsing and API calling are stretches.",
    },
    "planner-5d": {
        "label": "Planner 5D",
        "formats": ["dxf", "dwg", "png", "jpg", "pdf"],
        "preferred": "dxf",
        "tier": "measured",
        "testedAgainst": "vendor Export to CAD page (DWG/DXF; tier gating confirmed at execution)",
        "notes": "DWG routes through generic CAD conversion before this importer.",
    },
    "home-design-3d": {
        "label": "Home Design 3D",
        "formats": ["dxf", "jpg", "pdf", "png"],
        "preferred": "dxf",
        "tier": "measured",
        "testedAgainst": "vendor store copy (blueprints JPEG/PDF plus DXF 2D/3D); confirm installed build on first use",
        "notes": "Record the installed build confirmation in tour/source-notes.md.",
    },
    "sweet-home-3d": {
        "label": "Sweet Home 3D",
        "formats": ["svg", "pdf", "png", "obj"],
        "preferred": "svg",
        "tier": "measured",
        "testedAgainst": "vendor docs consensus (SVG plan, OBJ 3D, PDF/PNG stills)",
        "notes": "OBJ feeds the massing track; no CAD export exists.",
    },
    "generic": {
        "label": "Generic CAD/Image",
        "formats": ["dxf", "svg", "png", "jpg", "pdf"],
        "preferred": "dxf",
        "tier": "measured",
        "testedAgainst": "interchange standards (Revit/ArchiCAD/Chief Architect/SketchUp/AutoCAD via DXF/PDF)",
        "notes": "Pro tools land here with no per-app code; record first use in tour/source-notes.md.",
    },
}

RASTER_FORMATS = {"png", "jpg", "jpeg", "bmp", "tiff", "tif", "gif", "pdf"}
VECTOR_FORMATS = {"dxf", "svg"}


class UsageError(Exception):
    pass


def parse_dxf_rooms(path):
    """Minimal 2D DXF scan: closed LWPOLYLINE loops become rooms.

    Returns (rooms, warnings). Coordinates pass through in file units;
    callers apply scale after the confirmation protocol.
    """
    try:
        with open(path, "r", encoding="utf-8", errors="replace", newline="") as fh:
            text = fh.read().replace("\r\n", "\n").replace("\r", "\n")
    except FileNotFoundError:
        raise UsageError(f"input not found: {path}")
    rooms, warnings = [], []
    entities = text.split("LWPOLYLINE")
    for idx, chunk in enumerate(entities[1:], start=1):
        head = chunk.split("\n0\n", 1)[0]
        if len(head.strip()) < 10:
            continue
        codes = re.findall(r"^\s*(\d+)\s*$\s*^\s*([^\r\n]+?)\s*$", head, re.M)
        xs = [float(v) for c, v in codes if c == "10" and _is_num(v)]
        ys = [float(v) for c, v in codes if c == "20" and _is_num(v)]
        if len(xs) < 3 or len(xs) != len(ys):
            warnings.append(f"skipped polyline {idx}: fewer than 3 vertices")
            continue
        flag_closed = any(int(float(v)) & 1 for c, v in codes if c == "70" and _is_num(v))
        ends_closed = math.isclose(xs[0], xs[-1]) and math.isclose(ys[0], ys[-1])
        closed = flag_closed or ends_closed
        if not closed:
            warnings.append(f"skipped polyline {idx}: not closed")
            continue
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
        rooms.append({"id": f"room{idx}", "name": f"Room {idx}",
                      "rect": [round(x0, 3), round(y0, 3), round(x1 - x0, 3), round(y1 - y0, 3)]})
    lines = len(re.findall(r"(?m)^\s*LINE\s*$", text))
    if lines:
        warnings.append(f"{lines} LINE entities ignored (loops only in v1)")
    return rooms, warnings


def _is_num(value):
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def _local(tag):
    return tag.rsplit("}", 1)[-1]


def parse_svg_rooms(path):
    """Minimal SVG scan: rect/line/polyline/polygon shapes become rooms."""
    try:
        tree = ET.parse(path)
    except FileNotFoundError:
        raise UsageError(f"input not found: {path}")
    except ET.ParseError as exc:
        raise UsageError(f"SVG is not well formed XML: {exc}")
    rooms, warnings, idx = [], [], 0

    def add_rect(x, y, w, h):
        nonlocal idx
        try:
            x, y, w, h = float(x), float(y), float(w), float(h)
        except (TypeError, ValueError):
            return
        if w <= 0 or h <= 0:
            return
        idx += 1
        rooms.append({"id": f"room{idx}", "name": f"Room {idx}",
                      "rect": [round(x, 3), round(y, 3), round(w, 3), round(h, 3)]})

    for el in tree.iter():
        kind = _local(el.tag)
        if kind == "rect":
            add_rect(el.get("x", 0), el.get("y", 0), el.get("width", 0), el.get("height", 0))
        elif kind in ("line", "polyline", "polygon"):
            warnings.append(f"<{kind}> shapes need manual tracing in v1")
            break
    if tree.getroot() is not None and _local(tree.getroot().tag) != "svg":
        warnings.append("root element is not <svg>; treated as plain shapes")
    return rooms, warnings


def build_brief(source, fmt, rooms, input_path, estimated, warnings):
    return {
        "version": 1,
        "units": "m",
        "wallHeight": 2.7,
        "style": "contemporary",
        "lighting": "daylight",
        "rooms": rooms,
        "openings": [],
        "shots": ["orbit", "stills", "walkthrough"],
        "estimated": estimated,
        "source": {"app": source, "format": fmt, "file": os.path.basename(input_path)},
        "importWarnings": warnings,
    }


def import_file(source, fmt, input_path, accept_estimated=False):
    """Run one registered import. Returns (brief, report)."""
    entry = SOURCES.get(source)
    if entry is None:
        raise UsageError(f"unknown source: {source} (see --list-sources)")
    fmt = fmt.lower()
    if fmt not in entry["formats"]:
        raise UsageError(f"{entry['label']} does not export {fmt} (knows: {', '.join(entry['formats'])})")
    if fmt == "csv":
        raise UsageError("CSV import is experimental-gated: column layout unverified; confirm values manually")
    if fmt in RASTER_FORMATS:
        if not os.path.isfile(input_path):
            raise UsageError(f"input not found: {input_path}")
        if not accept_estimated:
            raise UsageError("raster input needs --accept-estimated plus user dimension confirmation")
        brief = build_brief(source, fmt, [], input_path, True,
                            ["raster source: draft rooms from the image, then confirm every dimension"])
        return brief, {"tier": "estimated", "rooms": 0, "confirmationRequired": True}
    if fmt == "dxf":
        rooms, warnings = parse_dxf_rooms(input_path)
    elif fmt == "svg":
        rooms, warnings = parse_svg_rooms(input_path)
    else:
        raise UsageError(f"no parser for format: {fmt}")
    if not rooms:
        raise UsageError(f"no closed room loops found in {input_path}")
    return build_brief(source, fmt, rooms, input_path, False, warnings), \
        {"tier": "measured", "rooms": len(rooms), "confirmationRequired": False}


def run_self_test():
    failures = []

    def check(name, cond, detail=""):
        if not cond:
            failures.append(f"{name}: {detail}")

    check("registry-size", len(SOURCES) == 8, str(sorted(SOURCES)))
    for key, entry in SOURCES.items():
        check(f"registry-{key}",
              entry["preferred"] in entry["formats"] and entry["tier"] in ("measured", "estimated"),
              str(entry))

    with tempfile.TemporaryDirectory() as tmp:
        dxf = os.path.join(tmp, "plan.dxf")
        with open(dxf, "w", encoding="utf-8") as fh:
            fh.write("0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n"
                     "10\n0.0\n20\n0.0\n10\n5.0\n20\n0.0\n10\n5.0\n20\n4.0\n10\n0.0\n20\n4.0\n"
                     "0\nENDSEC\n0\nEOF\n")
        brief, report = import_file("magicplan", "dxf", dxf)
        check("dxf-rooms", report["rooms"] == 1 and brief["rooms"][0]["rect"] == [0.0, 0.0, 5.0, 4.0],
              json.dumps(brief["rooms"]))
        check("dxf-tier", report["tier"] == "measured" and brief["estimated"] is False, str(report))

        svg = os.path.join(tmp, "plan.svg")
        with open(svg, "w", encoding="utf-8") as fh:
            fh.write('<svg xmlns="http://www.w3.org/2000/svg">'
                     '<rect x="0" y="0" width="6" height="5"/>'
                     '<rect x="6" y="0" width="3" height="5"/></svg>')
        brief, _ = import_file("sweet-home-3d", "svg", svg)
        check("svg-rooms", len(brief["rooms"]) == 2, json.dumps(brief["rooms"]))

        png = os.path.join(tmp, "plan.png")
        with open(png, "wb") as fh:
            fh.write(b"\x89PNG\r\n\x1a\n")
        try:
            import_file("roomsketcher", "png", png)
            check("raster-gate", False, "should have raised")
        except UsageError:
            pass
        brief, report = import_file("roomsketcher", "png", png, accept_estimated=True)
        check("raster-stub", brief["estimated"] is True and report["confirmationRequired"] is True,
              json.dumps(report))

        try:
            import_file("nope", "dxf", dxf)
            check("unknown-source", False, "should have raised")
        except UsageError:
            pass
        try:
            import_file("roomsketcher", "dxf", dxf)
            check("wrong-format", False, "should have raised")
        except UsageError:
            pass
        try:
            import_file("magicplan", "csv", os.path.join(tmp, "m.csv"))
            check("csv-gate", False, "should have raised")
        except UsageError:
            pass

    if failures:
        for failure in failures:
            print(f"self-test failure: {failure}", file=sys.stderr)
        return 1
    print("self-test: 16 assertions, all passed")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(prog="byof_import.py", description="Import source-app exports into room briefs.")
    parser.add_argument("--source", default=None)
    parser.add_argument("--format", default=None)
    parser.add_argument("--input", default=None)
    parser.add_argument("-o", "--output", default=None)
    parser.add_argument("--accept-estimated", action="store_true")
    parser.add_argument("--list-sources", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    ns = parser.parse_args(argv)
    if ns.self_test:
        return run_self_test()
    if ns.list_sources:
        print(json.dumps(SOURCES, indent=2))
        return 0
    if not (ns.source and ns.format and ns.input and ns.output):
        parser.print_usage(sys.stderr)
        return 2
    try:
        brief, report = import_file(ns.source, ns.format, ns.input,
                                    accept_estimated=ns.accept_estimated)
    except UsageError as exc:
        sys.stderr.write(f"usage error: {exc}\n")
        return 2
    except OSError as exc:
        sys.stderr.write(f"engine error: {exc}\n")
        return 1
    try:
        with open(ns.output, "w", encoding="utf-8") as fh:
            json.dump(brief, fh, indent=2)
    except OSError as exc:
        sys.stderr.write(f"cannot write {ns.output}: {exc}\n")
        return 1
    print(json.dumps({"brief": ns.output, **report}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
