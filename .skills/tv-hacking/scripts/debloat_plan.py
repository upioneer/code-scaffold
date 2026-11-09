#!/usr/bin/env python3
"""Build reversible TV debloat plans from a device package capture.

Reads a `pm list packages` capture plus the starter tiers in
data/package_tiers.json, classifies every package, and emits a disable
script with a matching restore script. Nothing here touches a TV; it only
writes the plan for an agent to review and apply over ADB.

Usage:
    python debloat_plan.py plan --platform android-tv --packages packages.txt --out ./plan
    python debloat_plan.py --self-test
"""

import json
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
TIERS_PATH = SKILL_DIR / "data" / "package_tiers.json"

TIER_ORDER = ("safe", "ask", "review", "never")


def load_tiers(path=TIERS_PATH):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_pm_list(text):
    """Parse `pm list packages` output into a sorted unique package list."""
    packages = set()
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("package:"):
            line = line[len("package:"):]
        line = line.strip()
        if line and " " not in line:
            packages.add(line)
    return sorted(packages)


def classify_pkg(platform, pkg, tiers):
    """Return (tier, note) for one package. Unknown packages need review."""
    platform_data = tiers.get("platforms", {}).get(platform, {})
    exact = platform_data.get("packages", {}).get(pkg)
    if exact:
        return exact.get("tier", "review"), exact.get("note", "")
    lowered = pkg.lower()
    for pattern in tiers.get("patterns", []):
        if pattern.get("match", "").lower() in lowered:
            return pattern.get("tier", "review"), pattern.get("note", "")
    return "review", "Unknown package. Research on the TV before touching it."


def build_plan(platform, packages, tiers):
    """Bucket every package into safe / ask / review / never lists."""
    plan = {"safe": [], "ask": [], "review": [], "never": []}
    for pkg in packages:
        tier, note = classify_pkg(platform, pkg, tiers)
        if tier not in plan:
            tier = "review"
        plan[tier].append({"package": pkg, "note": note})
    return plan


def emit_disable_script(platform, plan):
    """Render a Bourne shell script that disables safe tier packages."""
    lines = [
        "#!/bin/sh",
        "# Debloat plan for platform: " + platform,
        "# Review ask tier entries by hand before adding them below.",
        "# Record current state first: adb shell pm list packages > packages.before.txt",
        "",
    ]
    for entry in plan.get("safe", []):
        lines.append("# " + entry["note"])
        lines.append("adb shell pm disable-user --user 0 " + entry["package"])
    if plan.get("ask"):
        lines.append("")
        lines.append("# Ask tier: disabled below ONLY after explicit owner approval.")
        for entry in plan["ask"]:
            lines.append("# ASK %s :: %s" % (entry["package"], entry["note"]))
    lines.append("")
    return "\n".join(lines)


def emit_restore_script(platform, plan):
    """Render the matching restore script for everything the plan touches."""
    lines = [
        "#!/bin/sh",
        "# Restore script for platform: " + platform,
        "# Re-enables every package the disable script changed.",
        "",
    ]
    for entry in plan.get("safe", []):
        lines.append("adb shell pm enable --user 0 " + entry["package"])
    lines.append("")
    return "\n".join(lines)


def cmd_plan(args):
    try:
        platform = args[args.index("--platform") + 1]
        pkg_file = args[args.index("--packages") + 1]
    except (ValueError, IndexError):
        print("usage: debloat_plan.py plan --platform <id> --packages <file> [--out <dir>]")
        return 2
    out_dir = Path(args[args.index("--out") + 1]) if "--out" in args else Path(".")
    tiers = load_tiers()
    with open(pkg_file, "r", encoding="utf-8") as handle:
        packages = parse_pm_list(handle.read())
    plan = build_plan(platform, packages, tiers)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "disable.sh").write_text(emit_disable_script(platform, plan), encoding="utf-8")
    (out_dir / "restore.sh").write_text(emit_restore_script(platform, plan), encoding="utf-8")
    with open(out_dir / "plan.json", "w", encoding="utf-8") as handle:
        json.dump(plan, handle, indent=2)
    counts = ", ".join("%s=%d" % (tier, len(plan[tier])) for tier in TIER_ORDER)
    print("Plan for %s: %d packages (%s)" % (platform, len(packages), counts))
    print("Wrote disable.sh, restore.sh, plan.json to " + str(out_dir))
    return 0


def self_test():
    passed = 0
    total = 0

    def check(label, cond):
        nonlocal passed, total
        total += 1
        if not cond:
            raise AssertionError("self test failed: " + label)
        passed += 1

    tiers = load_tiers()
    check("tiers file loads", isinstance(tiers, dict))
    check("android platform present", "android-tv" in tiers.get("platforms", {}))

    capture = (
        "package:com.google.android.tvrecommendations\n"
        "package:com.google.android.apps.tv.launcherx\n"
        "package:com.example.unknownthing\n"
        "com.bare.line.format\n"
        "\n"
    )
    parsed = parse_pm_list(capture)
    check("pm prefix stripped", "com.google.android.tvrecommendations" in parsed)
    check("bare lines kept", "com.bare.line.format" in parsed)
    check("blank lines skipped", len(parsed) == 4)

    tier, _note = classify_pkg("android-tv", "com.google.android.tvrecommendations", tiers)
    check("sponsored rows are safe", tier == "safe")
    tier, _note = classify_pkg("android-tv", "com.google.android.apps.tv.launcherx", tiers)
    check("stock launcher needs asking", tier == "ask")
    tier, _note = classify_pkg("android-tv", "com.example.unknownthing", tiers)
    check("unknown needs review", tier == "review")
    tier, _note = classify_pkg("android-tv", "com.android.settings", tiers)
    check("settings pattern is never", tier == "never")

    plan = build_plan("android-tv", parsed, tiers)
    check("plan buckets safe", len(plan["safe"]) == 1)
    check("plan buckets ask", len(plan["ask"]) == 1)

    disable = emit_disable_script("android-tv", plan)
    check("disable script uses disable-user", "pm disable-user --user 0" in disable)
    check("disable script skips ask tier", "launcherx" not in disable.split("Ask tier")[0])
    restore = emit_restore_script("android-tv", plan)
    check("restore script re-enables", "pm enable --user 0" in restore)

    print("SELF TEST PASSED (%d/%d)" % (passed, total))
    return 0


def main(argv):
    if "--self-test" in argv:
        return self_test()
    if len(argv) > 1 and argv[1] == "plan":
        return cmd_plan(argv[1:])
    print("usage: debloat_plan.py plan --platform <id> --packages <file> [--out <dir>]")
    print("       debloat_plan.py --self-test")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
