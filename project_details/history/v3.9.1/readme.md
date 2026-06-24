# Release v3.9.1 : Multi-Palette Theme Architecture

## Overview
This patch completes Phase 2 of the application build roadmap, separating the core functional architecture away from the UI aesthetics by introducing dynamic layout render parameters.

## Major Changes
* **Dynamic Structural Types:** Re-architected the `src/components/mod.rs` central trait to force all TUI display components to accept a real-time `&Theme` memory structure during the `draw()` loop execution phase.
* **Component Abstraction:** Removed all hardcoded typography and boundary color constraints from the 5 core UI interfaces (`NavTree`, `Workspace`, `LoggerPipe`, `Header`, and `Footer`).
* **RGB Palette Structs:** Created `src/theme.rs` to serve as the unified presentation layer. Embedded custom `Rgb()` color injections for three specific execution palettes: `plum()`, `lime()`, and `ocean()`.
* **Global Background Formatting:** Injected a global background rect-fill into the `app.rs` layout cycle to prevent vibrant UI palettes from clashing with native user-terminal settings, cementing a premium cross-platform aesthetic.
