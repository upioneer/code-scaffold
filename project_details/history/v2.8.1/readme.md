# Code Scaffold v2.8.1

## UI Bug Fixes and Polish
* Resolved a critical rendering issue in the TUI where `$esc[H` cursor manipulation caused terminal line ghosting and scroll overlap.
* Restored `Clear-Host` in the TUI render loop while maintaining string buffering to ensure a completely flicker-free and artifact-free screen draw.
* Migrated secondary UI elements (categories, version, controls) from gray to the primary Gold accent color (`#FFBE00`) to match the ASCII logo and ensure a more cohesive and premium aesthetic.
* Added cursor hiding logic during interactive menus to prevent flickering block artifacts and deliver a more application-like experience.
