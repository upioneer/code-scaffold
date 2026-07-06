---
name: TUI Splash
description: Architectural playbook and best practices for building robust, instant-on, and visually stunning modern terminal splash screens.
version: 1
---

# TUI Splash Architectural Playbook

When building modern CLI tools and Terminal User Interfaces (TUIs), the splash screen is the first interaction the user has with the application. This skill provides the architectural playbook for crafting a modern, robust, and instantaneous splash screen.

## 1. The "Instant First Frame" Architecture
The biggest secret to a high-quality splash screen isn't the text art: it's the timing. If your terminal stays blank for even half a second while Python or Node initializes, the tool feels sluggish.

* **Render before you load**: Print your initial banner before importing heavy libraries, initializing runtime dependencies, or making network connections.
* **The Shim Approach**: For heavy runtimes, use a lightweight compiled shim (like a tiny Go or Rust binary) or a fast shell script wrapper that instantly prints the ANSI escape sequence for the splash screen, then hands execution over to the main application.
* **Progressive Enhancement**: As seen in Hermes, paint the static layout immediately, then let the dynamic sections (tools, skills, loaded models) fill in progressively as they initialize in the background.

## 2. Crafting the Visuals
Modern TUI text art rarely uses standard keyboard characters. It uses specific Unicode blocks and True Color (24-bit) ANSI escape sequences.

* **Use Block Elements**: Instead of `/` and `\`, use Unicode half-blocks (`▀`, `▄`, `█`) to double your vertical resolution. Tools like Chafa or image-to-ANSI converters can turn standard PNG logos into high-resolution terminal blocks.
* **Typography**: For large text, use FIGlet or TOIlet generators with modern fonts like "ANSI Shadow" or "Slant".
* **Gradients and Shading**: Apply gradient text rendering. Instead of flat 16-color palettes, interpolate standard hex colors across the characters using true color escape codes (e.g., `\x1b[38;2;R;G;Bm`).

## 3. Dynamic Banners (The Hermes Layout)
A modern splash screen isn't just a logo; it serves as a dashboard confirming the app's state.

* **Collapsible Sections**: Instead of a wall of text, group initialization states into collapsible headers using chevrons (`❯ Tools [3]`, `❯ Skills [Loaded]`).
* **Differential Updates**: Do not clear the screen and reprint the whole banner. Use cursor movement escape sequences (e.g., `\x1b[1A` to move up) to overwrite specific lines. This prevents flickering while the splash screen updates with real-time loading metrics.

## 4. Terminal Hygiene
A high-quality TUI respects the user's environment.

* **Light/Dark Auto-Detection**: Keep the main body text in the terminal's default foreground color so it remains legible. If your banner relies on background colors, attempt to query the terminal's background (`\033]11;?\007`) or check the `COLORFGBG` environment variable to swap themes automatically.
* **The TTY Check**: Always check if standard output is an interactive terminal (`isatty()`). If the user is piping your tool into a file or grep, completely disable the splash screen and output raw logs to avoid polluting their data with ANSI garbage.
* **Alternate Screen Buffer**: If your tool is a full-screen application, send the `\x1b[?1049h` sequence to switch to the alternate buffer. When the user quits, send `\x1b[?1049l` to restore their previous terminal state without leaving a messy scrollback history.

## 5. The Best Tooling by Language
To build this without manually writing raw ANSI sequences, use these modern UI libraries:

* **Go**: `Charmbracelet/Lipgloss` (for styling and layout) and `Bubble Tea` (for the interactive event loop). This is the gold standard for modern CLI aesthetics.
* **Rust**: `Ratatui`. Highly performant, zero-flicker rendering used by the fastest modern terminal tools.
* **Python**: `Rich` (for instant, beautiful layouts and progress bars) or `Textual` (if the splash screen transitions into a full interactive dashboard).
* **Node.js / TypeScript**: `Ink` (lets you build TUIs using React components) or `Clack` (for beautiful, lightweight prompt flows).
