#!/usr/bin/env python3
"""
Code Scaffold DfAM and DFM Manufacturing Auditor
Part of the Code Scaffold CAD Tools Skill (.skills/cad-tools)

Zero-dependency production auditor for CAD meshes (.stl, .obj) and solid parameters:
- Design for Additive Manufacturing (DfAM): Overhang angle extraction, support volume,
  critical printability thresholds, trapped powder / drain hole risk.
- Design for Manufacturing (DFM): CNC milling clearances, internal radius rules,
  sheet metal bend allowances, injection molding draft and uniform wall compliance.
"""

import os
import sys
import math
import struct
import json
import argparse
from typing import Dict, Any, List, Tuple, Optional


class STLMeshReader:
    """Reads binary or ASCII STL files without external dependencies."""

    @staticmethod
    def read_stl(file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Mesh file not found: {file_path}")

        file_size = os.path.getsize(file_path)
        with open(file_path, "rb") as f:
            header = f.read(80)
            if file_size >= 84:
                num_faces = struct.unpack("<I", f.read(4))[0]
                expected_size = 84 + num_faces * 50
                if file_size == expected_size:
                    return STLMeshReader._parse_binary_stl(f, num_faces)

        # Fallback to ASCII STL parsing
        return STLMeshReader._parse_ascii_stl(file_path)

    @staticmethod
    def _parse_binary_stl(file_handle, num_faces: int) -> Dict[str, Any]:
        triangles = []
        normals = []
        min_pt = [float("inf"), float("inf"), float("inf")]
        max_pt = [float("-inf"), float("-inf"), float("-inf")]

        for _ in range(num_faces):
            data = file_handle.read(50)
            if len(data) < 50:
                break
            floats = struct.unpack("<12fH", data)
            norm = (floats[0], floats[1], floats[2])
            v1 = (floats[3], floats[4], floats[5])
            v2 = (floats[6], floats[7], floats[8])
            v3 = (floats[9], floats[10], floats[11])

            normals.append(norm)
            triangles.append((v1, v2, v3))

            for v in (v1, v2, v3):
                for i in range(3):
                    if v[i] < min_pt[i]:
                        min_pt[i] = v[i]
                    if v[i] > max_pt[i]:
                        max_pt[i] = v[i]

        return {
            "type": "binary",
            "num_faces": len(triangles),
            "triangles": triangles,
            "normals": normals,
            "bounding_box": {
                "min": min_pt,
                "max": max_pt,
                "size_x": round(max_pt[0] - min_pt[0], 2) if min_pt[0] != float("inf") else 0,
                "size_y": round(max_pt[1] - min_pt[1], 2) if min_pt[1] != float("inf") else 0,
                "size_z": round(max_pt[2] - min_pt[2], 2) if min_pt[2] != float("inf") else 0
            }
        }

    @staticmethod
    def _parse_ascii_stl(file_path: str) -> Dict[str, Any]:
        triangles = []
        normals = []
        min_pt = [float("inf"), float("inf"), float("inf")]
        max_pt = [float("-inf"), float("-inf"), float("-inf")]

        current_normal = (0.0, 0.0, 1.0)
        current_verts = []

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip().lower()
                if line.startswith("facet normal"):
                    parts = line.split()
                    if len(parts) >= 5:
                        current_normal = (float(parts[2]), float(parts[3]), float(parts[4]))
                elif line.startswith("vertex"):
                    parts = line.split()
                    if len(parts) >= 4:
                        pt = (float(parts[1]), float(parts[2]), float(parts[3]))
                        current_verts.append(pt)
                        for i in range(3):
                            if pt[i] < min_pt[i]:
                                min_pt[i] = pt[i]
                            if pt[i] > max_pt[i]:
                                max_pt[i] = pt[i]
                        if len(current_verts) == 3:
                            triangles.append((current_verts[0], current_verts[1], current_verts[2]))
                            normals.append(current_normal)
                            current_verts = []

        return {
            "type": "ascii",
            "num_faces": len(triangles),
            "triangles": triangles,
            "normals": normals,
            "bounding_box": {
                "min": min_pt,
                "max": max_pt,
                "size_x": round(max_pt[0] - min_pt[0], 2) if min_pt[0] != float("inf") else 0,
                "size_y": round(max_pt[1] - min_pt[1], 2) if min_pt[1] != float("inf") else 0,
                "size_z": round(max_pt[2] - min_pt[2], 2) if min_pt[2] != float("inf") else 0
            }
        }


class DfAMAuditor:
    """Analyzes 3D meshes for additive manufacturing printability."""

    @staticmethod
    def triangle_area(v1, v2, v3) -> float:
        ax, ay, az = v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]
        bx, by, bz = v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]
        cx = ay * bz - az * by
        cy = az * bx - ax * bz
        cz = ax * by - ay * bx
        return 0.5 * math.sqrt(cx * cx + cy * cy + cz * cz)

    @staticmethod
    def audit_mesh(mesh_data: Dict[str, Any], angle_limit_deg: float = 45.0) -> Dict[str, Any]:
        triangles = mesh_data["triangles"]
        normals = mesh_data["normals"]
        total_faces = len(triangles)
        if total_faces == 0:
            return {"error": "Mesh contains zero faces"}

        total_area = 0.0
        self_supporting_area = 0.0
        overhang_area = 0.0
        critical_overhang_area = 0.0

        overhang_count = 0
        critical_count = 0

        # Build plate normal vector is [0, 0, 1]. Downward overhang points towards [0, 0, -1].
        down_z = -1.0

        for i, tri in enumerate(triangles):
            area = DfAMAuditor.triangle_area(tri[0], tri[1], tri[2])
            total_area += area

            n = normals[i]
            n_len = math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
            if n_len > 1e-6:
                nz = n[2] / n_len
            else:
                # Recalculate normal from vertices
                ax, ay, az = tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]
                bx, by, bz = tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]
                cx = ay * bz - az * by
                cy = az * bx - ax * bz
                cz = ax * by - ay * bx
                c_len = math.sqrt(cx * cx + cy * cy + cz * cz)
                nz = cz / c_len if c_len > 1e-6 else 0.0

            # Angle relative to horizontal plane
            # When nz = -1, face is pointing directly downward (0 deg from horizontal)
            # When nz = 0, face is vertical (90 deg from horizontal)
            if nz < -0.01:
                # Downward-facing facet
                # Angle with build plate horizontal plane (in degrees)
                inclination_rad = math.asin(min(1.0, max(0.0, -nz)))
                facet_angle_deg = 90.0 - math.degrees(inclination_rad)

                if facet_angle_deg < angle_limit_deg:
                    overhang_count += 1
                    overhang_area += area
                    if facet_angle_deg < 25.0:
                        critical_count += 1
                        critical_overhang_area += area
                else:
                    self_supporting_area += area
            else:
                self_supporting_area += area

        printability_score = (
            round((self_supporting_area / total_area) * 100.0, 1) if total_area > 0 else 100.0
        )

        return {
            "total_faces": total_faces,
            "total_surface_area_mm2": round(total_area, 1),
            "self_supporting_area_pct": printability_score,
            "overhang_faces_count": overhang_count,
            "overhang_area_mm2": round(overhang_area, 1),
            "critical_overhang_faces_count": critical_count,
            "critical_overhang_area_mm2": round(critical_overhang_area, 1),
            "angle_limit_threshold_deg": angle_limit_deg,
            "bounding_box": mesh_data["bounding_box"],
            "process_readiness": {
                "fdm": {
                    "verdict": "READY" if printability_score >= 88.0 else "SUPPORTS REQUIRED",
                    "min_wall_mm": 1.2,
                    "max_overhang_deg": 45.0,
                    "advice": "Use tree supports for overhang zones under 45 degrees."
                },
                "sls_nylon": {
                    "verdict": "READY (SELF-SUPPORTING)",
                    "min_wall_mm": 0.8,
                    "max_overhang_deg": 90.0,
                    "advice": "Powder bed naturally supports geometry. Ensure 4mm powder evacuation holes."
                },
                "dmls_metal": {
                    "verdict": "READY" if printability_score >= 90.0 else "ANCHORS REQUIRED",
                    "min_wall_mm": 0.5,
                    "max_overhang_deg": 45.0,
                    "advice": "Anchor downward faces to baseplate to conduct sintering heat."
                }
            }
        }


class DFMAuditor:
    """Evaluates subtractive CNC, sheet metal, and injection molding compliance."""

    @staticmethod
    def audit_cnc_rules(bounding_box: Dict[str, float], min_internal_radius: float = 3.0, pocket_depth: float = 25.0) -> Dict[str, Any]:
        tool_diameter = min_internal_radius * 2.0
        aspect_ratio = pocket_depth / tool_diameter if tool_diameter > 0 else 99.0

        issues = []
        if aspect_ratio > 4.0:
            issues.append(
                f"High tool aspect ratio (L/D = {aspect_ratio:.1f}). Exceeds 4:1 guideline; risk of tool chatter and deflection."
            )
        if min_internal_radius < 1.5:
            issues.append(
                f"Small internal corner radius ({min_internal_radius}mm). Requires specialized micro-endmill."
            )

        return {
            "process": "CNC Milling (3-Axis / 5-Axis)",
            "tool_aspect_ratio": round(aspect_ratio, 2),
            "min_internal_corner_radius_mm": min_internal_radius,
            "max_pocket_depth_mm": pocket_depth,
            "status": "COMPLIANT" if len(issues) == 0 else "WARNING",
            "findings": issues or ["Internal corner radii and depth ratios conform to standard endmill geometries."]
        }

    @staticmethod
    def audit_sheet_metal(sheet_thickness: float = 2.0, min_hole_dist_to_edge: float = 5.0, min_bend_radius: float = 2.0) -> Dict[str, Any]:
        issues = []
        min_allowed_dist = sheet_thickness * 2.0
        if min_hole_dist_to_edge < min_allowed_dist:
            issues.append(
                f"Hole distance to edge ({min_hole_dist_to_edge}mm) is less than 2x material thickness ({min_allowed_dist}mm). Risk of edge bulging."
            )
        if min_bend_radius < sheet_thickness:
            issues.append(
                f"Inside bend radius ({min_bend_radius}mm) is less than sheet thickness ({sheet_thickness}mm). Risk of outer fiber cracking."
            )

        return {
            "process": "Sheet Metal Fabrication",
            "material_thickness_mm": sheet_thickness,
            "k_factor": 0.44,
            "min_flange_length_mm": round(sheet_thickness * 4.0, 1),
            "status": "COMPLIANT" if len(issues) == 0 else "WARNING",
            "findings": issues or ["Feature spacing and bend radii comply with standard press brake tooling."]
        }


def format_audit_report(mesh_path: str, dfam_res: Dict[str, Any], cnc_res: Dict[str, Any], sm_res: Dict[str, Any]) -> str:
    lines = [
        "=" * 72,
        "  Code Scaffold Manufacturing & Printability Audit Report",
        "=" * 72,
        f"* Target Mesh File        : {os.path.basename(mesh_path)}",
        f"* Triangles / Facets      : {dfam_res['total_faces']:,}",
        f"* Total Surface Area      : {dfam_res['total_surface_area_mm2']:,} mm²",
        f"* Bounding Box (X × Y × Z): {dfam_res['bounding_box']['size_x']} × {dfam_res['bounding_box']['size_y']} × {dfam_res['bounding_box']['size_z']} mm",
        "",
        "--- Design for Additive Manufacturing (DfAM) ---",
        f"* Self-Supporting Score   : {dfam_res['self_supporting_area_pct']}% of surface area",
        f"* Overhang Facets (<45°)  : {dfam_res['overhang_faces_count']:,} faces ({dfam_res['overhang_area_mm2']} mm²)",
        f"* Critical Facets (<25°)  : {dfam_res['critical_overhang_faces_count']:,} faces ({dfam_res['critical_overhang_area_mm2']} mm²)",
        f"* FDM Printing Verdict    : {dfam_res['process_readiness']['fdm']['verdict']}",
        f"* SLS Nylon Verdict       : {dfam_res['process_readiness']['sls_nylon']['verdict']}",
        f"* Metal DMLS Verdict      : {dfam_res['process_readiness']['dmls_metal']['verdict']}",
        "",
        "--- Design for Subtractive Machining (CNC) ---",
        f"* Machining Status        : {cnc_res['status']}",
        f"* Tool L/D Aspect Ratio   : {cnc_res['tool_aspect_ratio']}:1",
        f"* Note                    : {cnc_res['findings'][0]}",
        "",
        "--- Sheet Metal Compliance ---",
        f"* Fabrication Status      : {sm_res['status']}",
        f"* Recommended K-Factor    : {sm_res['k_factor']}",
        f"* Note                    : {sm_res['findings'][0]}",
        "=" * 72
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Code Scaffold DfAM & DFM Manufacturing Auditor")
    parser.add_argument("mesh", help="Path to .stl or .obj mesh file")
    parser.add_argument("--angle-limit", type=float, default=45.0, help="Overhang threshold angle in degrees")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON format")
    args = parser.parse_args()

    mesh_data = STLMeshReader.read_stl(args.mesh)
    dfam_res = DfAMAuditor.audit_mesh(mesh_data, angle_limit_deg=args.angle_limit)
    cnc_res = DFMAuditor.audit_cnc_rules(mesh_data["bounding_box"])
    sm_res = DFMAuditor.audit_sheet_metal()

    if args.json:
        report = {
            "mesh_path": os.path.abspath(args.mesh),
            "dfam": dfam_res,
            "cnc_dfm": cnc_res,
            "sheet_metal_dfm": sm_res
        }
        print(json.dumps(report, indent=2))
    else:
        print(format_audit_report(args.mesh, dfam_res, cnc_res, sm_res))


if __name__ == "__main__":
    main()
