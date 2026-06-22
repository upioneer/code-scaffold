# Version 3.27.0 Walkthrough

## Summary of Changes
This release fine-tunes existing themes and introduces two new thematic profiles (`LosDoyers3` and `USA4`), further expanding the customization options and increasing the total cyclable themes to 20.

## Features Added & Refined
1. **Theme Roster Expansion:**
   - **`LosDoyers3`:** Added a third LA Dodgers-inspired variant utilizing Dodger Blue backgrounds paired natively with Dodger Silver primary interfaces and white text for high contrast.
   - **`USA4`:** Included a fourth USA variant configured with a Deep Blue background, striking White primary UI components, and signature Bright Red accents.
2. **Color Precision Adjustments:**
   - **`WhoDat` (New Orleans Saints):** Reconfigured the background color layer from charcoal (`#101820`) to absolute jet black (`#000000`) for truer contrast alongside the Saints Gold (`#D3BC8D`) elements.
   - **`KnicksIn5` (NY Knicks):** Officially mapped and confirmed the use of the precise New York Blue (`#006BB6`) against the vivid Orange (`#F58426`).
3. **Core Engine Modulo Uplift:** Recalibrated the alphabetical looping mechanism array from 18 slots to 20, keeping all current and newly added themes strictly alphabetized. All explicit string names mapping to these themes have been refactored to be entirely lowercase.
4. **QoL Navigation Overhaul:** Restrained the "auto-select" toggle behavior (fired implicitly when `Enter` is pressed while navigating the Workspace panel) strictly to the `Deployment Target` and `License` categories. This resolves a broader UX issue where exploring arbitrary list options across the app triggered unintentional state selections.
