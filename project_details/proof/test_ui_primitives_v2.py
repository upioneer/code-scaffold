#!/usr/bin/env python3
"""
Test validation script for UI Primitives v2 upgrade:
- Asserts references/motion-looks.css contains all 6 signature looks (studio, editorial, signal, cobalt, peach, monochrome)
- Asserts references/light-field-shader.js contains LightFieldMaterial class and WebGL shader definitions
- Asserts references/comparison-stage.js contains ComparisonStageController class and keyboard shortcuts
- Asserts sandbox/index.html includes v2 badge, Motion Presentation Studio markup, and shader canvas
"""

import os
import sys

def test_motion_looks():
    print("[*] Validating motion-looks.css...")
    css_path = ".skills/ui-primitives/references/motion-looks.css"
    assert os.path.exists(css_path), f"Missing {css_path}"
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()

    looks = ["studio", "editorial", "signal", "cobalt", "peach", "monochrome"]
    for l in looks:
        assert f'[data-motion-look="{l}"]' in content, f"Missing look preset: {l}"

    layouts = ["split", "stack", "spotlight"]
    for lay in layouts:
        assert f'[data-layout="{lay}"]' in content, f"Missing layout preset: {lay}"

    formats = ["16-9", "9-16", "1-1"]
    for fmt in formats:
        assert f'[data-format="{fmt}"]' in content, f"Missing format preset: {fmt}"

    print("  [OK] motion-looks.css verified with all 6 looks and 3 layout matrices.")

def test_light_field_shader():
    print("[*] Validating light-field-shader.js...")
    js_path = ".skills/ui-primitives/references/light-field-shader.js"
    assert os.path.exists(js_path), f"Missing {js_path}"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "class LightFieldMaterial" in content, "Missing LightFieldMaterial class"
    assert "uniform vec2 resolution;" in content, "Missing shader uniform resolution"
    assert "uniform float time;" in content, "Missing shader uniform time"
    assert "void main()" in content, "Missing shader main entry"
    assert "IntersectionObserver" in content, "Missing low-power IntersectionObserver optimization"
    print("  [OK] light-field-shader.js verified with WebGL shader and low-power observer.")

def test_comparison_stage():
    print("[*] Validating comparison-stage.js...")
    js_path = ".skills/ui-primitives/references/comparison-stage.js"
    assert os.path.exists(js_path), f"Missing {js_path}"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "class ComparisonStageController" in content, "Missing ComparisonStageController class"
    assert "setLook" in content, "Missing setLook method"
    assert "setLayout" in content, "Missing setLayout method"
    assert "setFormat" in content, "Missing setFormat method"
    assert "handleScrub" in content, "Missing handleScrub method"
    assert "Space" in content, "Missing Space keyboard shortcut"
    print("  [OK] comparison-stage.js verified with multi-layout controller and transport scrubbing.")

def test_sandbox_v2():
    print("[*] Validating sandbox/index.html...")
    html_path = ".skills/ui-primitives/sandbox/index.html"
    assert os.path.exists(html_path), f"Missing {html_path}"
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert ">v2</span>" in content, "Missing v2 badge in sandbox header"
    assert "Motion Presentation Studio" in content, "Missing Motion Presentation Studio section"
    assert "motionShaderCanvas" in content, "Missing motionShaderCanvas element"
    assert "demo-motion-stage" in content, "Missing demo-motion-stage element"
    assert "cs-transport-bar" in content, "Missing transport bar element"
    print("  [OK] sandbox/index.html verified with v2 components and interactive studio stage.")

if __name__ == "__main__":
    test_motion_looks()
    test_light_field_shader()
    test_comparison_stage()
    test_sandbox_v2()
    print("\n=======================================================")
    print("  UI PRIMITIVES V2 SKILLFORGE UPGRADE VALIDATED 100% OK")
    print("=======================================================")
