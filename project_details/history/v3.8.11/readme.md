# Release v3.8.11 - Focus Architecture and Action Map

## Overview
This patch establishes the global structural UI tracking, active input focusing logic, and key event routing matrix.

## Major Changes
* **Event Actions Mapping:** Rebuilt `tui.rs` key mapping to properly intercept focus shifting (Tab/Shift+Tab) and execution dispatch commands (Ctrl+X). Mapped individual layout keys (Up, Down, Left, Right, Enter) directly into the universal application `Action` loop.
* **Component Focus Router:** Restructured `app.rs` to track an `ActiveBlock` property. Keystrokes are now routed explicitly to the individual `.update(action)` trait inside whichever component (Tree, Workspace, Logger) is currently active.
* **Visual Focus Queues:** Updated `Component::draw` traits to accept an `active: bool` parameter. Focused components dynamically rerender their standard layout border into an illuminated yellow queue to denote active cursor injection.
