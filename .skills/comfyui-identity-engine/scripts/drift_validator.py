"""Anti-drift QA gate: cosine verdicts for face, wardrobe, and voice.

Pure standard library. Feed measured cosine scores plus thresholds and
get PASS, REPAIRABLE, or REJECT verdicts with the prescribed action:

  drift_validator.py --face 0.69 --wardrobe 0.81 --voice 0.85 [--json]
  drift_validator.py --self-test

Face rule: >= passline passes; repair band triggers a FaceDetailer
inpaint at denoise 0.42 then rescore; below the band rejects, bumps the
identity weight by +0.08, and regenerates. Wardrobe and voice are binary
gates with their documented recoveries.
"""

import argparse
import json
import math
import sys

FACE_PASS = 0.72
FACE_REPAIR_FLOOR = 0.58
FACE_REPAIR_DENOISE = 0.42
FACE_WEIGHT_BUMP = 0.08
WARDROBE_PASS = 0.78
VOICE_PASS = 0.82
VOICE_INDEX_BUMP = 0.10


def cosine(a, b):
    """Cosine similarity for equal length vectors, no dependencies."""
    if len(a) != len(b) or not a:
        raise ValueError("vectors must be non-empty and equal length")
    dot = sum(x * y for x, y in zip(a, b))
    mag = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    if mag == 0:
        raise ValueError("zero magnitude vector")
    return max(-1.0, min(1.0, dot / mag))


def face_verdict(score, face_pass=FACE_PASS, repair_floor=FACE_REPAIR_FLOOR):
    if score >= face_pass:
        return {"check": "face", "score": score, "verdict": "PASS",
                "action": "commit to output"}
    if score >= repair_floor:
        return {"check": "face", "score": score, "verdict": "REPAIRABLE",
                "action": f"FaceDetailer inpaint at denoise "
                          f"{FACE_REPAIR_DENOISE}, then rescore"}
    return {"check": "face", "score": score, "verdict": "REJECT",
            "action": f"discard seed, bump identity weight "
                      f"+{FACE_WEIGHT_BUMP}, regenerate"}


def wardrobe_verdict(score, wardrobe_pass=WARDROBE_PASS):
    if score >= wardrobe_pass:
        return {"check": "wardrobe", "score": score, "verdict": "PASS",
                "action": "commit to output"}
    return {"check": "wardrobe", "score": score, "verdict": "REJECT",
            "action": "reject or inpaint garment region, then rescore"}


def voice_verdict(score, voice_pass=VOICE_PASS):
    if score >= voice_pass:
        return {"check": "voice", "score": score, "verdict": "PASS",
                "action": "commit to output"}
    return {"check": "voice", "score": score, "verdict": "REJECT",
            "action": f"resynthesize with fresh seed, raise RVC index_rate "
                      f"+{VOICE_INDEX_BUMP}"}


def self_test():
    assert abs(cosine([1, 0], [1, 0]) - 1.0) < 1e-9
    assert abs(cosine([1, 0], [0, 1]) - 0.0) < 1e-9
    assert face_verdict(0.72)["verdict"] == "PASS"
    assert face_verdict(0.71)["verdict"] == "REPAIRABLE"
    assert face_verdict(0.58)["verdict"] == "REPAIRABLE"
    assert face_verdict(0.579)["verdict"] == "REJECT"
    assert wardrobe_verdict(0.78)["verdict"] == "PASS"
    assert wardrobe_verdict(0.77)["verdict"] == "REJECT"
    assert voice_verdict(0.82)["verdict"] == "PASS"
    assert voice_verdict(0.81)["verdict"] == "REJECT"
    print("SELF TEST PASSED")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Drift QA gate")
    parser.add_argument("--face", type=float, default=None)
    parser.add_argument("--wardrobe", type=float, default=None)
    parser.add_argument("--voice", type=float, default=None)
    parser.add_argument("--face-pass", type=float, default=FACE_PASS)
    parser.add_argument("--repair-floor", type=float,
                        default=FACE_REPAIR_FLOOR)
    parser.add_argument("--wardrobe-pass", type=float, default=WARDROBE_PASS)
    parser.add_argument("--voice-pass", type=float, default=VOICE_PASS)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        self_test()
        return 0
    results = []
    if args.face is not None:
        results.append(face_verdict(args.face, args.face_pass,
                                    args.repair_floor))
    if args.wardrobe is not None:
        results.append(wardrobe_verdict(args.wardrobe, args.wardrobe_pass))
    if args.voice is not None:
        results.append(voice_verdict(args.voice, args.voice_pass))
    if not results:
        parser.error("pass at least one of --face, --wardrobe, --voice")
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for item in results:
            print(f"{item['check']}: {item['score']} -> "
                  f"{item['verdict']} ({item['action']})")
    return 1 if any(r["verdict"] == "REJECT" for r in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
