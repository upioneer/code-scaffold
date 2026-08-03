import json
import argparse
import sys
import traceback
from typing import Dict, Any

try:
    from build123d import *
except ImportError:
    print("Error: build123d is not installed. Please 'pip install build123d'")
    sys.exit(1)

def resolve_param(val, params: Dict[str, Any]):
    """Resolve string parameter references to their actual numeric values."""
    if isinstance(val, str) and val in params:
        return params[val]
    return val

def execute_json_cad(json_data: Dict[str, Any], output_path: str = None) -> Part:
    """
    Executes a structured JSON CAD schema and returns the final build123d Part.
    Supports parametric references and basic geometric operations.
    """
    version = json_data.get("version", "1.0")
    params = json_data.get("parameters", {})
    operations = json_data.get("operations", [])
    
    parts_dict = {}
    final_part = None
    
    for op in operations:
        op_id = op.get("id")
        op_type = op.get("type", "").lower()
        
        try:
            if op_type == "box":
                w = resolve_param(op.get("width", 10), params)
                d = resolve_param(op.get("depth", 10), params)
                h = resolve_param(op.get("height", 10), params)
                parts_dict[op_id] = Box(w, d, h)
                
            elif op_type == "cylinder":
                r = resolve_param(op.get("radius", 5), params)
                h = resolve_param(op.get("height", 10), params)
                pos = op.get("position", [0, 0, 0])
                pos = [resolve_param(p, params) for p in pos]
                
                cyl = Cylinder(r, h)
                cyl = cyl.locate(Location(pos))
                parts_dict[op_id] = cyl
                
            elif op_type == "sphere":
                r = resolve_param(op.get("radius", 5), params)
                parts_dict[op_id] = Sphere(r)
                
            elif op_type == "boolean":
                action = op.get("operation", "subtract").lower()
                target_id = op.get("target")
                tool_id = op.get("tool")
                
                if target_id not in parts_dict or tool_id not in parts_dict:
                    raise ValueError(f"Boolean operation references missing ids: target={target_id}, tool={tool_id}")
                
                target = parts_dict[target_id]
                tool = parts_dict[tool_id]
                
                if action == "subtract":
                    parts_dict[op_id] = target - tool
                elif action == "union":
                    parts_dict[op_id] = target + tool
                elif action == "intersect":
                    parts_dict[op_id] = target & tool
                else:
                    raise ValueError(f"Unknown boolean operation: {action}")
                    
            elif op_type == "fillet":
                target_id = op.get("target")
                radius = resolve_param(op.get("radius", 1.0), params)
                target = parts_dict[target_id]
                
                # Simplified: fillet all edges
                parts_dict[op_id] = fillet(target.edges(), radius=radius)
                
            else:
                print(f"Warning: Unknown operation type '{op_type}' in node '{op_id}'")
                continue
                
            final_part = parts_dict[op_id]
            
        except Exception as e:
            print(f"Error processing operation '{op_id}': {e}")
            traceback.print_exc()
            sys.exit(1)
            
    if output_path and final_part:
        if output_path.lower().endswith(".step"):
            final_part.export_step(output_path)
            print(f"Successfully exported to {output_path}")
        elif output_path.lower().endswith(".stl"):
            final_part.export_stl(output_path)
            print(f"Successfully exported to {output_path}")
        else:
            print(f"Unsupported export extension for {output_path}. Supported: .step, .stl")
            
    return final_part

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JSON-to-CAD Interoperability Engine")
    parser.add_argument("input_json", help="Path to the JSON parametric model file")
    parser.add_argument("--export", help="Path to export the final model (e.g., output.step or output.stl)", default=None)
    args = parser.parse_args()
    
    try:
        with open(args.input_json, "r") as f:
            data = json.load(f)
        execute_json_cad(data, args.export)
    except FileNotFoundError:
        print(f"Error: Could not find file {args.input_json}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: {args.input_json} is not valid JSON.")
        sys.exit(1)
