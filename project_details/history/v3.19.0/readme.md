# Release v3.19.0 : Universal Object Decoupling

## Overview
This patch completes the abstraction and total decoupling of all scaffolding objects (Artifacts, Agent Skills, and Licensing) from the core TUI application state.

## Features
* **Payload License Engine:** Created a native `.licenses/` structure to host MIT, Apache, and GPL markdown payload files natively in the remote Github repository. 
* **Dynamic License UI Hook:** Rewrote `workspace.rs` to dynamically generate the License menu checkboxes directly by parsing `.licenses/` at runtime, completely stripping out all hardcoded License strings.
* **Extraction Bridge Update:** Modified the asynchronous `sync.rs` zip engine to recursively detect and download the `.licenses/` payload folder alongside `.templates/` and `.skills/` into the local `ProjectDirs` application cache.
