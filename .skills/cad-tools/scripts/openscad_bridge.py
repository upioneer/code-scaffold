#!/usr/bin/env node
# -*- coding: utf-8 -*-
"""
OpenSCAD Parametric Automation Bridge for CAD Tools Skill
Compiles, inspects, and synthesizes parametric OpenSCAD (.scad) designs headlessly.
Features automatic binary discovery, parameter override injection (-D), Customizer metadata parsing,
and multi-format compilation (STL, 3MF, DXF, PNG, CSG).
"""

import sys
import os
import subprocess
import shutil
import re
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

COMMON_OPENSCAD_PATHS = [
    # Windows
    r"C:\Program Files\OpenSCAD\openscad.exe",
    r"C:\Program Files (x86)\OpenSCAD\openscad.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\OpenSCAD\openscad.exe"),
    # macOS
    "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
    # Linux
    "/usr/bin/openscad",
    "/usr/local/bin/openscad",
    "/snap/bin/openscad"
]

def find_openscad_binary() -> Optional[str]:
    """Locate the OpenSCAD executable in PATH or standard system installation directories."""
    # 1. Check PATH
    bin_in_path = shutil.which("openscad") or shutil.which("openscad.exe")
    if bin_in_path:
        return bin_in_path
    
    # 2. Check well-known install locations
    for candidate in COMMON_OPENSCAD_PATHS:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK if os.name != 'nt' else os.R_OK):
            return candidate
    
    return None

def parse_scad_parameters(scad_content: str) -> Dict[str, Dict[str, Any]]:
    """
    Parses top-level parametric variables and OpenSCAD Customizer annotations.
    Extracts variable names, default values, types, and parameter range boundaries.
    """
    params = {}
    
    # Only parse the top-level parameter block before module or function definitions
    top_block = re.split(r'\b(?:module|function)\b', scad_content, maxsplit=1)[0]
    
    line_pattern = re.compile(
        r'^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)[ \t]*=[ \t]*([^;]+);[ \t]*(?://[ \t]*(.*))?$',
        re.MULTILINE
    )
    
    for match in line_pattern.finditer(top_block):
        name = match.group(1).strip()
        raw_val = match.group(2).strip()
        comment = (match.group(3) or "").strip()
        
        # Skip special OpenSCAD variables like $fn, $fa, $fs unless specifically desired
        parsed_val = raw_val
        val_type = "string"
        
        # Determine value type
        if re.match(r'^-?\d+$', raw_val):
            parsed_val = int(raw_val)
            val_type = "integer"
        elif re.match(r'^-?\d+\.\d+$', raw_val):
            parsed_val = float(raw_val)
            val_type = "float"
        elif raw_val in ("true", "false"):
            parsed_val = (raw_val == "true")
            val_type = "boolean"
        elif raw_val.startswith('"') and raw_val.endswith('"'):
            parsed_val = raw_val[1:-1]
            val_type = "string"
        elif raw_val.startswith('[') and raw_val.endswith(']'):
            val_type = "vector"
        
        # Extract customizer range or description
        range_match = re.search(r'\[([^\]]+)\]', comment)
        options = None
        description = comment
        
        if range_match:
            range_str = range_match.group(1).strip()
            description = comment.replace(f"[{range_str}]", "").strip()
            if ":" in range_str:
                parts = [p.strip() for p in range_str.split(":")]
                options = {"type": "range", "bounds": parts}
            elif "," in range_str:
                parts = [p.strip() for p in range_str.split(",")]
                options = {"type": "enum", "values": parts}
        
        params[name] = {
            "default": parsed_val,
            "type": val_type,
            "raw": raw_val,
            "options": options,
            "description": description
        }
        
    return params

def build_parameter_override_flags(overrides: Dict[str, Any]) -> List[str]:
    """Generates OpenSCAD CLI -D parameter override flags."""
    flags = []
    for k, v in overrides.items():
        if isinstance(v, bool):
            formatted_val = "true" if v else "false"
        elif isinstance(v, (int, float)):
            formatted_val = str(v)
        elif isinstance(v, str):
            formatted_val = f'"{v}"'
        elif isinstance(v, (list, tuple)):
            formatted_val = f'[{",".join(str(x) for x in v)}]'
        else:
            formatted_val = str(v)
            
        flags.extend(["-D", f"{k}={formatted_val}"])
    return flags

def compile_scad(
    scad_path: str,
    output_path: str,
    parameters: Optional[Dict[str, Any]] = None,
    img_size: Tuple[int, int] = (1024, 768),
    camera: Optional[str] = None,
    colorscheme: str = "Cornfield"
) -> Dict[str, Any]:
    """
    Compiles an OpenSCAD script into a target CAD artifact or render snapshot.
    Supports STL, 3MF, DXF, SVG, CSG, and PNG.
    """
    openscad_bin = find_openscad_binary()
    if not openscad_bin:
        raise FileNotFoundError(
            "OpenSCAD executable not found on host. "
            "Please install OpenSCAD (https://openscad.org/downloads.html) or ensure it is in PATH."
        )
    
    scad_file = Path(scad_path).resolve()
    if not scad_file.is_file():
        raise FileNotFoundError(f"Source OpenSCAD file not found: {scad_file}")
    
    out_file = Path(output_path).resolve()
    out_file.parent.mkdir(parents=True, exist_ok=True)
    
    cmd = [openscad_bin, "-o", str(out_file)]
    
    # Append parameter overrides
    if parameters:
        cmd.extend(build_parameter_override_flags(parameters))
        
    # Append render options if exporting an image
    if out_file.suffix.lower() in (".png", ".jpg", ".jpeg"):
        cmd.extend([
            f"--imgsize={img_size[0]},{img_size[1]}",
            f"--colorscheme={colorscheme}"
        ])
        if camera:
            cmd.extend([f"--camera={camera}"])
            
    cmd.append(str(scad_file))
    
    # Execute headless compilation
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return {
            "success": True,
            "output_file": str(out_file),
            "command": " ".join(cmd),
            "stdout": proc.stdout,
            "stderr": proc.stderr
        }
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "output_file": str(out_file),
            "command": " ".join(cmd),
            "error": e.stderr or e.stdout or str(e)
        }

SCAD_TEMPLATES = {
    "chassis_bracket": """// Parametric Chassis Mounting Bracket
// Generated by Code Scaffold CAD Tools Skill

// [Dimensions]
bracket_width  = 60.0; // [20:150] Width of bracket
bracket_depth  = 40.0; // [20:150] Depth of mounting base
bracket_height = 35.0; // [10:100] Height of upright flange
wall_thickness = 4.0;  // [2:12] Nominal wall thickness
fillet_radius  = 5.0;  // [1:15] Interior stiffener fillet

// [Fasteners]
hole_diameter  = 5.2;  // [2.0:10.0] M5 screw clearance
hole_spacing   = 30.0; // [10:100] Hole center-to-center spacing

// [Resolution]
$fn = 64;

module mounting_hole(pos) {
    translate(pos)
        cylinder(h = wall_thickness * 3, d = hole_diameter, center = true);
}

module chassis_bracket() {
    difference() {
        union() {
            // Base plate
            cube([bracket_width, bracket_depth, wall_thickness]);
            
            // Upright flange
            cube([bracket_width, wall_thickness, bracket_height]);
            
            // Stiffening triangular gusset (center)
            translate([bracket_width/2 - wall_thickness/2, 0, 0])
                polyhedron(
                    points = [
                        [0, 0, 0],
                        [wall_thickness, 0, 0],
                        [wall_thickness, bracket_depth - wall_thickness, 0],
                        [0, bracket_depth - wall_thickness, 0],
                        [0, wall_thickness, bracket_height - wall_thickness],
                        [wall_thickness, wall_thickness, bracket_height - wall_thickness]
                    ],
                    faces = [
                        [0, 1, 2, 3], // Bottom
                        [4, 5, 1, 0], // Back
                        [2, 5, 4, 3], // Slanted front
                        [0, 3, 4],    // Left side
                        [1, 5, 2]     // Right side
                    ]
                );
        }
        
        // Base mounting holes
        mounting_hole([bracket_width/2 - hole_spacing/2, bracket_depth/2 + wall_thickness/2, 0]);
        mounting_hole([bracket_width/2 + hole_spacing/2, bracket_depth/2 + wall_thickness/2, 0]);
        
        // Upright mounting slot / hole
        translate([bracket_width/2, wall_thickness/2, bracket_height/2 + wall_thickness/2])
            rotate([90, 0, 0])
                cylinder(h = wall_thickness * 3, d = hole_diameter, center = true);
    }
}

chassis_bracket();
""",
    "electronics_enclosure": """// Parametric Electronics Enclosure Box
// Generated by Code Scaffold CAD Tools Skill

// [Enclosure Outer Dimensions]
box_length    = 90.0;  // [30:250] Outer box length
box_width     = 60.0;  // [20:180] Outer box width
box_height    = 30.0;  // [10:100] Outer box height
wall_thick    = 2.4;   // [1.2:5.0] Wall thickness
corner_radius = 4.0;   // [0:10] Outer corner rounding

// [Mounting Bosses]
boss_diameter = 6.0;   // [4.0:10.0] Internal screw boss diameter
boss_hole_d   = 2.8;   // [1.5:4.5] M3 heat-set or thread-forming hole
lip_clearance = 0.25;  // [0.1:0.5] Snap/fit clearance

$fn = 48;

module rounded_box(l, w, h, r) {
    if (r <= 0) {
        cube([l, w, h]);
    } else {
        hull() {
            translate([r, r, 0]) cylinder(h = h, r = r);
            translate([l - r, r, 0]) cylinder(h = h, r = r);
            translate([r, w - r, 0]) cylinder(h = h, r = r);
            translate([l - r, w - r, 0]) cylinder(h = h, r = r);
        }
    }
}

module enclosure_base() {
    difference() {
        // Outer body
        rounded_box(box_length, box_width, box_height, corner_radius);
        
        // Inner cavity
        translate([wall_thick, wall_thick, wall_thick])
            rounded_box(
                box_length - 2*wall_thick,
                box_width  - 2*wall_thick,
                box_height,
                max(0.1, corner_radius - wall_thick)
            );
    }
    
    // Corner screw bosses
    for (pos = [
        [wall_thick + boss_diameter/2, wall_thick + boss_diameter/2],
        [box_length - wall_thick - boss_diameter/2, wall_thick + boss_diameter/2],
        [wall_thick + boss_diameter/2, box_width - wall_thick - boss_diameter/2],
        [box_length - wall_thick - boss_diameter/2, box_width - wall_thick - boss_diameter/2]
    ]) {
        translate([pos[0], pos[1], wall_thick]) {
            difference() {
                cylinder(h = box_height - wall_thick - 2, d = boss_diameter);
                cylinder(h = box_height, d = boss_hole_d);
            }
        }
    }
}

enclosure_base();
"""
}

def main():
    parser = argparse.ArgumentParser(description="OpenSCAD Parametric Automation Bridge")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")
    
    # 1. Inspect command
    inspect_parser = subparsers.add_parser("inspect", help="Inspect and extract parameters from .scad file")
    inspect_parser.add_argument("scad_file", help="Path to .scad source file")
    inspect_parser.add_argument("--json", action="store_true", help="Output results as structured JSON")
    
    # 2. Render command
    render_parser = subparsers.add_parser("render", help="Compile .scad into STL, 3MF, DXF, or PNG")
    render_parser.add_argument("scad_file", help="Path to .scad source file")
    render_parser.add_argument("-o", "--output", required=True, help="Path to destination file (.stl, .3mf, .dxf, .png)")
    render_parser.add_argument("-D", "--param", action="append", help="Parameter override, e.g. -D width=75 -D wall=3.5")
    render_parser.add_argument("--imgsize", default="1024,768", help="Image resolution for PNG rendering (W,H)")
    render_parser.add_argument("--camera", help="Camera view spec for image capture")
    
    # 3. Template command
    template_parser = subparsers.add_parser("template", help="Generate a standard parametric .scad template")
    template_parser.add_argument("type", choices=list(SCAD_TEMPLATES.keys()), help="Template type to generate")
    template_parser.add_argument("-o", "--output", help="Output .scad file path (defaults to stdout)")
    
    # 4. Diagnostics command
    subparsers.add_parser("status", help="Check host OpenSCAD installation and binary version")
    
    args = parser.parse_args()
    
    if args.command == "status":
        bin_path = find_openscad_binary()
        if bin_path:
            try:
                proc = subprocess.run([bin_path, "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                version_str = (proc.stderr or proc.stdout).strip()
            except Exception as e:
                version_str = f"Error querying version: {e}"
            print(f"[FOUND] OpenSCAD binary: {bin_path}")
            print(f"[VERSION] {version_str}")
        else:
            print("[NOT FOUND] OpenSCAD executable is not installed or not in system PATH.")
            print("Download and install from: https://openscad.org/downloads.html")
            sys.exit(1)
            
    elif args.command == "inspect":
        scad_path = Path(args.scad_file)
        if not scad_path.is_file():
            print(f"Error: File '{args.scad_file}' does not exist.", file=sys.stderr)
            sys.exit(1)
            
        content = scad_path.read_text(encoding="utf-8")
        params = parse_scad_parameters(content)
        
        if args.json:
            print(json.dumps(params, indent=2))
        else:
            print(f"=== OpenSCAD Parametric Blueprint: {scad_path.name} ===")
            print(f"Extracted {len(params)} configurable parameter(s):\n")
            for name, meta in params.items():
                range_str = f" [options: {meta['options']['bounds']}]" if meta.get("options") and meta["options"]["type"] == "range" else ""
                desc_str = f" - {meta['description']}" if meta.get("description") else ""
                print(f"  * {name:<18} = {str(meta['default']):<10} ({meta['type']}){range_str}{desc_str}")
                
    elif args.command == "render":
        params_dict = {}
        if args.param:
            for p in args.param:
                if "=" in p:
                    k, v = p.split("=", 1)
                    k = k.strip()
                    v = v.strip()
                    # Cast numbers
                    if re.match(r'^-?\d+$', v):
                        v = int(v)
                    elif re.match(r'^-?\d+\.\d+$', v):
                        v = float(v)
                    elif v in ("true", "false"):
                        v = (v == "true")
                    params_dict[k] = v
                    
        w, h = 1024, 768
        if args.imgsize:
            parts = args.imgsize.split(",")
            if len(parts) == 2:
                try:
                    w, h = int(parts[0]), int(parts[1])
                except ValueError:
                    pass
                    
        result = compile_scad(
            scad_path=args.scad_file,
            output_path=args.output,
            parameters=params_dict,
            img_size=(w, h),
            camera=args.camera
        )
        
        if result["success"]:
            print(f"[SUCCESS] Compiled {args.scad_file} -> {args.output}")
        else:
            print(f"[FAILURE] OpenSCAD compilation error:\n{result.get('error')}", file=sys.stderr)
            sys.exit(1)
            
    elif args.command == "template":
        scad_code = SCAD_TEMPLATES.get(args.type, "")
        if args.output:
            out_p = Path(args.output)
            out_p.parent.mkdir(parents=True, exist_ok=True)
            out_p.write_text(scad_code, encoding="utf-8")
            print(f"[SUCCESS] Wrote template '{args.type}' to {args.output}")
        else:
            print(scad_code)
            
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
