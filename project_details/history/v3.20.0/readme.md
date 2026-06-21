# Release v3.20.0 - Quality of Life & Persona Branching

## Overview
This update introduces intelligent wizard branching alongside robust backward navigation hooks, drastically improving UX during onboarding loops.

## Features
* **Reverse State Navigation:** Overloaded `[Shift+Tab]` globally during the wizard process, allowing users to accurately rewind back through their selections without resetting the TUI.
* **Intelligent Persona Branching:** Interrogates the Workspace payload for `agent.md`. If toggled, seamlessly spawns an explicit subset menu `AgentPersona` (Web Dev, DevOps, Systems Scripting, Mobile, DBA) specifically tailored to condition testing instructions.
* **Mutually Exclusive States:** Bound License toggling and Agent Persona selection to mutual exclusivity, guaranteeing data validity before final deployment rendering.
