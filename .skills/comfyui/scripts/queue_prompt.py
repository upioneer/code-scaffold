"""Queue a ComfyUI API workflow and fetch its outputs (stdlib only).

Flow: POST /prompt with a fresh client_id, poll /history/<id> until the
run leaves the queue, then download every output via /view into --out-dir.

Overrides apply the iterate pattern without rebuilding the graph:
  --override 5.seed=42 --override 2.text='"a new prompt"'
Values parse as JSON, falling back to plain strings.

Exit 0 with a run log on success, 1 on queue failure or timeout.
Use --dry-run to print the payload without touching the server.
"""

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path


def api(server, method, path, body=None, timeout=30):
    url = server.rstrip("/") + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers,
                                 method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    try:
        return json.loads(raw)
    except ValueError:
        return {"raw": raw}


def coerce(value):
    try:
        return json.loads(value)
    except ValueError:
        return value


def apply_overrides(graph, overrides):
    for item in overrides:
        if "." not in item or "=" not in item:
            raise ValueError(f"bad override '{item}'; want NodeId.input=value")
        target, _, raw = item.partition("=")
        node_id, _, field = target.partition(".")
        if node_id not in graph:
            raise ValueError(f"override targets missing node {node_id}")
        graph[node_id]["inputs"][field] = coerce(raw)
    return graph


def download(server, entry, out_dir):
    query = urllib.parse.urlencode({
        "filename": entry["filename"],
        "subfolder": entry.get("subfolder", ""),
        "type": entry.get("type", "output"),
    })
    url = server.rstrip("/") + "/view?" + query
    dest = out_dir / entry["filename"]
    with urllib.request.urlopen(url, timeout=120) as resp, \
            open(dest, "wb") as handle:
        handle.write(resp.read())
    return str(dest)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Queue ComfyUI graphs")
    parser.add_argument("workflow", help="API format workflow JSON path")
    parser.add_argument("--server", default="http://127.0.0.1:8188")
    parser.add_argument("--out-dir", default="runs")
    parser.add_argument("--override", action="append", default=[],
                        help="NodeId.input=value, repeatable")
    parser.add_argument("--timeout", type=int, default=600)
    parser.add_argument("--poll", type=float, default=2.0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    graph = json.loads(Path(args.workflow).read_text(encoding="utf-8"))
    apply_overrides(graph, args.override)
    client_id = str(uuid.uuid4())
    payload = {"prompt": graph, "client_id": client_id}
    if args.dry_run:
        print(json.dumps(payload, indent=2)[:2000])
        print("DRY RUN: payload built, nothing queued")
        return 0

    try:
        queued = api(args.server, "POST", "/prompt", payload)
        prompt_id = queued["prompt_id"]
    except Exception as exc:  # noqa: BLE001 - report, never crash
        print(f"QUEUE FAILED: {exc}")
        return 1

    deadline = time.time() + args.timeout
    record = None
    while time.time() < deadline:
        try:
            history = api(args.server, "GET", f"/history/{prompt_id}")
        except Exception:  # noqa: BLE001 - transient, keep polling
            time.sleep(args.poll)
            continue
        if prompt_id in history:
            record = history[prompt_id]
            break
        time.sleep(args.poll)
    if record is None:
        print(f"TIMEOUT waiting for {prompt_id}")
        return 1

    out_dir = Path(args.out_dir) / prompt_id
    out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for node in (record.get("outputs") or {}).values():
        for key in ("images", "gifs", "video", "audio"):
            for entry in node.get(key, []) or []:
                files.append(download(args.server, entry, out_dir))
    log = {"prompt_id": prompt_id, "client_id": client_id,
           "server": args.server, "overrides": args.override,
           "outputs": files}
    print(json.dumps(log, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
