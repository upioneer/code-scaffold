#!/usr/bin/env python3
"""
Smart Home Automation Controller & Diagnostic Tool
Proprietary Code Scaffold Smart Home Client for Home Assistant, Alexa, Google Home, and HomeKit.
Uses Python Standard Library for zero-dependency execution.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def get_config(args):
    url = args.url or os.environ.get("HOME_ASSISTANT_URL", "http://localhost:8123")
    token = args.token or os.environ.get("HOME_ASSISTANT_TOKEN", "")
    return url.rstrip("/"), token


def make_request(url, path, token, method="GET", data=None):
    full_url = f"{url}{path}"
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    encoded_data = None
    if data is not None:
        if isinstance(data, (dict, list)):
            encoded_data = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            encoded_data = data.encode("utf-8")

    req = urllib.request.Request(
        full_url, data=encoded_data, headers=headers, method=method
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            raw_body = response.read().decode("utf-8")
            try:
                parsed_json = json.loads(raw_body)
                return {"success": True, "status": status_code, "data": parsed_json}
            except json.JSONDecodeError:
                return {"success": True, "status": status_code, "data": raw_body}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else str(e)
        return {
            "success": False,
            "status": e.code,
            "error": f"HTTP {e.code}: {e.reason}",
            "details": body,
        }
    except urllib.error.URLError as e:
        return {
            "success": False,
            "status": None,
            "error": f"Connection error: {e.reason}",
        }
    except Exception as e:
        return {
            "success": False,
            "status": None,
            "error": f"Unexpected error: {str(e)}",
        }


def check_status(args):
    url, token = get_config(args)
    print(f"[*] Checking Home Assistant connection at: {url}")
    res = make_request(url, "/api/", token)
    if res["success"]:
        print("[+] Successfully connected to Home Assistant API!")
        msg = res["data"].get("message", "API running")
        print(f"    Message: {msg}")
        cfg_res = make_request(url, "/api/config", token)
        if cfg_res["success"]:
            cfg = cfg_res["data"]
            print(f"    Location: {cfg.get('location_name', 'Unknown')}")
            print(f"    Version:  {cfg.get('version', 'Unknown')}")
            print(f"    Timezone: {cfg.get('time_zone', 'Unknown')}")
            print(f"    State:    {cfg.get('state', 'RUNNING')}")
    else:
        print(f"[-] Connection failed: {res.get('error')}")
        if res.get("status") == 401:
            print("    [!] Authentication error. Verify your HOME_ASSISTANT_TOKEN.")
        sys.exit(1)


def list_entities(args):
    url, token = get_config(args)
    res = make_request(url, "/api/states", token)
    if not res["success"]:
        print(f"[-] Failed to fetch entity states: {res.get('error')}")
        sys.exit(1)

    states = res["data"]
    if args.domain:
        states = [s for s in states if s["entity_id"].startswith(f"{args.domain}.")]

    if args.json:
        print(json.dumps(states, indent=2))
        return

    print(f"[*] Found {len(states)} entities matching filter:")
    print(f"    {'Entity ID':<40} {'State':<15} {'Friendly Name'}")
    print(f"    {'-'*40} {'-'*15} {'-'*30}")
    for s in sorted(states, key=lambda x: x.get("entity_id", "")):
        eid = s.get("entity_id", "")
        st = s.get("state", "")
        fn = s.get("attributes", {}).get("friendly_name", "")
        print(f"    {eid:<40} {st:<15} {fn}")


def get_entity_state(args):
    url, token = get_config(args)
    res = make_request(url, f"/api/states/{args.entity_id}", token)
    if not res["success"]:
        print(f"[-] Entity not found or request failed: {res.get('error')}")
        sys.exit(1)

    data = res["data"]
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(f"Entity: {data.get('entity_id')}")
        print(f"State:  {data.get('state')}")
        print("Attributes:")
        for k, v in data.get("attributes", {}).items():
            print(f"  {k}: {v}")


def call_service(args):
    url, token = get_config(args)
    payload = {}
    if args.data:
        try:
            payload = json.loads(args.data)
        except json.JSONDecodeError as e:
            print(f"[-] Invalid JSON in --data: {e}")
            sys.exit(1)

    print(f"[*] Calling service {args.domain}.{args.service} with payload: {payload}")
    res = make_request(
        url, f"/api/services/{args.domain}/{args.service}", token, method="POST", data=payload
    )
    if res["success"]:
        print("[+] Service called successfully!")
        print(json.dumps(res["data"], indent=2))
    else:
        print(f"[-] Service call failed: {res.get('error')}")
        if res.get("details"):
            print(f"    Details: {res['details']}")
        sys.exit(1)


def render_template(args):
    url, token = get_config(args)
    payload = {"template": args.template}
    res = make_request(url, "/api/template", token, method="POST", data=payload)
    if res["success"]:
        print("[+] Template rendered successfully:")
        print(res["data"])
    else:
        print(f"[-] Template rendering failed: {res.get('error')}")
        sys.exit(1)


def export_schema(args):
    url, token = get_config(args)
    states_res = make_request(url, "/api/states", token)
    services_res = make_request(url, "/api/services", token)

    schema = {
        "hub": "Home Assistant Matrix",
        "entities": states_res.get("data", []) if states_res["success"] else [],
        "services": services_res.get("data", []) if services_res["success"] else [],
    }

    out_path = args.output or "smart_home_schema.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
    print(f"[+] Exported schema with {len(schema['entities'])} entities to {out_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Unified Smart Home Automation Controller for Home Assistant, HomeKit, Alexa, and Google Home."
    )
    parser.add_argument("--url", help="Home Assistant base URL (default: HOME_ASSISTANT_URL env)")
    parser.add_argument("--token", help="Long-Lived Access Token (default: HOME_ASSISTANT_TOKEN env)")

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    subparsers.add_parser("status", help="Verify connection to Home Assistant")

    list_p = subparsers.add_parser("list", help="List entities")
    list_p.add_argument("--domain", help="Filter by domain (e.g., light, switch, climate, sensor)")
    list_p.add_argument("--json", action="store_true", help="Output raw JSON")

    get_p = subparsers.add_parser("get", help="Get specific entity state")
    get_p.add_argument("entity_id", help="Entity ID (e.g. light.kitchen_ceiling)")
    get_p.add_argument("--json", action="store_true", help="Output raw JSON")

    call_p = subparsers.add_parser("call", help="Call a service")
    call_p.add_argument("domain", help="Domain (e.g., light, switch, climate)")
    call_p.add_argument("service", help="Service (e.g., turn_on, turn_off, set_temperature)")
    call_p.add_argument("--data", help="JSON data payload string")

    tmpl_p = subparsers.add_parser("template", help="Render Jinja2 template")
    tmpl_p.add_argument("template", help="Jinja2 template string")

    exp_p = subparsers.add_parser("export", help="Export entities and services schema to JSON")
    exp_p.add_argument("-o", "--output", help="Output file path (default: smart_home_schema.json)")

    args = parser.parse_args()

    if args.command == "status":
        check_status(args)
    elif args.command == "list":
        list_entities(args)
    elif args.command == "get":
        get_entity_state(args)
    elif args.command == "call":
        call_service(args)
    elif args.command == "template":
        render_template(args)
    elif args.command == "export":
        export_schema(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
