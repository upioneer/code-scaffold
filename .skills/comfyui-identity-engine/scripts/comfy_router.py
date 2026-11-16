"""Angle router: match shots to canon anchors and inject API graphs.

Implements Phase C. Given a shot request plus a character manifest, picks
the face master anchor (gated by yaw visibility) and the single closest
canonical view, then substitutes {{PLACEHOLDERS}} in a template graph.

  comfy_router.py route --manifest canon.json --shot shot.json [--json]
  comfy_router.py inject --manifest canon.json --shot shot.json \\
      --template templates/03_scene_compositor_still_api.json [--out graph.json]
  comfy_router.py --self-test
"""

import argparse
import json
import math
import sys
from pathlib import Path

AZIMUTH_DEGREES = {
    "deg_000": 0.0, "deg_045": 45.0, "deg_090": 90.0, "deg_135": 135.0,
    "deg_180": 180.0, "deg_225": 225.0, "deg_270": 270.0, "deg_315": 315.0,
}
ELEVATION_DEGREES = {
    "upper_quarter_plus35": 35.0, "lower_quarter_minus35": -35.0,
    "top_down_plus80": 80.0, "worms_eye_minus70": -70.0,
}
FACE_YAW_LIMIT = 110.0
ANGLE_ANCHOR_WEIGHT = 0.75


def angular_distance(a, b):
    """Shortest distance between two headings in degrees."""
    return abs((a - b + 180.0) % 360.0 - 180.0)


def route_shot(manifest, shot):
    """Return anchor selection for one shot request. Never daisy chains."""
    camera = shot.get("camera", {})
    yaw = float(camera.get("target_yaw", 0.0))
    pitch = float(camera.get("target_pitch", 0.0))
    visual = manifest["visual_canon"]
    face_visible = abs(((yaw + 180.0) % 360.0) - 180.0) <= FACE_YAW_LIMIT
    best_slot, best_score = None, None
    for slot, deg in AZIMUTH_DEGREES.items():
        score = angular_distance(yaw, deg) + abs(pitch) * 0.25
        if best_score is None or score < best_score:
            best_score, best_slot = score, slot
    best_elev, best_escore = None, None
    for slot, deg in ELEVATION_DEGREES.items():
        score = abs(pitch - deg) + angular_distance(yaw, 0.0) * 0.25
        if best_escore is None or score < best_escore:
            best_escore, best_elev = score, slot
    if abs(pitch) >= 60.0:
        anchor_slot, anchor_path = best_elev, visual["elevation_views"][best_elev]
    else:
        anchor_slot, anchor_path = best_slot, visual["azimuth_views"][best_slot]
    return {
        "shot_id": shot.get("shot_id", ""),
        "face_anchor": {
            "path": visual["face_master"],
            "weight": 0.85 if face_visible else 0.0,
            "enabled": face_visible,
        },
        "angle_anchor": {
            "slot": anchor_slot,
            "path": anchor_path,
            "weight": ANGLE_ANCHOR_WEIGHT,
        },
    }


def substitute(node, mapping):
    """Recursively replace {{PLACEHOLDERS}} in a template graph."""
    if isinstance(node, dict):
        return {key: substitute(val, mapping) for key, val in node.items()}
    if isinstance(node, list):
        return [substitute(val, mapping) for val in node]
    if isinstance(node, str):
        for key, val in mapping.items():
            node = node.replace("{{" + key + "}}", str(val))
        return node
    return node


def inject_graph(manifest, shot, template):
    """Fill a template with routed anchors plus shot fields."""
    routing = route_shot(manifest, shot)
    anchors = manifest["identity_anchors"]
    wardrobe = manifest.get("wardrobe_presets", {}).get(
        shot.get("wardrobe_preset", "default"), {})
    mapping = {
        "CHARACTER_ID": manifest["character_id"],
        "TRIGGER_WORD": anchors["trigger_word"],
        "NEGATIVE_PROMPT": anchors["negative_prompt"],
        "FACE_MASTER_PNG": routing["face_anchor"]["path"],
        "FACE_ID_WEIGHT": routing["face_anchor"]["weight"],
        "ANGLE_ANCHOR_PNG": routing["angle_anchor"]["path"],
        "WARDROBE_PROMPT": wardrobe.get("prompt", ""),
        "SHOT_ID": shot.get("shot_id", "shot"),
        "SEED": shot.get("seed", 1),
        "WIDTH": 1024,
        "HEIGHT": 1024,
    }
    return substitute(template, mapping), routing


def self_test():
    assert angular_distance(0, 0) == 0.0
    assert angular_distance(350, 10) == 20.0
    assert angular_distance(180, 0) == 180.0
    manifest = {
        "character_id": "char_ada",
        "identity_anchors": {"trigger_word": "[ADA]",
                             "immutable_physical_prompt": "x",
                             "negative_prompt": "y"},
        "visual_canon": {
            "face_master": "face.png",
            "azimuth_views": {s: f"{s}.png" for s in AZIMUTH_DEGREES},
            "elevation_views": {s: f"{s}.png" for s in ELEVATION_DEGREES},
        },
    }
    front = route_shot(manifest, {"shot_id": "s1",
                                  "camera": {"target_yaw": 10,
                                             "target_pitch": 0}})
    assert front["face_anchor"]["enabled"] is True
    assert front["angle_anchor"]["slot"] == "deg_000"
    back = route_shot(manifest, {"shot_id": "s2",
                                 "camera": {"target_yaw": 180,
                                            "target_pitch": 0}})
    assert back["face_anchor"]["enabled"] is False
    assert back["face_anchor"]["weight"] == 0.0
    assert back["angle_anchor"]["slot"] == "deg_180"
    top = route_shot(manifest, {"shot_id": "s3",
                                "camera": {"target_yaw": 0,
                                           "target_pitch": 80}})
    assert top["angle_anchor"]["slot"] == "top_down_plus80"
    graph, _ = inject_graph(manifest, {"shot_id": "s1", "seed": 7,
                                       "camera": {"target_yaw": 0,
                                                  "target_pitch": 0}},
                            {"1": {"inputs": {"image": "{{FACE_MASTER_PNG}}",
                                              "seed": "{{SEED}}"}}})
    assert graph["1"]["inputs"]["image"] == "face.png"
    assert graph["1"]["inputs"]["seed"] == "7"
    print("SELF TEST PASSED")


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main(argv=None):
    parser = argparse.ArgumentParser(description="Angle router")
    sub = parser.add_subparsers(dest="cmd")
    router = sub.add_parser("route")
    router.add_argument("--manifest", required=True)
    router.add_argument("--shot", required=True)
    router.add_argument("--json", action="store_true")
    injector = sub.add_parser("inject")
    injector.add_argument("--manifest", required=True)
    injector.add_argument("--shot", required=True)
    injector.add_argument("--template", required=True)
    injector.add_argument("--out", default="")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        self_test()
        return 0
    if args.cmd == "route":
        result = route_shot(load_json(args.manifest), load_json(args.shot))
        print(json.dumps(result, indent=2) if args.json else
              f"face={result['face_anchor']['weight']} "
              f"angle={result['angle_anchor']['slot']}")
        return 0
    if args.cmd == "inject":
        graph, routing = inject_graph(load_json(args.manifest),
                                      load_json(args.shot),
                                      load_json(args.template))
        text = json.dumps(graph, indent=2)
        if args.out:
            Path(args.out).write_text(text, encoding="utf-8")
            print(f"wrote {args.out}")
        else:
            print(text)
        return 0
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
