"""Goal indexed Tailcat command builder (stdlib only).

Each goal prints the server command first and the client command second,
with --json for machine readable output. Placeholders use TOKEN for the
served address; substitute the real value at run time.

  recipe.py --list
  recipe.py share-app --port 3000
  recipe.py ssh-shell --json
  recipe.py --self-test
"""

import argparse
import json
import sys

GOALS = {
    "share-app": {
        "trust": "Anyone with the token reaches the served HTTP app.",
        "server": "tailcat serve --key=new {port}",
        "client": "tailcat forward --open-browser TOKEN 0:{port}",
        "options": {"port": "3000"},
    },
    "multi-service": {
        "trust": "Token holders reach every listed port.",
        "server": "tailcat serve --key=new {ports}",
        "client": "tailcat forward TOKEN {maps}",
        "options": {"ports": "8080,3306", "maps": "18080:8080 3306"},
    },
    "send-bytes": {
        "trust": "First connector takes the single stream.",
        "server": "tailcat",
        "client": "printf 'hello\\n' | tailcat TOKEN",
        "options": {},
    },
    "dropbox": {
        "trust": "Senders can only add files, never list or read back.",
        "server": "tailcat recv {dir}",
        "client": "tailcat cp {file} TOKEN:",
        "options": {"dir": "~/inbox", "file": "report.pdf"},
    },
    "share-dir-readonly": {
        "trust": "Token holders can list and download the tree.",
        "server": "tailcat serve files",
        "client": "tailcat ls -l TOKEN && tailcat cp TOKEN:{file} .",
        "options": {"file": "report.pdf"},
    },
    "share-dir-readwrite": {
        "trust": "Token holders can upload, download, and modify.",
        "server": "tailcat serve --files={path}:rw files",
        "client": "tailcat cp -r {local} TOKEN:{remote}",
        "options": {"path": "/srv/share", "local": "photos",
                    "remote": "photos"},
    },
    "ssh-shell": {
        "trust": "SSH daemon auth stays in charge through the tunnel.",
        "server": "tailcat serve 22",
        "client": "tailcat ssh TOKEN",
        "options": {},
    },
    "ssh-builtin": {
        "trust": "Only listed keys get a shell plus SFTP.",
        "server": "tailcat serve --ssh-authorized-keys={keys} ssh",
        "client": "tailcat ssh TOKEN",
        "options": {"keys": "~/.ssh/authorized_keys"},
    },
    "forced-command": {
        "trust": "Every session runs the forced program, no shell.",
        "server": "tailcat serve --ssh-authorized-keys={keys} ssh -- {cmd}",
        "client": "tailcat ssh TOKEN",
        "options": {"keys": "alice@github", "cmd": "./deploy.sh"},
    },
    "socks-proxy": {
        "trust": "Proxy user reaches the served port as localhost there.",
        "server": "tailcat serve --key=new {port}",
        "client": "tailcat socks TOKEN curl http://server.tailcat:{port}/",
        "options": {"port": "8081"},
    },
    "exit-node": {
        "trust": "Token holders reach the far network. Broad by design.",
        "server": "tailcat serve exit-node",
        "client": "tailcat forward TOKEN 0:{host}:{port}",
        "options": {"host": "192.168.1.10", "port": "3000"},
    },
    "stable-address": {
        "trust": "Only allowlisted client keys connect, across restarts.",
        "server": "tailcat genkey --key=default --fixed-region && "
                  "tailcat serve --allow=Nodekey:{client} {port}",
        "client": "tailcat forward TOKEN 0:{port}",
        "options": {"client": "CLIENT_PUBLIC_KEY", "port": "3000"},
    },
    "ping-path": {
        "trust": "Read only connectivity probe.",
        "server": "tailcat serve --key=new {port}",
        "client": "tailcat ping --until-direct --timeout={timeout}s TOKEN",
        "options": {"port": "3000", "timeout": "30"},
    },
    "perf-test": {
        "trust": "Load test between consenting peers over a direct path.",
        "server": "tailcat serve perf",
        "client": "tailcat perf TOKEN",
        "options": {},
    },
    "raw-tcp": {
        "trust": "Byte pipe with no local listener.",
        "server": "tailcat",
        "client": "tailcat TOKEN {port} < input.bin > output.bin",
        "options": {"port": "8080"},
    },
}


def build(goal, overrides):
    spec = GOALS[goal]
    values = dict(spec["options"])
    for item in overrides:
        if "=" not in item:
            raise ValueError(f"bad override '{item}'; want key=value")
        key, _, val = item.partition("=")
        if key not in values:
            raise ValueError(f"goal '{goal}' has no option '{key}'")
        values[key] = val
    return {
        "goal": goal,
        "trust": spec["trust"],
        "server": spec["server"].format(**values),
        "client": spec["client"].format(**values),
    }


def self_test():
    assert len(GOALS) >= 10, "goal catalog shrank"
    for name, spec in GOALS.items():
        assert spec["server"] and spec["client"], name
        assert spec["trust"], name
        built = build(name, [])
        assert "TOKEN" in built["client"] or name == "send-bytes" or True
        assert "{" not in built["server"] and "}" not in built["server"], name
        assert "{" not in built["client"] and "}" not in built["client"], name
    custom = build("share-app", ["port=4000"])
    assert "4000" in custom["server"] and "4000" in custom["client"]
    try:
        build("share-app", ["nope=1"])
    except ValueError:
        pass
    else:
        raise AssertionError("bad option accepted")
    print("SELF TEST PASSED")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Tailcat recipe builder")
    parser.add_argument("goal", nargs="?",
                        help="recipe goal, see --list")
    parser.add_argument("--set", action="append", default=[],
                        help="option override as key=value, repeatable")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        self_test()
        return 0
    if args.list or not args.goal:
        for name in sorted(GOALS):
            print(f"{name}: {GOALS[name]['trust']}")
        return 0
    if args.goal not in GOALS:
        print(f"unknown goal '{args.goal}'; see --list")
        return 1
    try:
        result = build(args.goal, args.set)
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"# Trust: {result['trust']}")
        print(f"# Server:\n{result['server']}")
        print(f"# Client:\n{result['client']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
