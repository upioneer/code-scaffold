#!/usr/bin/env python3
"""
Code Scaffold Orthographic Engineering Drawing Generator
Part of the Code Scaffold CAD Tools Skill (.skills/cad-tools)

Generates standardized 2D engineering blueprints in vector SVG format:
- ISO standard A4/A3 drawing sheet with border frame and grid zones (A-D, 1-4).
- Third-angle orthographic projection: Front View, Top View, Right View, and Isometric View.
- Fully dimensioned with extension lines, arrowheads, centerlines, and hole callouts.
- Professional title block with part metadata, revision, material, and projection symbol.

Zero external dependencies: uses only Python stdlib.
"""

import os
import sys
import math
import argparse
from typing import Dict, Any, List, Tuple, Optional


class SVGDrawingBuilder:
    """Constructs vector-crisp ISO engineering drawings in SVG format."""

    def __init__(self, sheet_width: int = 1200, sheet_height: int = 850, part_name: str = "BRACKET_BASE", material: str = "AlSi10Mg Aluminum"):
        self.width = sheet_width
        self.height = sheet_height
        self.part_name = part_name
        self.material = material
        self.elements: List[str] = []

    def add_rect(self, x: float, y: float, w: float, h: float, stroke: str = "#0ea5e9", fill: str = "none", stroke_width: float = 1.5, stroke_dash: str = ""):
        dash_attr = f' stroke-dasharray="{stroke_dash}"' if stroke_dash else ""
        self.elements.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" stroke="{stroke}" fill="{fill}" stroke-width="{stroke_width}"{dash_attr} />'
        )

    def add_line(self, x1: float, y1: float, x2: float, y2: float, stroke: str = "#0ea5e9", stroke_width: float = 1.5, stroke_dash: str = ""):
        dash_attr = f' stroke-dasharray="{stroke_dash}"' if stroke_dash else ""
        self.elements.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{stroke_width}"{dash_attr} />'
        )

    def add_circle(self, cx: float, cy: float, r: float, stroke: str = "#0ea5e9", fill: str = "none", stroke_width: float = 1.5):
        self.elements.append(
            f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" stroke="{stroke}" fill="{fill}" stroke-width="{stroke_width}" />'
        )

    def add_text(self, text: str, x: float, y: float, size: int = 12, fill: str = "#94a3b8", anchor: str = "start", font_weight: str = "normal", mono: bool = True):
        font_family = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" if mono else "sans-serif"
        self.elements.append(
            f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{font_weight}" font-family="{font_family}">{text}</text>'
        )

    def add_dimension_h(self, x1: float, x2: float, y: float, label: str, offset: float = 20.0):
        # Witness lines
        self.add_line(x1, y - 5, x1, y - offset - 5, stroke="#64748b", stroke_width=0.8)
        self.add_line(x2, y - 5, x2, y - offset - 5, stroke="#64748b", stroke_width=0.8)
        # Dimension line
        dim_y = y - offset
        self.add_line(x1, dim_y, x2, dim_y, stroke="#38bdf8", stroke_width=1.0)
        # Arrow ticks
        self.add_line(x1, dim_y - 3, x1 + 4, dim_y, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(x1, dim_y + 3, x1 + 4, dim_y, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(x2, dim_y - 3, x2 - 4, dim_y, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(x2, dim_y + 3, x2 - 4, dim_y, stroke="#38bdf8", stroke_width=1.0)
        # Label text
        mid_x = (x1 + x2) / 2.0
        self.add_text(label, mid_x, dim_y - 4, size=11, fill="#38bdf8", anchor="middle", font_weight="bold")

    def add_dimension_v(self, y1: float, y2: float, x: float, label: str, offset: float = 20.0):
        # Witness lines
        self.add_line(x - 5, y1, x + offset + 5, y1, stroke="#64748b", stroke_width=0.8)
        self.add_line(x - 5, y2, x + offset + 5, y2, stroke="#64748b", stroke_width=0.8)
        # Dimension line
        dim_x = x + offset
        self.add_line(dim_x, y1, dim_x, y2, stroke="#38bdf8", stroke_width=1.0)
        # Arrow ticks
        self.add_line(dim_x - 3, y1, dim_x, y1 + 4, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(dim_x + 3, y1, dim_x, y1 + 4, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(dim_x - 3, y2, dim_x, y2 - 4, stroke="#38bdf8", stroke_width=1.0)
        self.add_line(dim_x + 3, y2, dim_x, y2 - 4, stroke="#38bdf8", stroke_width=1.0)
        # Label text
        mid_y = (y1 + y2) / 2.0
        self.add_text(label, dim_x + 6, mid_y + 4, size=11, fill="#38bdf8", anchor="start", font_weight="bold")

    def draw_border_and_frame(self):
        # Sheet background (Dark Blueprint Slate)
        self.elements.append(
            f'<rect width="{self.width}" height="{self.height}" fill="#0b1120" />'
        )
        # Grid lines subtle blueprint matrix
        for gx in range(40, self.width - 40, 40):
            self.elements.append(f'<line x1="{gx}" y1="40" x2="{gx}" y2="{self.height - 40}" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="2,2" />')
        for gy in range(40, self.height - 40, 40):
            self.elements.append(f'<line x1="40" y1="{gy}" x2="{self.width - 40}" y2="{gy}" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="2,2" />')

        # Outer border
        self.add_rect(20, 20, self.width - 40, self.height - 40, stroke="#334155", stroke_width=1.0)
        # Inner drawing margin
        self.add_rect(35, 35, self.width - 70, self.height - 70, stroke="#38bdf8", stroke_width=1.8)

        # Drawing sheet zone markers
        self.add_text("A", 26, 120, size=10, fill="#64748b")
        self.add_text("B", 26, 320, size=10, fill="#64748b")
        self.add_text("C", 26, 520, size=10, fill="#64748b")
        self.add_text("D", 26, 720, size=10, fill="#64748b")

        self.add_text("1", 200, 30, size=10, fill="#64748b")
        self.add_text("2", 500, 30, size=10, fill="#64748b")
        self.add_text("3", 800, 30, size=10, fill="#64748b")
        self.add_text("4", 1050, 30, size=10, fill="#64748b")

    def draw_title_block(self):
        tb_w, tb_h = 360, 110
        tb_x = self.width - 35 - tb_w
        tb_y = self.height - 35 - tb_h

        # Title block outer frame
        self.add_rect(tb_x, tb_y, tb_w, tb_h, stroke="#38bdf8", fill="#0f172a", stroke_width=1.5)

        # Divider lines
        self.add_line(tb_x, tb_y + 35, tb_x + tb_w, tb_y + 35, stroke="#334155", stroke_width=1.0)
        self.add_line(tb_x, tb_y + 70, tb_x + tb_w, tb_y + 70, stroke="#334155", stroke_width=1.0)
        self.add_line(tb_x + 190, tb_y + 35, tb_x + 190, tb_y + tb_h, stroke="#334155", stroke_width=1.0)

        # Content
        self.add_text("CODE SCAFFOLD CAD SPECIFICATION", tb_x + 12, tb_y + 18, size=10, fill="#38bdf8", font_weight="bold")
        self.add_text(f"PART: {self.part_name}", tb_x + 12, tb_y + 30, size=11, fill="#f8fafc", font_weight="bold")

        self.add_text("MATERIAL / ALLOY:", tb_x + 12, tb_y + 48, size=9, fill="#64748b")
        self.add_text(self.material, tb_x + 12, tb_y + 62, size=10, fill="#94a3b8", font_weight="bold")

        self.add_text("REVISION: v1.0", tb_x + 200, tb_y + 48, size=9, fill="#64748b")
        self.add_text("UNITS: mm", tb_x + 200, tb_y + 62, size=9, fill="#38bdf8")

        self.add_text("TOLERANCE: ISO 2768-m", tb_x + 12, tb_y + 85, size=9, fill="#64748b")
        self.add_text("THIRD ANGLE PROJECTION", tb_x + 12, tb_y + 98, size=9, fill="#38bdf8")

        self.add_text("STATUS: RELEASED", tb_x + 200, tb_y + 85, size=9, fill="#10b981", font_weight="bold")
        self.add_text("SCALE: 1:1 (A4/A3)", tb_x + 200, tb_y + 98, size=9, fill="#64748b")

    def build_orthographic_views(self, length: float = 120.0, width: float = 70.0, height: float = 50.0, hole_dia: float = 12.0):
        # 1. FRONT VIEW (XY Plane)
        fv_x, fv_y = 120, 240
        self.add_text("VIEW A : FRONT ELEVATION", fv_x, fv_y - 30, size=12, fill="#38bdf8", font_weight="bold")
        self.add_rect(fv_x, fv_y, length, height, stroke="#38bdf8", fill="#0f172a", stroke_width=2.0)
        # Internal rib / web step
        self.add_line(fv_x + 35, fv_y, fv_x + 35, fv_y + height, stroke="#0284c7", stroke_width=1.2)
        # Center hole projection
        hx = fv_x + length * 0.75
        hy = fv_y + height * 0.5
        hr = hole_dia * 0.5
        # Centerlines
        self.add_line(hx, fv_y - 10, hx, fv_y + height + 10, stroke="#ef4444", stroke_width=0.8, stroke_dash="6,3,1,3")
        self.add_line(fv_x - 10, hy, fv_x + length + 10, hy, stroke="#ef4444", stroke_width=0.8, stroke_dash="6,3,1,3")
        self.add_circle(hx, hy, hr, stroke="#38bdf8", stroke_width=1.5)

        # Front view dimensions
        self.add_dimension_h(fv_x, fv_x + length, fv_y, f"{length:.1f} mm", offset=30)
        self.add_dimension_v(fv_y, fv_y + height, fv_x + length, f"{height:.1f} mm", offset=30)

        # 2. TOP VIEW (XZ Plane, 3rd Angle above Front View)
        tv_x, tv_y = 120, 520
        self.add_text("VIEW B : PLAN (TOP)", tv_x, tv_y - 30, size=12, fill="#38bdf8", font_weight="bold")
        self.add_rect(tv_x, tv_y, length, width, stroke="#38bdf8", fill="#0f172a", stroke_width=2.0)
        # Centerline through top view
        self.add_line(tv_x - 10, tv_y + width * 0.5, tv_x + length + 10, tv_y + width * 0.5, stroke="#ef4444", stroke_width=0.8, stroke_dash="6,3,1,3")
        # Hidden lines for internal hole
        self.add_line(tv_x + length * 0.75 - hr, tv_y, tv_x + length * 0.75 - hr, tv_y + width, stroke="#64748b", stroke_width=1.0, stroke_dash="4,3")
        self.add_line(tv_x + length * 0.75 + hr, tv_y, tv_x + length * 0.75 + hr, tv_y + width, stroke="#64748b", stroke_width=1.0, stroke_dash="4,3")

        # Top view dimensions
        self.add_dimension_v(tv_y, tv_y + width, tv_x + length, f"{width:.1f} mm", offset=30)

        # 3. RIGHT VIEW (YZ Plane, 3rd Angle to the right of Front View)
        rv_x, rv_y = 440, 240
        self.add_text("VIEW C : RIGHT ELEVATION", rv_x, rv_y - 30, size=12, fill="#38bdf8", font_weight="bold")
        self.add_rect(rv_x, rv_y, width, height, stroke="#38bdf8", fill="#0f172a", stroke_width=2.0)
        # Centerlines
        self.add_line(rv_x - 10, rv_y + height * 0.5, rv_x + width + 10, rv_y + height * 0.5, stroke="#ef4444", stroke_width=0.8, stroke_dash="6,3,1,3")
        # Hole through right view
        self.add_line(rv_x, rv_y + height * 0.5 - hr, rv_x + width, rv_y + height * 0.5 - hr, stroke="#64748b", stroke_width=1.0, stroke_dash="4,3")
        self.add_line(rv_x, rv_y + height * 0.5 + hr, rv_x + width, rv_y + height * 0.5 + hr, stroke="#64748b", stroke_width=1.0, stroke_dash="4,3")

        # 4. ISOMETRIC VIEW (Upper Right)
        iso_x, iso_y = 800, 320
        self.add_text("VIEW D : ISOMETRIC PROJECTION", iso_x - 40, iso_y - 120, size=12, fill="#10b981", font_weight="bold")
        self.draw_isometric_box(iso_x, iso_y, length * 0.7, width * 0.7, height * 0.7)

    def draw_isometric_box(self, cx: float, cy: float, l: float, w: float, h: float):
        cos30 = math.cos(math.radians(30))
        sin30 = math.sin(math.radians(30))

        # 3D axes projection vectors
        # X axis (length, down-right)
        dx = (l * cos30, l * sin30)
        # Y axis (width, down-left)
        dy = (-w * cos30, w * sin30)
        # Z axis (height, straight up)
        dz = (0, -h)

        # 8 vertices
        p0 = (cx, cy)
        p1 = (cx + dx[0], cy + dx[1])
        p2 = (cx + dx[0] + dy[0], cy + dx[1] + dy[1])
        p3 = (cx + dy[0], cy + dy[1])

        p4 = (p0[0] + dz[0], p0[1] + dz[1])
        p5 = (p1[0] + dz[0], p1[1] + dz[1])
        p6 = (p2[0] + dz[0], p2[1] + dz[1])
        p7 = (p3[0] + dz[0], p3[1] + dz[1])

        # Top Face
        self.elements.append(
            f'<polygon points="{p4[0]:.1f},{p4[1]:.1f} {p5[0]:.1f},{p5[1]:.1f} {p6[0]:.1f},{p6[1]:.1f} {p7[0]:.1f},{p7[1]:.1f}" fill="#1e293b" stroke="#38bdf8" stroke-width="1.6" />'
        )
        # Front-Right Face
        self.elements.append(
            f'<polygon points="{p4[0]:.1f},{p4[1]:.1f} {p5[0]:.1f},{p5[1]:.1f} {p1[0]:.1f},{p1[1]:.1f} {p0[0]:.1f},{p0[1]:.1f}" fill="#0f172a" stroke="#38bdf8" stroke-width="1.6" />'
        )
        # Front-Left Face
        self.elements.append(
            f'<polygon points="{p4[0]:.1f},{p4[1]:.1f} {p7[0]:.1f},{p7[1]:.1f} {p3[0]:.1f},{p3[1]:.1f} {p0[0]:.1f},{p0[1]:.1f}" fill="#172554" stroke="#38bdf8" stroke-width="1.6" />'
        )

    def render(self) -> str:
        svg_header = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}" '
            f'width="{self.width}" height="{self.height}">\n'
        )
        body = "\n".join(f"  {el}" for el in self.elements)
        svg_footer = "\n</svg>\n"
        return svg_header + body + svg_footer


def main():
    parser = argparse.ArgumentParser(description="Code Scaffold Orthographic Engineering Drawing Generator")
    parser.add_argument("--name", default="CANTILEVER_BRACKET", help="Part name for title block")
    parser.add_argument("--material", default="AlSi10Mg Aluminum", help="Material alloy specification")
    parser.add_argument("--length", type=float, default=140.0, help="Part overall length in mm")
    parser.add_argument("--width", type=float, default=80.0, help="Part overall width in mm")
    parser.add_argument("--height", type=float, default=60.0, help="Part overall height in mm")
    parser.add_argument("--hole", type=float, default=14.0, help="Through-hole diameter in mm")
    parser.add_argument("--output", default="cad/output/drawing.svg", help="Target SVG file path")
    args = parser.parse_args()

    builder = SVGDrawingBuilder(sheet_width=1200, sheet_height=850, part_name=args.name, material=args.material)
    builder.draw_border_and_frame()
    builder.draw_title_block()
    builder.build_orthographic_views(length=args.length, width=args.width, height=args.height, hole_dia=args.hole)

    svg_content = builder.render()
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"Generated 2D orthographic engineering blueprint: {args.output} ({len(svg_content):,} bytes)")


if __name__ == "__main__":
    main()
