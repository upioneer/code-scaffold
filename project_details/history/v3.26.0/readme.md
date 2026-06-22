# Version 3.26.0 Walkthrough

## Summary of Changes
This release introduces 4 new terminal-native color themes mapped identically to their classic standard CLI interfaces, expanding the TUI's visual versatility.

## Features Added
1. **New Thematic Profiles:**
   - **OS-Native:** `posh` (PowerShell Classic), `cmd` (Windows Command Prompt), `ubu` (Ubuntu Terminal), `osx` (macOS Terminal).
   - **Nations:** `USA1` (Red/White/Blue), `USA2` (White/Blue/Red), `USA3` (Blue/Red/White).
   - **Sports & Racing:** `KnicksIn5` (NY Knicks Orange/Blue), `WhoDat` (New Orleans Saints Black/Gold), `LosDoyers1` & `LosDoyers2` (LA Dodgers Blue/White/Red), `Tifosi` (Scuderia Ferrari Red/Yellow).
2. **Theme Engine Upgrade:** Re-indexed the TUI engine's core cyclical theme router modulo math from 6 to 18 and strictly alphabetized the entire theme roster to ensure predictable, alphabetical `[T]` key rotation.
3. **Dynamic Footer Navigation:** Implemented dynamic injection of the active theme's string name (e.g., `[T] Theme (posh)`) directly into the global footer navigation bar for immediate visual context.
