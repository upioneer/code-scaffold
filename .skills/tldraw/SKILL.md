---
name: tldraw
description: Comprehensive toolkit for integrating tldraw into web applications to create interactive canvases, presentations, whiteboards, and data dashboards.
---
# tldraw Integration Skill

## Description
This skill empowers the agent to build highly interactive, visual, and creative applications using the `tldraw` SDK (https://tldraw.dev/). It goes beyond basic whiteboarding to implement advanced features like camera movements, programmatic animations, state transitions, slide show presentations, and dynamic data dashboard charts with interactive graphical elements.

## Capabilities & Use Cases
* **Scrollytelling & Cinematic Camera**: Bind the `editor.camera` to native scroll events or programmatic timelines to fly users through spatial dashboards, zooming and panning seamlessly between data nodes to create immersive, Apple-style landing pages.
* **Living Data Dashboards**: Implement custom shapes with real-time data mutations (e.g., WebSockets or polling), utilizing CSS transitions within `HTMLContainer` to make charts and UI elements physically animate, grow, and react to live data.
* **Custom Tools & State Machines**: Leverage the `tldraw` state machine to build bespoke tools (e.g., a `DataLinkTool` that draws dynamic, auto-routing connecting lines between disparate dashboard widgets).
* **Rich Media & 3D Embeds**: Create custom shapes capable of embedding live Iframe websites, video players, or WebGL/Three.js canvases, allowing rich media to exist natively within the pannable, zoomable space.
* **Spatial Mini-Maps & Radar**: Query `editor.getCurrentPageShapeIds()` to generate custom UI overlays that render a global map of the canvas, enabling instant camera teleportation and navigation.
* **Physics Engine Integration**: Map `tldraw` geometries to a 2D physics engine (like Matter.js) to enable gravity, collisions, and dynamic interactions for shapes when switching into a "simulation mode."
* **Spatial Audio**: Bind Web Audio API nodes to specific spatial coordinates or shapes. As the camera viewport moves closer to or further from an object, the volume and stereo panning of its associated audio dynamically adjust.
* **AI Generative Cursors & Nodes**: Implement multi-player cursor tracking for background AI agents, or create "prompt shapes" that instantly spawn SVG geometry onto the canvas via LLM generation.

## Inputs
* Implementation Goal: The specific visual application to build (e.g., "interactive presentation", "spatial data dashboard", "animated flowchart").
* Tech Stack: The underlying web framework (e.g., React, Next.js, Vite).
* Data Sources: Any JSON or API data required for rendering custom chart shapes.

## Actions
1. **Initialize `tldraw`**: Scaffold the base `<Tldraw />` component within the target application.
2. **Configure Custom Shapes**: Define and register `ShapeUtil` classes for any custom visual elements (charts, dashboard widgets).
3. **Implement Camera Logic**: Write scripts to control the `editor.camera` for animations, framing specific elements, or navigating presentation slides.
4. **Build State Machines**: Define custom states and transitions for complex interactive workflows (e.g., a "Presentation State" that handles arrow key navigation).
5. **Data Binding**: Connect custom shapes to application state or external data sources, ensuring the canvas updates reactively.
6. **UI Customization**: Override default `tldraw` UI components to match the host application's aesthetic.

## Outputs
* React Components embedding the `tldraw` canvas.
* TypeScript definitions for custom shapes and tools.
* Implementation logic for camera animations and state transitions.

## Constraints
* Always ensure custom shapes are fully serializable and handle their own bounding boxes correctly.
* When implementing animations, use `requestAnimationFrame` or the built-in `editor.animateTo` methods to avoid blocking the main thread.
* Maintain a clean separation between the `tldraw` state and the application's global state where necessary.
* Avoid direct DOM manipulation inside the canvas; always use the `tldraw` Editor API.
