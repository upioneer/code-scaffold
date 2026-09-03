# tldraw

**Version:** 1
**Target:** `.skills/tldraw`
**Category:** Publishing & Documentation
**Keywords:** `tldraw`, `infinite-canvas`, `spatial-computing`, `whiteboard`, `canvas-sdk`, `live-collaboration`

## Description
Comprehensive toolkit for integrating tldraw into web applications to create interactive canvases, presentations, whiteboards, and data dashboards.

## Capabilities & Use Cases
This skill leverages the powerful tldraw SDK to transform standard web applications into dynamic, spatial experiences. By utilizing the full breadth of the tldraw API, agents can architect highly interactive and visually stunning interfaces.
* **Scrollytelling & Cinematic Camera**: Bind the `editor.camera` to native scroll events to fly users through spatial dashboards, zooming and panning seamlessly between data nodes.
* **Living Data Dashboards**: Implement custom shapes with real-time data mutations (via WebSockets or polling), allowing charts and UI elements to physically animate and react to live data.
* **Custom Tools & State Machines**: Build bespoke tools (like a DataLinkTool) that draw dynamic, auto-routing connecting lines between dashboard widgets.
* **Rich Media & 3D Embeds**: Create custom shapes that embed live Iframe websites, video players, or WebGL/Three.js canvases within the pannable space.
* **Spatial Mini-Maps**: Generate custom UI overlays that render a global map of the canvas for instant camera teleportation.
* **Physics Engine Integration**: Map tldraw geometries to a 2D physics engine (like Matter.js) to enable gravity, collisions, and dynamic spatial interactions.
* **Spatial Audio**: Bind Web Audio API nodes to shapes, adjusting volume and stereo panning dynamically as the camera moves around the canvas.
* **AI Generative Cursors**: Implement AI agents that act as multiplayer users, physically moving their own cursors and generating shapes on the board alongside the user.

## Usage
Agents should invoke this skill when a user requests an interactive visual interface, a spatial data dashboard, an embedded presentation tool, or advanced canvas manipulations. The skill provides the architectural patterns for registering custom shapes, controlling the camera API, and building complex interactive workflows within a React application.

## Changelog
* **v1** : Initial creation of the tldraw skill featuring advanced camera controls, custom shape integrations for data dashboards, and interactive presentation capabilities.
