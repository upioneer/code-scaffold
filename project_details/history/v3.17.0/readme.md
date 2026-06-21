# Release v3.17.0 - Animated Braille Splash Screen

## Overview
This minor release injects a custom animated unicode braille spinner directly into the Modal Wizard's Welcome Screen. 

## Features
* **Phantom Ticks:** The underlying Crossterm loop has been refactored to emit an `Action::Tick` event if 16ms elapses without keyboard input. 
* **Braille Animations:** The App state now consumes those Ticks and natively animates a Braille overlay using the predefined `BRAILLE_FRAMES` array at an optimal 80ms interval.
