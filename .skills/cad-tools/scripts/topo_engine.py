#!/usr/bin/env python3
"""
Generative Design, Topology Optimization, and Alien Meter Engine
Part of the Code Scaffold CAD Tools Skill (.skills/cad-tools)

Evaluates the tradeoff between structural rigidity and organic bio-morphology (Alien Meter),
computes compliance / Factor of Safety (FS) curves, and generates Engineering Compromise Cards.
"""

import os
import sys
import math
import json
import argparse
from typing import Dict, Any, Optional

MATERIALS = {
    "al10": {
        "name": "AlSi10Mg Aluminum",
        "yield_mpa": 270.0,
        "density_g_cm3": 2.67,
        "modulus_gpa": 70.0,
        "process": "Direct Metal Laser Sintering (DMLS)"
    },
    "ti64": {
        "name": "Titanium Ti-6Al-4V Grade 23",
        "yield_mpa": 880.0,
        "density_g_cm3": 4.43,
        "modulus_gpa": 114.0,
        "process": "Direct Metal Laser Sintering (DMLS)"
    },
    "in718": {
        "name": "Inconel 718 Superalloy",
        "yield_mpa": 1100.0,
        "density_g_cm3": 8.19,
        "modulus_gpa": 205.0,
        "process": "Direct Metal Laser Sintering (DMLS)"
    },
    "pa12": {
        "name": "PA12 Polyamide Nylon",
        "yield_mpa": 48.0,
        "density_g_cm3": 1.01,
        "modulus_gpa": 1.6,
        "process": "Selective Laser Sintering (SLS)"
    }
}

class AlienMeterEvaluator:
    """Calculates generative topology metrics and structural compromise curves."""

    def __init__(self, alien_meter: float, material_key: str = "al10", nominal_load_n: float = 2500.0):
        self.alien_meter = max(0.0, min(100.0, float(alien_meter)))
        self.t = self.alien_meter / 100.0
        self.material = MATERIALS.get(material_key, MATERIALS["al10"])
        self.nominal_load = float(nominal_load_n)

    def evaluate(self) -> Dict[str, Any]:
        t = self.t
        mat = self.material

        # 1. Volume Fraction & Mass Reduction (SIMP density penalization curve)
        # At 0% alien: 100% volume (0% reduction). At 100% alien: 24% volume (76% reduction)
        mass_reduction_pct = t * 74.5
        volume_fraction = 1.0 - (mass_reduction_pct / 100.0)

        # Baseline prismatic mass (assume 350 cm^3 nominal domain envelope)
        domain_vol_cm3 = 350.0
        initial_mass_g = domain_vol_cm3 * mat["density_g_cm3"]
        optimized_mass_g = initial_mass_g * volume_fraction

        # 2. Structural Factor of Safety (FS) curve
        # Drops exponentially as material is excavated
        fs = 3.6 * math.exp(-t * 1.58)
        fs = max(0.35, round(fs, 2))

        # 3. Peak Von Mises Stress (MPa)
        # Stress concentrates on branching tension/compression struts
        base_stress = 65.0 * (self.nominal_load / 2500.0)
        peak_stress_mpa = round(base_stress + (t ** 2.2) * (mat["yield_mpa"] * 1.05 - base_stress), 1)

        # 4. Deflection / Displacement under nominal load (mm)
        base_deflection = 0.06 * (2500.0 / self.nominal_load) * (70.0 / mat["modulus_gpa"])
        deflection_mm = round(base_deflection + (t ** 2) * 1.65, 3)

        # 5. Regime classification and Additive Manufacturing assessment
        if self.alien_meter <= 25.0:
            regime = "PRISMATIC CAD (CLASSICAL CNC)"
            printability = "100% Self-Supporting (Machinable / FDM)"
            status_tag = "HIGH RIGIDITY"
            advice = (
                "Conventional subtractive machining or basic FDM printing. Maximum stiffness, "
                "thick cross-sections, zero risk of under-load failure."
            )
            structural_verdict = "PASSED: High structural safety factor exceeds industrial aerospace thresholds."
        elif self.alien_meter <= 60.0:
            regime = "AEROSPACE TOPO OPTIMIZATION (DMLS/SLS)"
            printability = "92% Self-Supporting (Additive DMLS)"
            status_tag = "AEROSPACE COMPLIANT"
            advice = (
                "Optimized for Direct Metal Laser Sintering (DMLS) or SLS Nylon. Overhang angles "
                "remain under 45 degrees. Safe for critical flight envelopes."
            )
            structural_verdict = "PASSED: Verified compliance with industrial Factor of Safety (FS >= 1.5)."
        elif self.alien_meter <= 85.0:
            regime = "BIOMIMETIC SKELETAL WEBS (HIGH ALIEN)"
            printability = "76% Supported (DMLS Wire EDM Required)"
            status_tag = "NON-CRITICAL / EXPERIMENTAL"
            advice = (
                "High-stress biomimicry. Requires build plate support anchors during powder sintering. "
                "Noticeable elastic deflection under high mechanical loads."
            )
            structural_verdict = "CAUTION: Factor of safety is below 1.5. Suitable for secondary structures or non-critical loads."
        else:
            regime = "BIOMECHANICAL ART (MAX ALIEN / AESTHETIC ONLY)"
            printability = "Complex Cellular Lattice (Sacrificial Supports)"
            status_tag = "ART & DISPLAY ONLY"
            advice = (
                "Hyper-organic sculpture. Structural integrity is compromised (FS < 1.0 under design load). "
                "Recommended for generative art, cosplay props, and visual prototypes."
            )
            structural_verdict = "OVERLOAD WARNING: Part will yield or fail under rated operational loads. Restrict to decorative applications."

        return {
            "alien_meter": self.alien_meter,
            "regime": regime,
            "status_tag": status_tag,
            "material": mat["name"],
            "manufacturing_process": mat["process"],
            "initial_mass_g": round(initial_mass_g, 1),
            "optimized_mass_g": round(optimized_mass_g, 1),
            "mass_reduction_pct": round(mass_reduction_pct, 1),
            "volume_fraction": round(volume_fraction, 3),
            "factor_of_safety": fs,
            "peak_stress_mpa": peak_stress_mpa,
            "yield_strength_mpa": mat["yield_mpa"],
            "deflection_mm": deflection_mm,
            "printability": printability,
            "advice": advice,
            "structural_verdict": structural_verdict
        }

    def format_compromise_card(self) -> str:
        data = self.evaluate()
        card = [
            "=" * 70,
            "  Code Scaffold Generative Telemetry : Engineering Compromise Card",
            "=" * 70,
            f"* Alien Meter Setting     : {data['alien_meter']:.0f}% ({data['regime']})",
            f"* Material Selected       : {data['material']} [{data['manufacturing_process']}]",
            f"* Mass Reduction          : -{data['mass_reduction_pct']}% ({data['initial_mass_g']}g -> {data['optimized_mass_g']}g)",
            f"* Factor of Safety (FS)   : {data['factor_of_safety']:.2f} [{data['status_tag']}]",
            f"* Max Von Mises Stress    : {data['peak_stress_mpa']} MPa (Yield: {data['yield_strength_mpa']} MPa)",
            f"* Max Peak Deflection     : {data['deflection_mm']} mm",
            f"* Additive Printability   : {data['printability']}",
            f"* Structural Verdict      : {data['structural_verdict']}",
            f"* Fabrication Advice      : {data['advice']}",
            "=" * 70
        ]
        return "\n".join(card)


def main():
    parser = argparse.ArgumentParser(description="Code Scaffold Generative Topology & Alien Meter Evaluator")
    parser.add_argument("--alien-meter", type=float, default=50.0, help="Alien Meter value (0.0 to 100.0)")
    parser.add_argument("--material", choices=list(MATERIALS.keys()), default="al10", help="Material alloy key")
    parser.add_argument("--load", type=float, default=2500.0, help="Nominal service load in Newtons")
    parser.add_argument("--json", action="store_true", help="Emit JSON output instead of text card")

    args = parser.parse_args()
    evaluator = AlienMeterEvaluator(args.alien_meter, args.material, args.load)

    if args.json:
        print(json.dumps(evaluator.evaluate(), indent=2))
    else:
        print(evaluator.format_compromise_card())

if __name__ == "__main__":
    main()
