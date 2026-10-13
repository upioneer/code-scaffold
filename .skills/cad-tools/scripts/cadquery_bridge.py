#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CadQuery Parametric Automation Bridge for CAD Tools Skill
Executes native CadQuery (cq) parametric scripts headlessly, extracts configurable dimensions,
exports multi-format engineering solids (STEP, STL, 3MF, DXF), and provides automated
translation mappings to modern build123d architecture.
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional

def parse_cadquery_parameters(script_content: str) -> Dict[str, Dict[str, Any]]:
    """
    Extracts top-level uppercase or snake_case parameter constants from a CadQuery script.
    e.g. WIDTH = 60.0  # Width in mm
         HOLE_DIA = 5.2
    """
    params = {}
    
    # Match patterns like: PARAM_NAME = 60.0  # Description
    pattern = re.compile(
        r'^[ \t]*([A-Z_][A-Z0-9_]*|[a-z_][a-z0-9_]*)[ \t]*=[ \t]*([^#\n\r]+)(?:#[ \t]*(.*))?$',
        re.MULTILINE
    )
    
    # Only scan preamble lines before the first geometry invocation
    split_lines = script_content.splitlines()
    preamble = []
    for line in split_lines:
        if "cq.Workplane" in line or "BuildPart" in line or "def " in line or "class " in line:
            break
        preamble.append(line)
    preamble_text = "\n".join(preamble)
    
    for match in pattern.finditer(preamble_text):
        name = match.group(1).strip()
        raw_val = match.group(2).strip()
        comment = (match.group(3) or "").strip()
        
        # Skip import statements or non-numeric constants unless string
        if name in ("import", "from", "as", "True", "False", "None"):
            continue
            
        parsed_val = raw_val
        val_type = "string"
        
        if re.match(r'^-?\d+$', raw_val):
            parsed_val = int(raw_val)
            val_type = "integer"
        elif re.match(r'^-?\d+\.\d+$', raw_val):
            parsed_val = float(raw_val)
            val_type = "float"
        elif raw_val in ("True", "False"):
            parsed_val = (raw_val == "True")
            val_type = "boolean"
        elif (raw_val.startswith('"') and raw_val.endswith('"')) or (raw_val.startswith("'") and raw_val.endswith("'")):
            parsed_val = raw_val[1:-1]
            val_type = "string"
        else:
            # Mathematical expression, e.g. 20.0 / 2
            try:
                # Safe eval of basic math literals
                parsed_val = float(eval(raw_val, {"__builtins__": {}}, {}))
                val_type = "float"
            except Exception:
                continue
                
        params[name] = {
            "default": parsed_val,
            "type": val_type,
            "raw": raw_val,
            "description": comment
        }
        
    return params

def execute_cadquery_script(
    script_path: str,
    output_path: Optional[str] = None,
    parameters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes a CadQuery script in an isolated namespace, overriding parameters if specified,
    and exports the resulting solid geometry.
    """
    script_file = Path(script_path).resolve()
    if not script_file.is_file():
        raise FileNotFoundError(f"CadQuery script not found: {script_file}")
        
    script_code = script_file.read_text(encoding="utf-8")
    
    # Try importing cadquery
    try:
        import cadquery as cq
    except ImportError:
        return {
            "success": False,
            "error": (
                "cadquery is not installed in the active Python environment. "
                "Install via 'pip install cadquery' or use 'build123d' (the modern successor)."
            ),
            "script": str(script_file)
        }
        
    # Build global execution scope
    scope: Dict[str, Any] = {
        "__file__": str(script_file),
        "__name__": "__main__",
        "cq": cq
    }
    
    # Apply parameter overrides if provided
    if parameters:
        for k, v in parameters.items():
            scope[k] = v
            
    try:
        exec(compile(script_code, str(script_file), "exec"), scope)
    except Exception as e:
        return {
            "success": False,
            "error": f"Execution error in {script_file.name}: {str(e)}",
            "script": str(script_file)
        }
        
    # Locate exported model variable ('result', 'part', 'model', or last cq.Workplane object)
    candidate_obj = None
    for var_name in ("result", "part", "model", "assembly"):
        if var_name in scope:
            candidate_obj = scope[var_name]
            break
            
    if candidate_obj is None:
        for val in reversed(list(scope.values())):
            if isinstance(val, (cq.Workplane, cq.Assembly, cq.Shape)):
                candidate_obj = val
                break
                
    if candidate_obj is None:
        return {
            "success": False,
            "error": "No CadQuery solid object found in script namespace. Assign model to 'result' or 'part'.",
            "script": str(script_file)
        }
        
    # Perform export if output path provided
    if output_path:
        out_file = Path(output_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)
        ext = out_file.suffix.lower()
        
        try:
            if ext in (".step", ".stp"):
                cq.exporters.export(candidate_obj, str(out_file), cq.exporters.ExportTypes.STEP)
            elif ext == ".stl":
                cq.exporters.export(candidate_obj, str(out_file), cq.exporters.ExportTypes.STL)
            elif ext == ".dxf":
                cq.exporters.export(candidate_obj, str(out_file), cq.exporters.ExportTypes.DXF)
            elif ext == ".svg":
                cq.exporters.export(candidate_obj, str(out_file), cq.exporters.ExportTypes.SVG)
            elif ext == ".3mf":
                cq.exporters.export(candidate_obj, str(out_file), cq.exporters.ExportTypes.TMF)
            else:
                return {
                    "success": False,
                    "error": f"Unsupported export format extension: {ext}",
                    "script": str(script_file)
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Export error: {str(e)}",
                "script": str(script_file)
            }
            
        return {
            "success": True,
            "output_file": str(out_file),
            "script": str(script_file)
        }
        
    return {
        "success": True,
        "object_type": type(candidate_obj).__name__,
        "script": str(script_file)
    }

def convert_cadquery_to_build123d(cq_script_content: str) -> str:
    """
    Provides automated syntax conversion and translation scaffolding from CadQuery
    to modern build123d context architecture.
    """
    lines = cq_script_content.splitlines()
    b123d_lines = [
        '"""',
        'Model: Converted from CadQuery to build123d',
        'Engine: Code Scaffold CAD Tools Skill (build123d / OpenCASCADE)',
        '"""',
        '',
        'from build123d import *',
        ''
    ]
    
    in_geometry = False
    
    for line in lines:
        stripped = line.strip()
        
        # Replace imports
        if stripped.startswith("import cadquery") or stripped.startswith("from cadquery"):
            continue
            
        # Parameter lines retain 1:1 syntax
        if not in_geometry and ("=" in stripped and not stripped.startswith("result") and not stripped.startswith("part")):
            b123d_lines.append(line)
            continue
            
        # Detect start of geometry construction
        if "cq.Workplane" in stripped or stripped.startswith("result =") or stripped.startswith("part ="):
            in_geometry = True
            b123d_lines.append("")
            b123d_lines.append("# --- Geometry Construction (build123d) ---")
            b123d_lines.append("with BuildPart() as part:")
            
            # Extract plane
            plane_match = re.search(r'cq\.Workplane\(["\']([A-Z]+)["\']\)', stripped)
            plane_name = plane_match.group(1) if plane_match else "XY"
            
            # Map box
            box_match = re.search(r'\.box\(([^)]+)\)', stripped)
            if box_match:
                b123d_lines.append(f"    with BuildSketch(Plane.{plane_name}):")
                args = [a.strip() for a in box_match.group(1).split(",")]
                if len(args) == 3:
                    b123d_lines.append(f"        Rectangle({args[0]}, {args[1]})")
                    b123d_lines.append(f"    extrude(amount={args[2]})")
                else:
                    b123d_lines.append(f"        # Box: {box_match.group(1)}")
            continue
            
        if in_geometry:
            # Annotate chained calls
            if stripped.startswith(".faces("):
                b123d_lines.append(f"    # CadQuery selector: {stripped}")
            elif stripped.startswith(".hole("):
                hole_match = re.search(r'\.hole\(([^)]+)\)', stripped)
                if hole_match:
                    b123d_lines.append(f"    Hole(radius=({hole_match.group(1)}) / 2)")
            elif stripped.startswith(".fillet("):
                fillet_match = re.search(r'\.fillet\(([^)]+)\)', stripped)
                if fillet_match:
                    b123d_lines.append(f"    fillet(part.edges(), radius={fillet_match.group(1)})")
            elif stripped:
                b123d_lines.append(f"    # {stripped}")
        else:
            b123d_lines.append(line)
            
    b123d_lines.append("")
    b123d_lines.append("# --- Export Deliverables ---")
    b123d_lines.append("# part.part.export_step('cad/output/model.step')")
    b123d_lines.append("# part.part.export_stl('cad/output/model.stl')")
    
    return "\n".join(b123d_lines)

CADQUERY_TEMPLATES = {
    "chassis_bracket": """import cadquery as cq

# --- Parametric Dimensions (mm) ---
WIDTH = 60.0       # Base and upright width
DEPTH = 40.0       # Base plate depth
HEIGHT = 35.0      # Upright flange height
THICK = 4.0        # Wall thickness
HOLE_DIA = 5.2     # M5 clearance hole
HOLE_SPACING = 30.0

# --- Geometry Construction ---
# 1. Base Plate
base = (
    cq.Workplane("XY")
    .box(WIDTH, DEPTH, THICK)
    .faces(">Z")
    .workplane()
    .pushPoints([(-HOLE_SPACING/2, 0), (HOLE_SPACING/2, 0)])
    .hole(HOLE_DIA)
)

# 2. Upright Flange
upright = (
    cq.Workplane("XZ")
    .center(0, HEIGHT/2)
    .box(WIDTH, THICK, HEIGHT)
    .faces(">Y")
    .workplane()
    .hole(HOLE_DIA)
)

# 3. Combined Solid
result = base.union(upright.translate((0, -DEPTH/2 + THICK/2, THICK/2 + HEIGHT/2)))
""",
    "flange_coupling": """import cadquery as cq

# --- Parametric Dimensions (mm) ---
FLANGE_DIA = 100.0   # Outer flange diameter
THICKNESS = 12.0     # Flange thickness
BORE_DIA = 25.0      # Central shaft bore
PCD_DIA = 75.0       # Pitch circle diameter for bolt pattern
BOLT_HOLE_DIA = 8.5  # M8 clearance holes
NUM_BOLTS = 6        # Count of bolt holes around PCD

# --- Geometry Construction ---
result = (
    cq.Workplane("XY")
    .circle(FLANGE_DIA / 2.0)
    .extrude(THICKNESS)
    .faces(">Z")
    .workplane()
    .hole(BORE_DIA)
    .faces(">Z")
    .workplane()
    .polarArray(PCD_DIA / 2.0, 0, 360, NUM_BOLTS)
    .hole(BOLT_HOLE_DIA)
)
"""
}

def main():
    parser = argparse.ArgumentParser(description="CadQuery Parametric Automation Bridge")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")
    
    # 1. Inspect
    inspect_parser = subparsers.add_parser("inspect", help="Extract parametric dimensions from a CadQuery script")
    inspect_parser.add_argument("script_file", help="Path to CadQuery .py script")
    inspect_parser.add_argument("--json", action="store_true", help="Output results as JSON")
    
    # 2. Run
    run_parser = subparsers.add_parser("run", help="Execute CadQuery script and export solid geometry")
    run_parser.add_argument("script_file", help="Path to CadQuery .py script")
    run_parser.add_argument("-o", "--output", help="Export file path (.step, .stl, .dxf, .3mf)")
    run_parser.add_argument("-D", "--param", action="append", help="Parameter overrides, e.g. -D WIDTH=80")
    
    # 3. Convert
    convert_parser = subparsers.add_parser("convert", help="Transpile CadQuery script to modern build123d architecture")
    convert_parser.add_argument("script_file", help="Path to CadQuery .py script")
    convert_parser.add_argument("-o", "--output", help="Destination file path for build123d script")
    
    # 4. Template
    template_parser = subparsers.add_parser("template", help="Generate a standard CadQuery parametric script")
    template_parser.add_argument("type", choices=list(CADQUERY_TEMPLATES.keys()), help="Template type")
    template_parser.add_argument("-o", "--output", help="Output file path (defaults to stdout)")
    
    args = parser.parse_args()
    
    if args.command == "inspect":
        script_path = Path(args.script_file)
        if not script_path.is_file():
            print(f"Error: Script '{args.script_file}' does not exist.", file=sys.stderr)
            sys.exit(1)
            
        params = parse_cadquery_parameters(script_path.read_text(encoding="utf-8"))
        if args.json:
            print(json.dumps(params, indent=2))
        else:
            print(f"=== CadQuery Parametric Blueprint: {script_path.name} ===")
            print(f"Extracted {len(params)} configurable parameter(s):\n")
            for name, meta in params.items():
                desc_str = f" - {meta['description']}" if meta.get("description") else ""
                print(f"  * {name:<16} = {str(meta['default']):<10} ({meta['type']}){desc_str}")
                
    elif args.command == "template":
        cq_code = CADQUERY_TEMPLATES.get(args.type, "")
        if args.output:
            out_p = Path(args.output)
            out_p.parent.mkdir(parents=True, exist_ok=True)
            out_p.write_text(cq_code, encoding="utf-8")
            print(f"[SUCCESS] Wrote CadQuery template '{args.type}' to {args.output}")
        else:
            print(cq_code)
            
    elif args.command == "convert":
        script_path = Path(args.script_file)
        if not script_path.is_file():
            print(f"Error: Script '{args.script_file}' does not exist.", file=sys.stderr)
            sys.exit(1)
            
        b123d_code = convert_cadquery_to_build123d(script_path.read_text(encoding="utf-8"))
        if args.output:
            out_p = Path(args.output)
            out_p.parent.mkdir(parents=True, exist_ok=True)
            out_p.write_text(b123d_code, encoding="utf-8")
            print(f"[SUCCESS] Transpiled '{args.script_file}' -> '{args.output}'")
        else:
            print(b123d_code)
            
    elif args.command == "run":
        overrides = {}
        if args.param:
            for p in args.param:
                if "=" in p:
                    k, v = p.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if re.match(r'^-?\d+$', v):
                        v = int(v)
                    elif re.match(r'^-?\d+\.\d+$', v):
                        v = float(v)
                    elif v in ("True", "False"):
                        v = (v == "True")
                    overrides[k] = v
                    
        result = execute_cadquery_script(args.script_file, args.output, overrides)
        if result["success"]:
            print(f"[SUCCESS] Executed CadQuery script: {result.get('output_file', 'model generated')}")
        else:
            print(f"[FAILURE] CadQuery execution error:\n{result.get('error')}", file=sys.stderr)
            sys.exit(1)
            
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
