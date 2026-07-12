---
name: p5js
description: Creative coding and visual animations using the p5.js library. Use this skill when the user wants to create interactive visuals, generative art, or custom animations in a web environment.
---

# p5.js Skill

This skill provides a foundation for creating creative coding projects with `p5.js`.

## Getting Started

1.  **Scaffold the project:**
    This skill provides an `index.html` and `sketch.js` in the `assets/` directory.
    -   `index.html`: Boilerplate that loads p5.js and p5.sound from CDN.
    -   `sketch.js`: Basic interaction example with `setup()` and `draw()`.

2.  **Run the sketch:**
    Simply open `index.html` in a web browser. No server is required for basic sketches, but using a local server (like `live-server`) is recommended for advanced projects.

## Core Structure

A p5.js project typically consists of:

-   `setup()`: Runs once. Define `createCanvas()` here.
-   `draw()`: Runs 60 times per second. Update your visual state here.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}
```

## References
-   [p5_api.md](references/p5_api.md) - Common p5.js functions and resources.
