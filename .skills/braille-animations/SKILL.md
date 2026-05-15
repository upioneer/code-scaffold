---
name: braille-animations
description: Create and manage unicode braille animations and spinners for CLIs and web apps. Use this skill when the user wants to add loading indicators, progress animations, or custom braille-based art to their terminal or browser-based application.
---

# Braille Animations

This skill provides guidance and tools for using the `unicode-animations` library to create braille-based animations.

## Core Concepts

Braille characters (U+2800 to U+28FF) are used as a 2x4 grid of dots, allowing for high-density "pixel" art and smooth animations in text-only environments.

## Quick Start

1.  **Install the library:**
    ```bash
    npm install unicode-animations
    ```

2.  **Basic Spinner Example (Node.js):**
    ```javascript
    import spinners from 'unicode-animations';

    const { frames, interval } = spinners.braille;
    let i = 0;

    const timer = setInterval(() => {
      process.stdout.write(`\r\x1B[2K ${frames[i++ % frames.length]} Loading...`);
    }, interval);
    ```

## Advanced Usage

### Custom Braille Grids
You can create custom animations by manipulating a 2x4 grid and converting it to braille.

-   **Helper Script:** Use `scripts/braille_helper.js` for local conversion logic.
-   **Grid Mapping:**
    ```
    (0,0) (1,0)  -> Dot 1, Dot 4
    (0,1) (1,1)  -> Dot 2, Dot 5
    (0,2) (1,2)  -> Dot 3, Dot 6
    (0,3) (1,3)  -> Dot 7, Dot 8
    ```

### Available Spinners
For a full list of available spinner patterns and their frame data, see [references/spinners.md](references/spinners.md).

## Implementation Patterns

### CLI Progress Bar with Braille
Use braille dots to represent sub-character progress (1/8th of a character per dot).

### Browser-based Braille Art
Braille characters are ideal for "ASCII" art in the browser as they are monospaced in most environments and offer 8 "pixels" per character.

## References
-   [spinners.md](references/spinners.md) - Detailed spinner data and frame lists.
-   [braille_helper.js](scripts/braille_helper.js) - Utility functions for custom grid conversion.
