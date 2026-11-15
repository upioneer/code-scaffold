"""Validate a ComfyUI API format workflow before queueing.

Offline checks (always run):
  * valid JSON object keyed by node id
  * every node has class_type plus inputs
  * every [id, slot] link target exists
  * at least one save node terminates an output path
  * every node carries a plain word _meta.title (warning)
  * UI format detection with conversion hint

Live checks (--server URL):
  * node classes exist in /object_info
  * referenced model files exist in loader enums

Exit 0 when zero errors (warnings allowed), 1 otherwise.
Use --json for a machine readable report, --self-test for built-ins.
"""

import argparse
import json
import sys
import urllib.request
from pathlib import Path

SAVE_CLASSES = {"SaveImage", "SaveVideo", "SaveAudio", "SaveWEBM",
                "SaveAnimatedWEBP", "SaveAnimatedPNG", "CombineVideo"}
PREVIEW_CLASSES = {"PreviewImage"}
LOADER_FILE_KEYS = {"ckpt_name", "lora_name", "control_net_name",
                     "model_name", "unet_name", "clip_name", "vae_name",
                     "video", "image", "audio"}


def load_graph(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return None, [f"unreadable JSON: {exc}"]
    if not isinstance(data, dict):
        return None, ["top level must be an object keyed by node id"]
    if "nodes" in data and "links" in data:
        return None, ["UI format detected (nodes plus links arrays); "
                      "re-export via Dev mode Output in API Format"]
    return data, []


def check_offline(graph):
    errors, warnings = [], []
    for node_id, node in graph.items():
        if not isinstance(node, dict):
            errors.append(f"node {node_id}: must be an object")
            continue
        if "class_type" not in node or "inputs" not in node:
            errors.append(f"node {node_id}: missing class_type or inputs")
            continue
        if not isinstance(node["inputs"], dict):
            errors.append(f"node {node_id}: inputs must be an object")
            continue
        title = (node.get("_meta") or {}).get("title", "")
        if not str(title).strip():
            warnings.append(f"node {node_id}: missing plain word _meta.title")
        for key, value in node["inputs"].items():
            if isinstance(value, list) and len(value) == 2 \
                    and isinstance(value[0], str) \
                    and isinstance(value[1], int):
                if value[0] not in graph:
                    errors.append(
                        f"node {node_id}: input '{key}' links missing "
                        f"node {value[0]}")
    classes = {n.get("class_type") for n in graph.values()
               if isinstance(n, dict)}
    if not (classes & SAVE_CLASSES):
        if classes & PREVIEW_CLASSES:
            errors.append("preview node present but no save node; "
                          "outputs will not persist")
        else:
            errors.append("no save node found; graph returns nothing")
    return errors, warnings


def fetch_object_info(server):
    url = server.rstrip("/") + "/object_info"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def check_live(graph, info):
    errors, warnings = [], []
    for node_id, node in graph.items():
        cls = node.get("class_type")
        spec = info.get(cls)
        if spec is None:
            errors.append(f"node {node_id}: class '{cls}' missing on "
                          f"server; install the pack and restart")
            continue
        required = (spec.get("input") or {}).get("required") or {}
        enums = {}
        for field, rule in required.items():
            if isinstance(rule, list) and rule and isinstance(rule[0], list):
                enums[field] = {str(v) for v in rule[0]}
        for key, value in node["inputs"].items():
            if key in LOADER_FILE_KEYS and isinstance(value, str) \
                    and key in enums and value not in enums[key]:
                errors.append(
                    f"node {node_id}: file '{value}' for '{key}' not on "
                    f"server")
            if key not in required and not isinstance(value, list):
                warnings.append(
                    f"node {node_id}: input '{key}' not in live schema")
    return errors, warnings


def self_test():
    here = Path(__file__).resolve().parent.parent
    sample = here / "assets" / "txt2img_api.json"
    graph, errs = load_graph(sample)
    assert not errs, errs
    errors, _ = check_offline(graph)
    assert not errors, errors
    bad = {"1": {"class_type": "Nope", "inputs": {"x": ["9", 0]}}}
    errors, _ = check_offline(bad)
    assert any("missing node 9" in e for e in errors), errors
    assert any("no save node" in e for e in errors), errors
    ui = {"nodes": [], "links": []}
    _, errs = load_graph(_write_temp(ui))
    assert any("UI format" in e for e in errs), errs
    print("SELF TEST PASSED")


def _write_temp(data):
    import tempfile
    fd, name = tempfile.mkstemp(suffix=".json")
    with open(fd, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    return name


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate ComfyUI API graphs")
    parser.add_argument("workflow", nargs="?",
                        help="path to API format workflow JSON")
    parser.add_argument("--server", default="",
                        help="live check against http://host:port")
    parser.add_argument("--json", action="store_true",
                        help="emit machine readable report")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        self_test()
        return 0
    if not args.workflow:
        parser.error("workflow path required")
    graph, load_errors = load_graph(args.workflow)
    errors = list(load_errors)
    warnings = []
    if graph is not None:
        errs, warns = check_offline(graph)
        errors.extend(errs)
        warnings.extend(warns)
    if not errors and args.server and graph is not None:
        try:
            info = fetch_object_info(args.server)
        except Exception as exc:  # noqa: BLE001 - report, never crash
            errors.append(f"live check failed: {exc}")
        else:
            errs, warns = check_live(graph, info)
            errors.extend(errs)
            warnings.extend(warns)
    if args.json:
        print(json.dumps({"errors": errors, "warnings": warnings},
                         indent=2))
    else:
        for item in errors:
            print(f"ERROR: {item}")
        for item in warnings:
            print(f"WARNING: {item}")
        if not errors and not warnings:
            print("VALID: graph passed all checks")
        elif not errors:
            print(f"VALID with {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
