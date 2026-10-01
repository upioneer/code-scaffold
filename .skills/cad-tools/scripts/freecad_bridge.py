#!/usr/bin/env python3
"""
Parametric CAD Connector and FreeCAD Automation Bridge
Part of the Code Scaffold CAD Tools Skill (.skills/cad-tools)

Provides client interfaces for communicating with FreeCAD via Streamable HTTP / SSE
socket connections, headless CLI batch execution, and parametric script synthesis.

Zero external dependencies: uses only Python stdlib (urllib, json, subprocess, sys, os).
"""

import os
import sys
import json
import argparse
import subprocess
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

class FreeCADMCPClient:
    """Client for communicating with FreeCAD AI Socket Bridge over HTTP/SSE."""

    def __init__(self, base_url: str = "http://127.0.0.1:3000", auth_token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token or os.environ.get("MCP_AUTH_TOKEN")
        self.session_id: Optional[str] = None
        self._request_id = 0

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        return headers

    def send_rpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send a JSON-RPC 2.0 request to the FreeCAD MCP endpoint."""
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params or {}
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/mcp",
            data=data,
            headers=self._get_headers(),
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if "Mcp-Session-Id" in resp.headers:
                    self.session_id = resp.headers["Mcp-Session-Id"]
                raw_response = resp.read().decode("utf-8")
                return json.loads(raw_response)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} Error from FreeCAD socket: {err_body}")
        except urllib.error.URLError as e:
            raise RuntimeError(f"Could not connect to FreeCAD at {self.base_url}: {e.reason}")

    def initialize(self) -> Dict[str, Any]:
        """Perform MCP initialization handshake."""
        params = {
            "protocolVersion": "2025-11-25",
            "clientInfo": {
                "name": "Code-Scaffold-CAD-Bridge",
                "version": "1.0.0"
            },
            "capabilities": {
                "tools": {}
            }
        }
        return self.send_rpc("initialize", params)

    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available tools exposed by the FreeCAD AI socket."""
        res = self.send_rpc("tools/list")
        if "error" in res:
            raise RuntimeError(f"tools/list error: {res['error']}")
        return res.get("result", {}).get("tools", [])

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a structured FreeCAD operation tool."""
        res = self.send_rpc("tools/call", {"name": name, "arguments": arguments})
        if "error" in res:
            raise RuntimeError(f"Tool execution failed ({name}): {res['error']}")
        return res.get("result", {})


class HeadlessFreeCADRunner:
    """Executes Python automation scripts headlessly via FreeCAD CLI."""

    @staticmethod
    def sanitize_env() -> Dict[str, str]:
        """Sanitize environment variables to prevent AppImage library collisions."""
        env = dict(os.environ)
        for key in ("PYTHONHOME", "PYTHONPATH"):
            env.pop(key, None)
        return env

    @classmethod
    def execute_script(
        cls,
        script_path: str,
        freecad_bin: Optional[str] = None,
        timeout: int = 120
    ) -> subprocess.CompletedProcess:
        """Run a Python script inside FreeCAD in headless mode."""
        if not freecad_bin:
            freecad_bin = os.environ.get("FREECAD_BIN")
            if not freecad_bin:
                candidates = [
                    "FreeCADCmd",
                    "freecadcmd",
                    "FreeCAD",
                    "freecad",
                    r"C:\Program Files\FreeCAD 1.0\bin\FreeCADCmd.exe",
                    r"C:\Program Files\FreeCAD 0.21\bin\FreeCADCmd.exe",
                ]
                for c in candidates:
                    if os.path.isabs(c) and os.path.exists(c):
                        freecad_bin = c
                        break
                    elif subprocess.call(["where" if sys.platform == "win32" else "which", c],
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
                        freecad_bin = c
                        break

        if not freecad_bin:
            raise FileNotFoundError(
                "FreeCAD binary not found. Set FREECAD_BIN environment variable or install FreeCAD."
            )

        cmd = [freecad_bin, "-c", script_path]
        return subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=cls.sanitize_env(),
            timeout=timeout
        )


class ParametricRecipeBuilder:
    """Generates robust, transactional FreeCAD Python scripts."""

    @staticmethod
    def build_enclosure_script(
        length: float,
        width: float,
        height: float,
        wall: float,
        output_step: str,
        output_stl: Optional[str] = None
    ) -> str:
        """Generate a complete transactional script for a hollow enclosure with floor."""
        output_step_esc = output_step.replace("\\", "/")
        output_stl_block = ""
        if output_stl:
            output_stl_esc = output_stl.replace("\\", "/")
            output_stl_block = f"""
import Mesh
Mesh.export([body], "{output_stl_esc}")
print("Exported STL to: {output_stl_esc}")
"""

        return f'''# Auto-generated by Code Scaffold CAD Tools Skill
import FreeCAD as App
import Part
import Sketcher
import os

doc = App.newDocument("EnclosureDoc")
doc.openTransaction("CreateEnclosure")

try:
    # 1. Create Base Body
    body = doc.addObject("PartDesign::Body", "EnclosureBase")

    # 2. Outer Profile Sketch on XY Plane
    outer_sketch = body.newObject("Sketcher::SketchObject", "OuterSketch")
    outer_sketch.MapMode = "FlatFace"
    # Rectangle vertices: (0,0), (L,0), (L,W), (0,W)
    outer_sketch.addGeometry(Part.LineSegment(App.Vector(0, 0, 0), App.Vector({length}, 0, 0)))
    outer_sketch.addGeometry(Part.LineSegment(App.Vector({length}, 0, 0), App.Vector({length}, {width}, 0)))
    outer_sketch.addGeometry(Part.LineSegment(App.Vector({length}, {width}, 0), App.Vector(0, {width}, 0)))
    outer_sketch.addGeometry(Part.LineSegment(App.Vector(0, {width}, 0), App.Vector(0, 0, 0)))
    # Constraints
    outer_sketch.addConstraint(Sketcher.Constraint("Coincident", 0, 2, 1, 1))
    outer_sketch.addConstraint(Sketcher.Constraint("Coincident", 1, 2, 2, 1))
    outer_sketch.addConstraint(Sketcher.Constraint("Coincident", 2, 2, 3, 1))
    outer_sketch.addConstraint(Sketcher.Constraint("Coincident", 3, 2, 0, 1))
    outer_sketch.addConstraint(Sketcher.Constraint("Horizontal", 0))
    outer_sketch.addConstraint(Sketcher.Constraint("Vertical", 1))
    outer_sketch.addConstraint(Sketcher.Constraint("Horizontal", 2))
    outer_sketch.addConstraint(Sketcher.Constraint("Vertical", 3))
    doc.recompute()

    # 3. Pad Outer Shell to Height
    pad = body.newObject("PartDesign::Pad", "BasePad")
    pad.Profile = outer_sketch
    pad.Length = {height}
    doc.recompute()

    # 4. Inner Pocket Sketch at Z = Height (Cavity from Top Face)
    inner_sketch = body.newObject("Sketcher::SketchObject", "InnerSketch")
    inner_sketch.MapMode = "FlatFace"
    inner_sketch.Placement = App.Placement(App.Vector(0, 0, {height}), App.Rotation(App.Vector(0, 0, 1), 0))
    # Inset rectangle with wall thickness
    inner_sketch.addGeometry(Part.LineSegment(App.Vector({wall}, {wall}, 0), App.Vector({length - wall}, {wall}, 0)))
    inner_sketch.addGeometry(Part.LineSegment(App.Vector({length - wall}, {wall}, 0), App.Vector({length - wall}, {width - wall}, 0)))
    inner_sketch.addGeometry(Part.LineSegment(App.Vector({length - wall}, {width - wall}, 0), App.Vector({wall}, {width - wall}, 0)))
    inner_sketch.addGeometry(Part.LineSegment(App.Vector({wall}, {width - wall}, 0), App.Vector({wall}, {wall}, 0)))
    inner_sketch.addConstraint(Sketcher.Constraint("Coincident", 0, 2, 1, 1))
    inner_sketch.addConstraint(Sketcher.Constraint("Coincident", 1, 2, 2, 1))
    inner_sketch.addConstraint(Sketcher.Constraint("Coincident", 2, 2, 3, 1))
    inner_sketch.addConstraint(Sketcher.Constraint("Coincident", 3, 2, 0, 1))
    inner_sketch.addConstraint(Sketcher.Constraint("Horizontal", 0))
    inner_sketch.addConstraint(Sketcher.Constraint("Vertical", 1))
    inner_sketch.addConstraint(Sketcher.Constraint("Horizontal", 2))
    inner_sketch.addConstraint(Sketcher.Constraint("Vertical", 3))
    doc.recompute()

    # 5. Pocket Cavity (Depth = Height - Wall to preserve floor)
    pocket = body.newObject("PartDesign::Pocket", "BasePocket")
    pocket.Profile = inner_sketch
    pocket.Length = {height - wall}
    pocket.Reversed = True
    doc.recompute()

    doc.commitTransaction()
    print("Enclosure geometry compiled successfully.")

    # 6. Export Deliverables
    os.makedirs(os.path.dirname("{output_step_esc}"), exist_ok=True)
    Part.export([body], "{output_step_esc}")
    print("Exported STEP to: {output_step_esc}")
    {output_stl_block}

except Exception as err:
    doc.abortTransaction()
    print(f"ERROR: Transaction aborted due to CAD compilation error: {{err}}")
    raise
'''


def main():
    parser = argparse.ArgumentParser(description="Code Scaffold Parametric CAD Connector Bridge")
    subparsers = parser.add_subparsers(dest="command")

    # Connect Subcommand (MCP Socket Client)
    conn_p = subparsers.add_parser("connect", help="Test connection and query FreeCAD socket")
    conn_p.add_argument("--url", default="http://127.0.0.1:3000", help="FreeCAD socket URL")
    conn_p.add_argument("--token", default=None, help="Bearer authorization token")
    conn_p.add_argument("--list-tools", action="store_true", help="List available FreeCAD tools")
    conn_p.add_argument("--call", help="Tool name to execute")
    conn_p.add_argument("--args", default="{}", help="JSON arguments string for tool call")

    # Scaffold Subcommand (Script synthesis)
    scaffold_p = subparsers.add_parser("scaffold", help="Generate parametric FreeCAD Python script")
    scaffold_p.add_argument("--type", choices=["enclosure"], default="enclosure", help="Recipe type")
    scaffold_p.add_argument("--length", type=float, default=80.0, help="Length in mm")
    scaffold_p.add_argument("--width", type=float, default=50.0, help="Width in mm")
    scaffold_p.add_argument("--height", type=float, default=30.0, help="Height in mm")
    scaffold_p.add_argument("--wall", type=float, default=2.0, help="Wall thickness in mm")
    scaffold_p.add_argument("--output", default="cad/models/enclosure.py", help="Target script path")
    scaffold_p.add_argument("--step", default="cad/output/enclosure.step", help="Output STEP path")
    scaffold_p.add_argument("--stl", default="cad/output/enclosure.stl", help="Output STL path")

    # Run Subcommand (Headless execution)
    run_p = subparsers.add_parser("run-script", help="Execute script headlessly via FreeCAD")
    run_p.add_argument("--script", required=True, help="Path to Python script to execute")
    run_p.add_argument("--freecad-bin", default=None, help="Path to FreeCAD binary")

    args = parser.parse_args()

    if args.command == "connect":
        client = FreeCADMCPClient(args.url, args.token)
        print(f"Connecting to FreeCAD socket at {args.url}...")
        init_res = client.initialize()
        print("Initialization response:", json.dumps(init_res, indent=2))

        if args.list_tools:
            tools = client.list_tools()
            print(f"Discovered {len(tools)} FreeCAD tools:")
            for t in tools:
                print(f"  * {t.get('name')}: {t.get('description', '')[:70]}")

        if args.call:
            call_args = json.loads(args.args)
            print(f"Calling tool {args.call} with args: {call_args}")
            res = client.call_tool(args.call, call_args)
            print("Result:", json.dumps(res, indent=2))

    elif args.command == "scaffold":
        code = ParametricRecipeBuilder.build_enclosure_script(
            length=args.length,
            width=args.width,
            height=args.height,
            wall=args.wall,
            output_step=args.step,
            output_stl=args.stl
        )
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(code)
        print(f"Scaffolded parametric script to {args.output}")

    elif args.command == "run-script":
        print(f"Running script {args.script} headlessly...")
        res = HeadlessFreeCADRunner.execute_script(args.script, args.freecad_bin)
        print("STDOUT:\n", res.stdout)
        if res.stderr:
            print("STDERR:\n", res.stderr)
        sys.exit(res.returncode)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
