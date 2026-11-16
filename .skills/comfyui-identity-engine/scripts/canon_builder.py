"""Canon builder: prompt compiler, slicing plan, and manifest scaffolding.

Embeds the deterministic CANON_VIEW_PROMPTS used to drive multi-angle
edit nodes, emits the 14-view slicing plan for composite sheets, and
scaffolds plus validates character_manifest.json files.

  canon_builder.py prompts [--json]
  canon_builder.py slice-plan --sheet 2048x2048 --grid 2x2 [--json]
  canon_builder.py scaffold --character-id char_ada --out manifest.json
  canon_builder.py validate manifest.json
  canon_builder.py --self-test
"""

import argparse
import json
import re
import sys
from pathlib import Path

CANON_VIEW_PROMPTS = {
    "a_pose_sheet": (
        "Reference character from <image>. Keep exact facial bone structure, hairstyle, skin tone, body proportions, "
        "and outfit details. Full-body standing 45-degree A-pose across 4 orthographic panels: front center view, "
        "backside center view, strict left profile view, and front-left three-quarter view. Visible gap between upper "
        "arms and torso in every panel, elbows softly straight, palms facing inward with relaxed straight fingers. "
        "Camera at mid-body height, 85mm orthographic lens, head-to-toe framing including footwear, flat neutral "
        "studio lighting, solid #808080 grey background, zero perspective distortion."
    ),
    "t_pose_rig": (
        "Reference character from <image>. Full-body orthographic front view in a strict horizontal 90-degree T-pose. "
        "Arms extended straight out horizontally at shoulder level, palms facing down, legs straight and shoulder-width "
        "apart. Exact same face, hair, and outfit as <image>. Flat studio lighting, solid #808080 background."
    ),
    "upper_quarter_plus35": (
        "Reference character from <image>. High-angle upper-quarter shot (+35 degrees camera elevation looking down "
        "at subject), three-quarter front-left azimuth. Maintain exact facial geometry, hairline, and outfit collar/shoulder "
        "details under foreshortened perspective. Flat even lighting, solid #808080 background."
    ),
    "lower_quarter_minus35": (
        "Reference character from <image>. Low-angle lower-quarter heroic shot (-35 degrees camera elevation looking up "
        "at subject), three-quarter front-right azimuth. Accurate chin, jawline, and torso perspective. Maintain exact "
        "identity, hair, and outfit from <image>. Flat even lighting, solid #808080 background."
    ),
    "top_down_plus80": (
        "Reference character from <image>. Extreme overhead bird's-eye top-down view (+80 degrees camera pitch looking "
        "straight down from above). Crown of head, shoulders, and foreshortened body visible. Exact hair parting, color, "
        "and shoulder wardrobe details from <image>. Solid #808080 background."
    ),
}

AZIMUTH_SLOTS = ["deg_000", "deg_045", "deg_090", "deg_135",
                 "deg_180", "deg_225", "deg_270", "deg_315"]
ELEVATION_SLOTS = ["upper_quarter_plus35", "lower_quarter_minus35",
                   "top_down_plus80", "worms_eye_minus70"]
EMOTIONS = ["neutral", "projected", "whisper", "urgent", "melodic"]
REQUIRED_TOP = ["character_id", "version", "identity_anchors",
                "visual_canon", "voice_canon", "qa_thresholds"]


def slice_plan(sheet_w, sheet_h, cols, rows):
    """Even grid slicing plan for a composite sheet. Never ships grids downstream."""
    if cols < 1 or rows < 1:
        raise ValueError("grid dimensions must be positive")
    cell_w, cell_h = sheet_w // cols, sheet_h // rows
    cells = []
    for row in range(rows):
        for col in range(cols):
            cells.append({
                "cell": [col, row],
                "crop": [col * cell_w, row * cell_h,
                         (col + 1) * cell_w, (row + 1) * cell_h],
            })
    return {"sheet": [sheet_w, sheet_h], "grid": [cols, rows],
            "cell": [cell_w, cell_h], "cells": cells}


def scaffold_manifest(character_id):
    if not re.match(r"^char_[a-z0-9_]+$", character_id):
        raise ValueError("character_id must match ^char_[a-z0-9_]+$")
    base = f"canon/{character_id}"
    return {
        "character_id": character_id,
        "version": "1",
        "identity_anchors": {
            "trigger_word": "[CHAR_ID]",
            "immutable_physical_prompt": "FILL: bone structure, eyes, skin, hairline, marks, build. No clothing.",
            "negative_prompt": "FILL: defects to avoid",
        },
        "wardrobe_presets": {
            "default": {"prompt": "FILL", "hex_palette": ["#808080"],
                        "reference_crop_path": f"{base}/wardrobe_default.png"},
        },
        "visual_canon": {
            "face_master": f"{base}/face_master_1024.png",
            "rig_poses": {
                "a_pose_front": f"{base}/pose_a_front.png",
                "t_pose_front": f"{base}/pose_t_front.png",
            },
            "azimuth_views": {slot: f"{base}/angle_{slot[4:]}.png"
                              for slot in AZIMUTH_SLOTS},
            "elevation_views": {slot: f"{base}/{slot}.png"
                                for slot in ELEVATION_SLOTS},
        },
        "voice_canon": {
            "engine": "F5-TTS",
            "rvc_model_path": f"{base}/voice/model.pth",
            "rvc_index_path": f"{base}/voice/model.index",
            "f0_up_key": 0,
            "emotional_matrix": {
                emo: {"wav": f"{base}/voice/{emo}.wav",
                      "ref_text": "FILL: exact transcript"}
                for emo in EMOTIONS
            },
        },
        "qa_thresholds": {
            "min_arcface_cosine": 0.72,
            "min_clip_wardrobe_cosine": 0.78,
            "min_voice_dvector_cosine": 0.82,
        },
    }


def validate_manifest(manifest):
    """Structural check against the required contract. Returns error list."""
    errors = []
    for key in REQUIRED_TOP:
        if key not in manifest:
            errors.append(f"missing top-level '{key}'")
    if not re.match(r"^char_[a-z0-9_]+$",
                    str(manifest.get("character_id", ""))):
        errors.append("character_id must match ^char_[a-z0-9_]+$")
    anchors = manifest.get("identity_anchors", {})
    for key in ("trigger_word", "immutable_physical_prompt",
                "negative_prompt"):
        if not anchors.get(key):
            errors.append(f"identity_anchors.{key} is empty")
    visual = manifest.get("visual_canon", {})
    for key in ("face_master", "rig_poses", "azimuth_views",
                "elevation_views"):
        if key not in visual:
            errors.append(f"visual_canon.{key} is missing")
    for slot in AZIMUTH_SLOTS:
        if slot not in visual.get("azimuth_views", {}):
            errors.append(f"visual_canon.azimuth_views.{slot} is missing")
    for slot in ELEVATION_SLOTS:
        if slot not in visual.get("elevation_views", {}):
            errors.append(f"visual_canon.elevation_views.{slot} is missing")
    voice = manifest.get("voice_canon", {})
    for emo in EMOTIONS:
        entry = voice.get("emotional_matrix", {}).get(emo, {})
        if not entry.get("wav") or not entry.get("ref_text"):
            errors.append(f"voice_canon.emotional_matrix.{emo} incomplete")
    return errors


def self_test():
    assert len(CANON_VIEW_PROMPTS) == 5
    for name, prompt in CANON_VIEW_PROMPTS.items():
        assert "<image>" in prompt, name
        assert "#808080" in prompt, name
    plan = slice_plan(2048, 2048, 2, 2)
    assert len(plan["cells"]) == 4
    assert plan["cells"][3]["crop"] == [1024, 1024, 2048, 2048]
    manifest = scaffold_manifest("char_ada")
    assert validate_manifest(manifest) == []
    assert len(manifest["visual_canon"]["azimuth_views"]) == 8
    assert len(manifest["visual_canon"]["elevation_views"]) == 4
    assert len(manifest["voice_canon"]["emotional_matrix"]) == 5
    broken = {"character_id": "nope"}
    assert len(validate_manifest(broken)) >= 5
    print("SELF TEST PASSED")


def parse_dims(text):
    match = re.match(r"^(\d+)x(\d+)$", text)
    if not match:
        raise ValueError(f"bad dims '{text}'; want WxH like 2048x2048")
    return int(match.group(1)), int(match.group(2))


def main(argv=None):
    parser = argparse.ArgumentParser(description="Canon builder")
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("prompts").add_argument("--json", action="store_true")
    slicer = sub.add_parser("slice-plan")
    slicer.add_argument("--sheet", default="2048x2048")
    slicer.add_argument("--grid", default="2x2")
    slicer.add_argument("--json", action="store_true")
    scaff = sub.add_parser("scaffold")
    scaff.add_argument("--character-id", required=True)
    scaff.add_argument("--out", default="")
    validator = sub.add_parser("validate")
    validator.add_argument("manifest")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        self_test()
        return 0
    if args.cmd == "prompts":
        payload = CANON_VIEW_PROMPTS
        print(json.dumps(payload, indent=2) if args.json else
              "\n\n".join(f"[{k}]\n{v}" for k, v in payload.items()))
        return 0
    if args.cmd == "slice-plan":
        sw, sh = parse_dims(args.sheet)
        cols, rows = parse_dims(args.grid)
        plan = slice_plan(sw, sh, cols, rows)
        print(json.dumps(plan, indent=2) if args.json else
              f"{len(plan['cells'])} cells of {plan['cell']}")
        return 0
    if args.cmd == "scaffold":
        manifest = scaffold_manifest(args.character_id)
        text = json.dumps(manifest, indent=2)
        if args.out:
            Path(args.out).write_text(text, encoding="utf-8")
            print(f"wrote {args.out}")
        else:
            print(text)
        return 0
    if args.cmd == "validate":
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        errors = validate_manifest(manifest)
        if errors:
            for item in errors:
                print(f"ERROR: {item}")
            return 1
        print("VALID: manifest satisfies the contract")
        return 0
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
