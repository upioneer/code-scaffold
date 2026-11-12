#!/usr/bin/env python3
"""Demo model generator: parametric CAD showcase assemblies.

Builds six demo models (garage storage, L-desk, FPV freestyle, FPV racer,
CNC gantry, electronics enclosure) as named part lists with materials,
verifies Section 23 part ownership (no interpenetration) plus full
gravity support (no floating parts), and emits JSON plus a viewer-ready
JS bundle for the sandbox model bar.

Usage:
    python scripts/demo_models.py build [--out DIR]
    python scripts/demo_models.py --self-test
"""

import json
import math
import os
import sys

EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2
EPS = 0.01

MATERIALS = {
    "birch": {"color": 0xC8A06A, "roughness": 0.8, "metalness": 0.0},
    "walnut": {"color": 0x7A5230, "roughness": 0.75, "metalness": 0.0},
    "blackMetal": {"color": 0x2A3342, "roughness": 0.6, "metalness": 0.3},
    "aluminum": {"color": 0x9AA4B2, "roughness": 0.35, "metalness": 0.9},
    "steelDark": {"color": 0x4B5563, "roughness": 0.45, "metalness": 0.85},
    "carbon": {"color": 0x323845, "roughness": 0.8, "metalness": 0.1},
    "prop": {"color": 0x8B93A5, "roughness": 0.65, "metalness": 0.05},
    "pcb": {"color": 0x0E5C36, "roughness": 0.55, "metalness": 0.1},
    "brass": {"color": 0xB08D3E, "roughness": 0.35, "metalness": 0.9},
    "rubber": {"color": 0x181C22, "roughness": 0.9, "metalness": 0.0},
}


def box(name, material, cx, cy, cz, sx, sy, sz, rot_y=0.0):
    """Axis part box centered at (cx, cy, cz) with optional Y rotation."""
    return {"name": name, "kind": "box", "material": material,
            "center": [cx, cy, cz], "size": [sx, sy, sz], "rot_y": rot_y}


def cyl(name, material, cx, cy, cz, r, h, axis="y"):
    """Cylinder part with axis along Y (default) or Z (lens barrels)."""
    return {"name": name, "kind": "cyl", "material": material,
            "center": [cx, cy, cz], "r": r, "h": h, "axis": axis}


def plate(name, material, cx, cy, cz, outline, t, holes=(), rot_y=0.0):
    """Flat profiled plate: outline plus holes in XZ relative to center."""
    return {"name": name, "kind": "plate", "material": material,
            "center": [cx, cy, cz],
            "outline": [[float(x), float(z)] for x, z in outline],
            "holes": [[[float(x), float(z)] for x, z in h] for h in holes],
            "t": float(t), "rot_y": float(rot_y)}


def _rot_xz(pts, cx, cz, rot_y):
    rot = math.radians(rot_y)
    co, si = math.cos(rot), math.sin(rot)
    return [[cx + x * co + z * si, cz - x * si + z * co] for x, z in pts]


def _shoelace(pts):
    s = 0.0
    for i in range(len(pts)):
        x0, z0 = pts[i]
        x1, z1 = pts[(i + 1) % len(pts)]
        s += x0 * z1 - x1 * z0
    return abs(s) / 2


def aabb(part):
    """Return (min, max) corners for a part, honoring Y rotation."""
    cx, cy, cz = part["center"]
    if part["kind"] == "cyl":
        r, h = part["r"], part["h"]
        if part.get("axis", "y") == "z":
            return ([cx - r, cy - r, cz - h / 2], [cx + r, cy + r, cz + h / 2])
        return ([cx - r, cy - h / 2, cz - r], [cx + r, cy + h / 2, cz + r])
    if part["kind"] == "plate":
        pts = _rot_xz(part["outline"], cx, cz, part["rot_y"])
        xs = [p[0] for p in pts]
        zs = [p[1] for p in pts]
        return ([min(xs), cy - part["t"] / 2, min(zs)],
                [max(xs), cy + part["t"] / 2, max(zs)])
    sx, sy, sz = part["size"]
    rot = math.radians(part.get("rot_y", 0.0))
    ex = abs(sx * math.cos(rot)) + abs(sz * math.sin(rot))
    ez = abs(sx * math.sin(rot)) + abs(sz * math.cos(rot))
    return ([cx - ex / 2, cy - sy / 2, cz - ez / 2],
            [cx + ex / 2, cy + sy / 2, cz + ez / 2])


def part_volume(part):
    if part["kind"] == "cyl":
        return math.pi * part["r"] ** 2 * part["h"]
    if part["kind"] == "plate":
        return _shoelace(part["outline"]) * part["t"]
    sx, sy, sz = part["size"]
    return sx * sy * sz


def _footprint(part):
    """XZ footprint: ("rect", cx, cz, hx, hz, rot) or ("poly", pts)."""
    cx, _cy, cz = part["center"]
    if part["kind"] == "plate":
        return ("poly", _rot_xz(part["outline"], cx, cz, part["rot_y"]))
    if part["kind"] == "cyl":
        if part.get("axis", "y") == "z":
            return ("rect", cx, cz, part["r"], part["h"] / 2, 0.0)
        return ("rect", cx, cz, part["r"], part["r"], 0.0)
    sx, _sy, sz = part["size"]
    return ("rect", cx, cz, sx / 2, sz / 2,
            math.radians(part.get("rot_y", 0.0)))


def _corners(fp):
    if fp[0] == "poly":
        return [(p[0], p[1]) for p in fp[1]]
    _tag, cx, cz, hx, hz, rot = fp
    c, s = math.cos(rot), math.sin(rot)
    pts = []
    for lx, lz in ((hx, hz), (hx, -hz), (-hx, -hz), (-hx, hz)):
        pts.append((cx + lx * c + lz * s, cz - lx * s + lz * c))
    return pts


def _footprints_intersect(f1, f2):
    """Separating axis test on rects; sampling when a polygon is involved."""
    if f1[0] == "rect" and f2[0] == "rect":
        c1, c2 = _corners(f1), _corners(f2)
        axes = []
        for corners in (c1, c2):
            for i in range(2):
                x1, z1 = corners[i]
                x2, z2 = corners[(i + 1) % 4]
                axes.append((-(z2 - z1), x2 - x1))
        for ax, az in axes:
            p1 = [x * ax + z * az for x, z in c1]
            p2 = [x * ax + z * az for x, z in c2]
            if max(p1) <= min(p2) + EPS or max(p2) <= min(p1) + EPS:
                return False
        return True
    return _intersection_area(f1, f2, grid=64) > 0.0


def _intersection_area(f1, f2, grid=48):
    """Approximate area via point sampling over the overlap region."""
    pts = _corners(f1) + _corners(f2)
    xs = [p[0] for p in pts]
    zs = [p[1] for p in pts]
    x0, x1 = min(xs), max(xs)
    z0, z1 = min(zs), max(zs)
    if x1 - x0 <= 0 or z1 - z0 <= 0:
        return 0.0
    hits = 0
    for i in range(grid):
        for j in range(grid):
            px = x0 + (i + 0.5) / grid * (x1 - x0)
            pz = z0 + (j + 0.5) / grid * (z1 - z0)
            if _point_in(px, pz, f1) and _point_in(px, pz, f2):
                hits += 1
    return hits / (grid * grid) * (x1 - x0) * (z1 - z0)


def _point_in(px, pz, fp):
    if fp[0] == "poly":
        inside = False
        pts = fp[1]
        n = len(pts)
        for i in range(n):
            x0, z0 = pts[i]
            x1, z1 = pts[(i + 1) % n]
            if (z0 > pz) != (z1 > pz):
                xi = x0 + (pz - z0) / (z1 - z0) * (x1 - x0)
                if px < xi:
                    inside = not inside
        return inside
    _tag, cx, cz, hx, hz, rot = fp
    dx, dz = px - cx, pz - cz
    c, s = math.cos(rot), math.sin(rot)
    return abs(dx * c - dz * s) <= hx and abs(dx * s + dz * c) <= hz


def _y_span(part):
    _cx, cy, _cz = part["center"]
    if part["kind"] == "cyl" and part.get("axis", "y") == "z":
        h = part["r"] * 2
    elif part["kind"] == "cyl":
        h = part["h"]
    elif part["kind"] == "plate":
        h = part["t"]
    else:
        h = part["size"][1]
    return (cy - h / 2, cy + h / 2)


def overlap_volume(a, b):
    """Positive intersection volume via Y span times footprint area."""
    a0, a1 = _y_span(a)
    b0, b1 = _y_span(b)
    span = min(a1, b1) - max(a0, b0)
    if span <= EPS:
        return 0.0
    f1, f2 = _footprint(a), _footprint(b)
    if not _footprints_intersect(f1, f2):
        return 0.0
    return span * _intersection_area(f1, f2)


def check_no_overlap(parts):
    """Return [(name_a, name_b, vol)] for every interpenetrating pair."""
    hits = []
    for i in range(len(parts)):
        for j in range(i + 1, len(parts)):
            vol = overlap_volume(parts[i], parts[j])
            if vol > 0.0:
                hits.append((parts[i]["name"], parts[j]["name"], vol))
    return hits


def union_volume(parts):
    """Sum of part volumes (equals union iff no overlap)."""
    return sum(part_volume(p) for p in parts)


AREA_EPS = 1.0


def _rect_overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def _footprint_area(f1, f2):
    """XZ overlap area: exact for axis-aligned rects, else fine sampling."""
    if (f1[0] == "rect" and f2[0] == "rect"
            and abs(f1[5]) <= 1e-9 and abs(f2[5]) <= 1e-9):
        x = _rect_overlap(f1[1] - f1[3], f1[1] + f1[3],
                          f2[1] - f2[3], f2[1] + f2[3])
        z = _rect_overlap(f1[2] - f1[4], f1[2] + f1[4],
                          f2[2] - f2[4], f2[2] + f2[4])
        return x * z
    return _intersection_area(f1, f2, grid=96)


def _face_butt(plo, phi, qlo, qhi):
    """True if boxes share an X or Z face plane over a real contact patch."""
    if abs(qhi[0] - plo[0]) <= EPS or abs(phi[0] - qlo[0]) <= EPS:
        if (_rect_overlap(plo[1], phi[1], qlo[1], qhi[1]) *
                _rect_overlap(plo[2], phi[2], qlo[2], qhi[2]) > AREA_EPS):
            return True
    if abs(qhi[2] - plo[2]) <= EPS or abs(phi[2] - qlo[2]) <= EPS:
        if (_rect_overlap(plo[0], phi[0], qlo[0], qhi[0]) *
                _rect_overlap(plo[1], phi[1], qlo[1], qhi[1]) > AREA_EPS):
            return True
    return False


def check_grounded(parts):
    """Names of parts with no support: not founded, resting, hung, or butted."""
    bounds = [aabb(p) for p in parts]
    prints = [_footprint(p) for p in parts]
    floor = min(lo[1] for lo, _hi in bounds)
    bad = []
    for i, part in enumerate(parts):
        plo, phi = bounds[i]
        if plo[1] <= floor + EPS:
            continue
        ok = False
        for j, _other in enumerate(parts):
            if i == j:
                continue
            qlo, qhi = bounds[j]
            if abs(qhi[1] - plo[1]) <= EPS:
                if _footprint_area(prints[i], prints[j]) > AREA_EPS:
                    ok = True
                    break
            if abs(qlo[1] - phi[1]) <= EPS:
                if _footprint_area(prints[i], prints[j]) > AREA_EPS:
                    ok = True
                    break
            if _face_butt(plo, phi, qlo, qhi):
                ok = True
                break
        if not ok:
            bad.append(part["name"])
    return bad


def cut_list(parts):
    """Group boxes by identical dims: [{dims, material, qty, names}]."""
    groups = {}
    for part in parts:
        if part["kind"] == "box":
            key = (part["material"], tuple(part["size"]))
        elif part["kind"] == "plate":
            lo, hi = aabb(part)
            key = (part["material"], ("plate", round(hi[0] - lo[0], 1),
                                      round(hi[2] - lo[2], 1), part["t"]))
        else:
            key = (part["material"], ("cyl", part["r"], part["h"]))
        groups.setdefault(key, []).append(part["name"])
    rows = []
    for (material, dims), names in sorted(groups.items(), key=str):
        rows.append({"material": material, "dims": list(dims),
                     "qty": len(names), "names": names})
    return rows


def model(slug, title, description, parts):
    return {"slug": slug, "title": title, "description": description,
            "units": "mm", "parts": parts,
            "cut_list": cut_list(parts),
            "stats": {"part_count": len(parts),
                      "volume_mm3": round(union_volume(parts), 1)}}


def build_garage_storage():
    """2200H x 1800W x 600D wall unit: twin cabinets, open bay, bridge top."""
    parts = []
    t = 18
    parts.append(box("plinth", "walnut", 0, 50, -10, 1800, 100, 560))
    for side, x0 in (("left", -900), ("right", 300)):
        cx = x0 + 300
        parts.append(box(f"{side} outer side", "birch", x0 + 9, 1050, -10, t, 1900, 560))
        parts.append(box(f"{side} inner side", "birch", x0 + 600 - 9, 1050, -10, t, 1900, 560))
        parts.append(box(f"{side} bottom", "birch", cx, 109, -7, 564, t, 554))
        parts.append(box(f"{side} top", "birch", cx, 1991, -7, 564, t, 554))
        parts.append(box(f"{side} door", "walnut", cx, 1050, 281, 594, 1876, 18))
        hx = x0 + 13 if side == "left" else x0 + 600 - 13
        for i, hy in enumerate((500, 1600)):
            parts.append(box(f"{side} hinge {i + 1}", "steelDark",
                             hx, hy, 271, 20, 60, 2))
        for i, y in enumerate((600, 1050, 1500)):
            parts.append(box(f"{side} shelf {i + 1}", "birch", cx, y, -20, 564, 30, 520))
        parts.append(box(f"{side} back", "birch", cx, 1050, -287, 564, 1900, 6))
    for i, y in enumerate((350, 750, 1150, 1550, 1900)):
        parts.append(box(f"bay shelf {i + 1}", "birch", 0, y, -20, 600, 30, 520))
    parts.append(box("bay back", "birch", 0, 1050, -287, 564, 1900, 6))
    parts.append(box("bridge bottom", "birch", 0, 2009, -10, 1800, t, 560))
    parts.append(box("bridge left side", "birch", -891, 2100, -10, t, 164, 560))
    parts.append(box("bridge right side", "birch", 891, 2100, -10, t, 164, 560))
    parts.append(box("bridge top", "birch", 0, 2191, -10, 1800, t, 560))
    parts.append(box("bridge door left", "walnut", -450, 2100, 281, 894, 164, 18))
    parts.append(box("bridge door right", "walnut", 450, 2100, 281, 894, 164, 18))
    for i, hy in enumerate((2040, 2160)):
        parts.append(box(f"bridge hinge left {i + 1}", "steelDark",
                         -887, hy, 271, 20, 40, 2))
        parts.append(box(f"bridge hinge right {i + 1}", "steelDark",
                         887, hy, 271, 20, 40, 2))
    return model("garage_storage", "Garage Storage Wall",
                 "Twin wardrobes, open shelving bay, and a full width bridge cabinet.",
                 parts)


def build_l_desk():
    """1600 main plus 1200 return corner desk with pedestal, hutch, and tray."""
    parts = []
    parts.append(box("main top", "walnut", 0, 730, 0, 1600, 40, 700))
    parts.append(box("return top", "walnut", -550, 730, -650, 500, 40, 600))
    parts.append(box("leg panel right", "birch", 775, 355, 0, 25, 710, 640))
    parts.append(box("leg panel left", "birch", -775, 355, 0, 25, 710, 640))
    parts.append(box("leg panel return", "birch", -550, 355, -925, 450, 710, 25))
    parts.append(box("modesty panel", "birch", -231.25, 535, -320, 1062.5, 350, 18))
    px = 500
    parts.append(box("pedestal left", "birch", px - 200 + 9, 355, 0, 18, 710, 550))
    parts.append(box("pedestal right", "birch", px + 200 - 9, 355, 0, 18, 710, 550))
    parts.append(box("pedestal top", "birch", px, 701, 3, 364, 18, 544))
    parts.append(box("pedestal bottom", "birch", px, 39, 3, 364, 18, 544))
    parts.append(box("pedestal back", "birch", px, 355, -272, 364, 710, 6))
    for i, y in enumerate((158, 370, 582)):
        parts.append(box(f"drawer front {i + 1}", "walnut", px, y, 284, 392, 204, 18))
    parts.append(box("cable tray bottom", "blackMetal", -200, 640, -230, 1000, 12, 138))
    parts.append(box("cable tray back", "blackMetal", -200, 660, -305, 1000, 100, 12))
    parts.append(box("riser shelf", "birch", -300, 810, -50, 600, 24, 280))
    parts.append(box("riser foot left", "birch", -575, 774, -50, 24, 48, 280))
    parts.append(box("riser foot right", "birch", -25, 774, -50, 24, 48, 280))
    hx, hz = -550, -650
    parts.append(box("hutch left", "birch", hx - 225, 950, hz, 18, 400, 500))
    parts.append(box("hutch right", "birch", hx + 225, 950, hz, 18, 400, 500))
    parts.append(box("hutch top", "birch", hx, 1159, hz, 468, 18, 500))
    parts.append(box("hutch divider 1", "birch", -601, 950, hz, 18, 400, 480))
    parts.append(box("hutch divider 2", "birch", -443, 950, hz, 18, 400, 480))
    parts.append(box("hutch shelf low", "birch", -688, 900, hz, 156, 18, 480))
    parts.append(box("hutch shelf mid", "birch", -522, 1000, hz, 140, 18, 480))
    parts.append(box("hutch shelf high", "birch", -384, 1080, hz, 100, 18, 480))
    return model("l_desk", "L Corner Desk",
                 "Corner workstation with drawer pedestal, cable tray, riser, and staggered hutch.",
                 parts)


def _load_outlines():
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "outlines.json")) as fh:
        return json.load(fh)


OUTLINES = _load_outlines()


def _clip_xmin(outline, xmin):
    """Sutherland-Hodgman clip of a loop to the x >= xmin half-plane."""
    out = []
    n = len(outline)
    for i in range(n):
        x0, z0 = outline[i]
        x1, z1 = outline[(i + 1) % n]
        inn0, inn1 = x0 >= xmin, x1 >= xmin
        if inn0 and inn1:
            out.append([x1, z1])
        elif inn0:
            f = (xmin - x0) / (x1 - x0)
            out.append([xmin, z0 + f * (z1 - z0)])
        elif inn1:
            f = (xmin - x0) / (x1 - x0)
            out.append([xmin, z0 + f * (z1 - z0)])
            out.append([x1, z1])
    return out


def _prop_blades(parts, prefix, mx, mz, y_base, blade_len, blade_w, thick):
    """Three staggered prop blades fanning from a motor hub."""
    for k in range(3):
        phi = math.radians(30 + 120 * k)
        dist = blade_len / 2
        bx = mx + dist * math.cos(phi)
        bz = mz + dist * math.sin(phi)
        parts.append(box(f"{prefix} blade {k + 1}", "prop", bx,
                         y_base + thick * k + thick / 2, bz,
                         blade_len, thick, blade_w,
                         rot_y=-(30 + 120 * k)))


def build_fpv_freestyle():
    """5 inch true X freestyle from real frame profiles, 6mm arms."""
    parts = []
    o = OUTLINES
    arm = dict(o["so1_arm"])
    arm["outline"] = _clip_xmin(arm["outline"], -95.0)
    arm["holes"] = [h for h in arm["holes"]
                    if sum(p[0] for p in h) / len(h) >= -93.0]
    parts.append(plate("bottom plate", "carbon", 0, 1.5, 0,
                       o["so1_bottom"]["outline"], 3.0,
                       o["so1_bottom"]["holes"]))
    for i, (sx, sz) in enumerate(((1, 1), (1, -1), (-1, 1), (-1, -1))):
        # Outline root extends local -X, so -X arms need a half turn to
        # keep every root sandwiched under the body and every motor outboard
        rot = (-45.0 if sx * sz > 0 else 45.0) + (180.0 if sx < 0 else 0.0)
        parts.append(plate(f"arm {i + 1}", "carbon", sx * 80, 6, sz * 80,
                           arm["outline"], 6.0, arm["holes"], rot_y=rot))
    parts.append(plate("mid plate", "carbon", 0, 10.25, 0,
                       o["so1_mid"]["outline"], 2.5, o["so1_mid"]["holes"]))
    parts.append(box("ESC board", "pcb", 0, 13, 0, 30, 3, 30))
    parts.append(box("FC board", "pcb", 0, 16, 0, 30, 3, 30))
    parts.append(box("VTX board", "pcb", 0, 19, 0, 30, 3, 30))
    for i, (x, z) in enumerate(((18, 40), (18, 15), (18, -15), (18, -40),
                                (-18, 40), (-18, 15), (-18, -15), (-18, -40))):
        parts.append(cyl(f"standoff {i + 1}", "aluminum", x, 22, z, 3, 21))
    parts.append(plate("top plate", "carbon", 0, 33.75, 0,
                       o["top_free"]["outline"], 2.5, o["top_free"]["holes"]))
    for i, (mx, mz) in enumerate(((80, 80), (80, -80), (-80, 80), (-80, -80))):
        parts.append(cyl(f"motor {i + 1} base", "blackMetal", mx, 13, mz,
                         11, 8))
        parts.append(cyl(f"motor {i + 1} bell", "steelDark", mx, 23.5, mz,
                         13.5, 13))
        parts.append(cyl(f"prop shaft {i + 1}", "steelDark", mx, 33, mz,
                         2.5, 6))
        _prop_blades(parts, f"prop {i + 1}", mx, mz, 36.0, 63.5, 17, 1.6)
        parts.append(cyl(f"prop nut {i + 1}", "steelDark", mx, 43.3, mz,
                         4, 5))
    for i, x in enumerate((60, -60)):
        parts.append(box(f"arm guard {i + 1}", "rubber", x, 12, 62,
                         40, 6, 12))
    for i, x in enumerate((15, -15)):
        parts.append(cyl(f"damper {i + 1}", "rubber", x, 38, -30, 4, 6))
    parts.append(box("cam tray", "carbon", 0, 42.5, -30, 44, 3, 40))
    parts.append(box("cage left", "carbon", -16, 46, 37.5, 6, 22, 25))
    parts.append(box("cage right", "carbon", 16, 46, 37.5, 6, 22, 25))
    parts.append(box("cage top", "carbon", 0, 58.5, 37.5, 44, 3, 29))
    parts.append(box("camera", "blackMetal", 0, 45, 47, 20, 20, 8))
    parts.append(cyl("camera lens", "steelDark", 0, 45, 54, 7, 6, axis="z"))
    parts.append(cyl("antenna", "blackMetal", 18, 70, 5, 1.5, 70))
    parts.append(cyl("buzzer", "blackMetal", -18, 38, 5, 4, 6))
    return model("fpv_freestyle", "FPV Freestyle 5in",
                 "5 inch true X from real frame profiles: triple stack, "
                 "cage, 3-blade props, action cam tray.",
                 parts)


def build_fpv_racer():
    """3 inch pod racer from real race frame profiles, 5mm arms."""
    parts = []
    o = OUTLINES
    arm = dict(o["or_arm"])
    arm["outline"] = _clip_xmin(arm["outline"], -60.0)
    arm["holes"] = [h for h in arm["holes"]
                    if sum(p[0] for p in h) / len(h) >= -58.0]
    parts.append(plate("bottom plate", "carbon", 0, 1.25, 0,
                       o["or_bottom"]["outline"], 2.5,
                       o["or_bottom"]["holes"]))
    for i, (sx, sz) in enumerate(((1, 1), (1, -1), (-1, 1), (-1, -1))):
        # Outline root extends local -X, so -X arms need a half turn to
        # keep every root sandwiched under the body and every motor outboard
        rot = (-45.0 if sx * sz > 0 else 45.0) + (180.0 if sx < 0 else 0.0)
        parts.append(plate(f"arm {i + 1}", "carbon", sx * 54.5, 5, sz * 54.5,
                           arm["outline"], 5.0, arm["holes"], rot_y=rot))
    parts.append(box("ESC board", "pcb", 0, 8.75, 0, 30, 2.5, 30))
    parts.append(box("AIO board", "pcb", 0, 11.25, 0, 30, 2.5, 30))
    for i, (x, z) in enumerate(((19, 0), (-19, 0))):
        parts.append(cyl(f"standoff {i + 1}", "aluminum", x, 7.5, z, 2, 10))
    parts.append(plate("pod deck", "carbon", 0, 13.75, 0,
                       o["or_mid"]["outline"], 2.5, o["or_mid"]["holes"]))
    parts.append(box("pod step 1", "rubber", 0, 18, 0, 36, 6, 56))
    parts.append(box("pod step 2", "rubber", 0, 24, 0, 30, 6, 48))
    parts.append(box("pod step 3", "rubber", 0, 30, 0, 24, 6, 40))
    parts.append(cyl("camera lens", "steelDark", 0, 24, 30, 6, 4, axis="z"))
    parts.append(cyl("RX whip left", "blackMetal", -19.5, 35, -19, 1, 40))
    parts.append(cyl("RX whip right", "blackMetal", 19.5, 35, -19, 1, 40))
    for i, (mx, mz) in enumerate(((54.5, 54.5), (54.5, -54.5),
                                  (-54.5, 54.5), (-54.5, -54.5))):
        parts.append(cyl(f"motor {i + 1} base", "blackMetal", mx, 10.5, mz,
                         7, 6))
        parts.append(cyl(f"motor {i + 1} bell", "steelDark", mx, 18, mz,
                         7, 9))
        parts.append(cyl(f"prop shaft {i + 1}", "steelDark", mx, 24.5, mz,
                         2, 4))
        _prop_blades(parts, f"prop {i + 1}", mx, mz, 26.5, 38, 13, 1.2)
        parts.append(cyl(f"prop nut {i + 1}", "steelDark", mx, 32.1, mz,
                         3, 4))
    return model("fpv_racer", "FPV Racer 3in",
                 "3 inch pod racer from real race frame profiles: slam "
                 "stack, stepped canopy, 3-blade props.",
                 parts)


def build_cnc_gantry():
    """Benchtop 3-axis gantry: extrusion base, rails, beam, Z head, steppers."""
    parts = []
    for i, (x, z) in enumerate(((195, 195), (195, -195), (-195, 195), (-195, -195))):
        parts.append(box(f"foot {i + 1}", "blackMetal", x, 30, z, 60, 60, 60))
    parts.append(box("base rail front", "aluminum", 0, 80, 195, 450, 40, 40))
    parts.append(box("base rail back", "aluminum", 0, 80, -195, 450, 40, 40))
    parts.append(box("base rail left", "aluminum", -195, 80, 0, 40, 40, 350))
    parts.append(box("base rail right", "aluminum", 195, 80, 0, 40, 40, 350))
    parts.append(box("bed plate", "aluminum", 0, 106, 0, 370, 12, 370))
    for side in (-140, 140):
        parts.append(box(f"Y rail {'left' if side < 0 else 'right'}", "steelDark",
                         side, 119.5, 0, 20, 15, 380))
        for j, z in enumerate((-120, 120)):
            parts.append(box(f"Y block {side} {j + 1}", "blackMetal",
                             side, 142, z, 50, 30, 34))
    for side in (-140, 140):
        parts.append(box(f"upright {'left' if side < 0 else 'right'}",
                         "aluminum", side, 257, 0, 30, 200, 290))
    parts.append(box("X beam", "aluminum", 0, 377, 0, 400, 40, 40))
    parts.append(box("X rail", "steelDark", 0, 377, 30, 240, 30, 20))
    for i, x in enumerate((-60, 60)):
        parts.append(box(f"X block {i + 1}", "blackMetal", x, 372, 55, 40, 40, 30))
    parts.append(box("Z plate", "aluminum", 0, 367, 77.5, 100, 180, 15))
    parts.append(box("spindle clamp", "blackMetal", 0, 353.5, 105, 80, 60, 40))
    parts.append(cyl("spindle", "steelDark", 0, 305, 153, 28, 150))
    parts.append(box("X stepper", "blackMetal", 150, 378, -41, 42, 42, 42))
    parts.append(box("Y stepper", "blackMetal", -140, 121, -211, 42, 42, 42))
    parts.append(box("Z stepper", "blackMetal", 0, 478, 77, 42, 42, 42))
    return model("cnc_gantry", "Benchtop CNC Gantry",
                 "Moving gantry mill with linear rails, ball screw steppers, and spindle.",
                 parts)


def build_enclosure():
    """200x150x70 vented electronics box: slatted lid, ports, PCB, hardware."""
    parts = []
    parts.append(box("bottom", "blackMetal", 0, 1.5, 0, 200, 3, 150))
    parts.append(box("front left", "blackMetal", -65, 35, 73.5, 70, 64, 3))
    parts.append(box("front right", "blackMetal", 65, 35, 73.5, 70, 64, 3))
    parts.append(box("back left", "blackMetal", -62.5, 35, -73.5, 75, 64, 3))
    parts.append(box("back right", "blackMetal", 62.5, 35, -73.5, 75, 64, 3))
    parts.append(box("side left", "blackMetal", -98.5, 35, 0, 3, 64, 144))
    parts.append(box("side right", "blackMetal", 98.5, 35, 0, 3, 64, 144))
    parts.append(box("fan grille", "blackMetal", 0, 35, -73.5, 50, 64, 8))
    for i in range(5):
        z = -75 + 11.8 + i * (23.6 + 8)
        parts.append(box(f"lid slat {i + 1}", "blackMetal", 0, 68.5, z, 200, 3, 23.6))
    parts.append(box("PCB", "pcb", 0, 16, 0, 160, 2, 110))
    for i, (x, z) in enumerate(((70, 45), (70, -45), (-70, 45), (-70, -45))):
        parts.append(cyl(f"standoff {i + 1}", "brass", x, 9, z, 3, 12))
    for i, (x, z) in enumerate(((90, 60), (90, -60), (-90, 60), (-90, -60))):
        parts.append(cyl(f"lid screw {i + 1}", "steelDark", x, 71.5, z, 3, 3))
    for i, (x, z) in enumerate(((85, 60), (85, -60), (-85, 60), (-85, -60))):
        parts.append(cyl(f"foot {i + 1}", "rubber", x, -3, z, 8, 6))
    return model("enclosure", "Vented Electronics Enclosure",
                 "Slatted lid, port openings, fan, PCB on brass standoffs.",
                 parts)


BUILDERS = {
    "garage_storage": build_garage_storage,
    "l_desk": build_l_desk,
    "fpv_freestyle": build_fpv_freestyle,
    "fpv_racer": build_fpv_racer,
    "cnc_gantry": build_cnc_gantry,
    "enclosure": build_enclosure,
}

EXPECTED_COUNTS = {
    "garage_storage": 39,
    "l_desk": 27,
    "fpv_freestyle": 58,
    "fpv_racer": 44,
    "cnc_gantry": 27,
    "enclosure": 26,
}

JS_BANNER = ("// GENERATED by scripts/demo_models.py build. "
             "Do not hand edit; regenerate instead.\n")


def build_all(out_dir):
    """Write models/*.json plus sandbox/demo_models.js. Return model dicts."""
    models_dir = os.path.join(out_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    bundle = {"materials": MATERIALS, "models": {}}
    for slug, builder in BUILDERS.items():
        data = builder()
        with open(os.path.join(models_dir, slug + ".json"), "w",
                  encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
        bundle["models"][slug] = data
    js_path = os.path.join(out_dir, "sandbox", "demo_models.js")
    with open(js_path, "w", encoding="utf-8") as fh:
        fh.write(JS_BANNER + "var DEMO_MODELS = " +
                 json.dumps(bundle) + ";\n")
    return bundle


def main(argv):
    if "--self-test" in argv:
        return self_test()
    if argv and argv[0] == "build":
        out = argv[argv.index("--out") + 1] if "--out" in argv else None
        if out is None:
            out = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        bundle = build_all(out)
        total = sum(len(m["parts"]) for m in bundle["models"].values())
        print(f"Built {len(bundle['models'])} models, {total} parts -> {out}")
        return EXIT_OK
    print("usage: demo_models.py build [--out DIR] | --self-test")
    return EXIT_USAGE


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

    for slug, builder in BUILDERS.items():
        data = builder()
        check(f"{slug} part count", len(data["parts"]) == EXPECTED_COUNTS[slug])
        hits = check_no_overlap(data["parts"])
        for a, b, vol in hits[:8]:
            print(f"  OVERLAP {slug}: {a} x {b} vol={vol:.1f}")
        check(f"{slug} owns every volume",
              not hits and union_volume(data["parts"]) > 0)
        mats = {p["material"] for p in data["parts"]}
        check(f"{slug} materials known", mats <= set(MATERIALS))
        floaters = check_grounded(data["parts"])
        for name in floaters:
            print(f"  FLOATER {slug}: {name}")
        check(f"{slug} every part grounded", not floaters)

    for slug in ("fpv_freestyle", "fpv_racer"):
        drone = BUILDERS[slug]()
        check(f"{slug} has 4 motors",
              sum(1 for p in drone["parts"] if "motor" in p["name"]) == 8)
    cnc = BUILDERS["cnc_gantry"]()
    check("cnc has 3 steppers",
          sum(1 for p in cnc["parts"] if "stepper" in p["name"]) == 3)
    enc = BUILDERS["enclosure"]()
    check("enclosure has 5 lid slats",
          sum(1 for p in enc["parts"] if "lid slat" in p["name"]) == 5)

    with tempfile.TemporaryDirectory() as tmp:
        os.makedirs(os.path.join(tmp, "sandbox"))
        bundle = build_all(tmp)
        check("emit writes 6 models", len(bundle["models"]) == 6)
        for slug in BUILDERS:
            with open(os.path.join(tmp, "models", slug + ".json"),
                      encoding="utf-8") as fh:
                disk = json.load(fh)
            check(f"{slug} json roundtrip",
                  len(disk["parts"]) == EXPECTED_COUNTS[slug])
        js = open(os.path.join(tmp, "sandbox", "demo_models.js"),
                  encoding="utf-8").read()
        check("js bundle carries banner and var",
              js.startswith("// GENERATED") and "var DEMO_MODELS" in js)

    print(f"SELF TEST PASSED ({passed}/{total})")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

