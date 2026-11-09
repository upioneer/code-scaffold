#!/usr/bin/env python3
"""Scout a TV on the LAN for open debug and control surfaces.

Probes the well known TV debug ports and reports which answer, so an agent
can route to the correct platform workflow (ADB debloat, SDB research,
webOS Developer Mode, Cast control) without guessing.

Usage:
    python tv_scout.py 192.168.1.50
    python tv_scout.py 192.168.1.50 --json
    python tv_scout.py --self-test
"""

import json
import socket
import sys

SURFACES = (
    (5555, "adb", "Android debug bridge (Android TV, Google TV, Fire TV)"),
    (26101, "sdb", "Samsung debug bridge (Tizen TV Developer Mode)"),
    (3000, "webos-dev", "LG webOS developer manager"),
    (8008, "cast-http", "Google Cast control channel"),
    (8009, "cast-tls", "Google Cast TLS channel"),
    (1925, "jointspace", "Philips JointSpace control API"),
    (1926, "jointspace-tls", "Philips JointSpace control API over TLS"),
)


def probe_port(host, port, timeout=1.5):
    """Return True when a TCP connect to host:port succeeds."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def scout(host, timeout=1.5):
    """Probe every known TV surface. Return {surface_name: is_open}."""
    return {name: probe_port(host, port, timeout) for port, name, _desc in SURFACES}


def guess_platform(results):
    """Map open surfaces to likely platform families."""
    guesses = []
    if results.get("adb"):
        guesses.append("android-family")
    if results.get("sdb"):
        guesses.append("tizen")
    if results.get("webos-dev"):
        guesses.append("webos")
    if results.get("cast-http") or results.get("cast-tls"):
        guesses.append("cast-capable")
    if results.get("jointspace") or results.get("jointspace-tls"):
        guesses.append("philips-jointspace")
    return guesses


def _free_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def self_test():
    """Spin local listeners and assert probe plus guess behavior."""
    passed = 0
    total = 0

    def check(label, cond):
        nonlocal passed, total
        total += 1
        if not cond:
            raise AssertionError("self test failed: " + label)
        passed += 1

    server_a = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_a.bind(("127.0.0.1", 0))
    server_a.listen(1)
    port_a = server_a.getsockname()[1]
    server_b = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_b.bind(("127.0.0.1", 0))
    server_b.listen(1)
    port_b = server_b.getsockname()[1]
    closed = _free_port()

    try:
        check("open port detected", probe_port("127.0.0.1", port_a) is True)
        check("second open port detected", probe_port("127.0.0.1", port_b) is True)
        check("closed port detected", probe_port("127.0.0.1", closed) is False)
        check("bad host is closed", probe_port("127.0.0.1", 1) is False)
        check("adb maps to android family", guess_platform({"adb": True}) == ["android-family"])
        check("sdb maps to tizen", guess_platform({"sdb": True}) == ["tizen"])
        check("webos maps to webos", guess_platform({"webos-dev": True}) == ["webos"])
        check(
            "adb plus cast maps to both",
            guess_platform({"adb": True, "cast-tls": True}) == ["android-family", "cast-capable"],
        )
        check("silent host has no guesses", guess_platform({}) == [])
        check("surfaces table is non empty", len(SURFACES) >= 5)
    finally:
        server_a.close()
        server_b.close()

    print("SELF TEST PASSED (%d/%d)" % (passed, total))
    return 0


def main(argv):
    if "--self-test" in argv:
        return self_test()
    args = [a for a in argv[1:] if not a.startswith("--")]
    as_json = "--json" in argv
    if not args:
        print("usage: tv_scout.py <tv-ip> [--json] | --self-test")
        return 2
    host = args[0]
    results = scout(host)
    guesses = guess_platform(results)
    if as_json:
        print(json.dumps({"host": host, "open": results, "platform": guesses}, indent=2))
    else:
        print("TV scout: " + host)
        for _port, name, desc in SURFACES:
            state = "OPEN  " if results[name] else "closed"
            print("  [%s] %-14s %s" % (state, name, desc))
        print("Platform guess: " + (", ".join(guesses) if guesses else "unknown (no debug surface)"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
