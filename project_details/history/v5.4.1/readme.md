# Version 5.4.1

## Core UX Enhancements
* **Dynamic Skill Tooltips:** Patched a UI state desynchronization where the "Press [Shift+D] to delete custom skill" contextual hint failed to appear when scrolling vertically across `(BYOS)` skills. The `update_summary()` invocation is now explicitly fired within the `[Up]` and `[Down]` traversal event loops, ensuring the helper text payload evaluates and renders instantaneously upon targeting a custom resource.
