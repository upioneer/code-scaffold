# Ratatui TUI Framework

**Version:** 8

**Target:** `.skills/ratatui`

**Category:** Frontend & UI Design

**Keywords:** `ratatui`, `rust-tui`, `terminal-ui`, `crossterm`, `cli-dashboard`, `console-app`, `tui-architecture`, `terminal-widgets`, `mvu-elm`, `tokio-event-loop`

## Description
Build high-performance, robust Terminal User Interfaces (TUI) with modern Ratatui architecture, safe terminal lifecycle handling, async event loops, and rich component pipelines in Rust.

## Capabilities & Use Cases
* **Interactive Terminal Simulator** : Web-based interactive Ratatui TUI simulator with real-time sparklines, multi-column process monitor, animated gauges, circular log ringbuffer, and keyboard hotkey navigation
* **Terminal Lifecycle & Panic Recovery**: Implements crash-resilient terminal initialization and teardown routines with automatic panic hooks that restore raw mode, leave alternate screen buffers, and unhide cursors to prevent broken shell sessions.
* **Elm Architecture (MVU) & Action Dispatch**: Enforces the Model-View-Update pattern with strongly typed Action enums, unidirectional data flow, and pure rendering functions that decouple business logic from presentation.
* **Hierarchical Component Trait Pipeline**: Decomposes complex terminal dashboards into modular, self-contained components supporting lifecycle hooks, action handlers, event routing, and independent frame drawing.
* **Asynchronous Event Loop & Concurrency**: Integrates Tokio asynchronous channels with non-blocking Crossterm event streams to handle keyboard input, terminal resizing, periodic tick timers, and background I/O operations without UI frame drops.
* **Cross-Platform Key Event Deduplication**: Explicitly filters Crossterm `KeyEventKind::Press` events to eliminate duplicate key triggers on Windows platforms while maintaining responsive input across macOS and Linux.
* **Dynamic Layout Constraints & Responsive Breakpoints**: Employs flexible constraint primitives including Length, Percentage, Ratio, Min, Max, and Fill alongside dynamic centered rectangle algorithms for responsive modal overlays and auto-collapsing panels.
* **Rich Styling Primitives & TrueColor Palettes**: Features hierarchical Span, Line, and Text composition with TrueColor 24-bit RGB palettes, ANSI 256 fallbacks, text modifiers, and centralized theme providers for instant runtime theme switching.
* **Comprehensive Widget Ecosystem**: Delivers production recipes for complex widgets including multi-column Tables with TableState, scrolling Lists with ListState, wrapped Paragraphs, Gauges, Sparklines, BarCharts, and modal Clear layers.
* **Hardware Cursor & Modal Input Handling**: Orchestrates multi-mode terminal applications (Normal, Insert, Visual, Command) with physical cursor positioning, text edit buffers, grapheme clustering, and mouse hit testing.
* **Headless Unit Testing & Buffer Assertions**: Provides deterministic testing workflows using Ratatui TestBackend to verify visual frame outputs and state mutations in headless CI environments without requiring physical terminal emulators.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines, architectural blueprints, and production-grade Rust implementations.

## Changelog
* **v8** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v7** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v6** : Integrated interactive Ratatui TUI Terminal Simulator sandbox and updated manifest flags
* **v5** : Upgraded skill with comprehensive TUI application fundamentals, terminal lifecycle safety, panic recovery hooks, async event streaming, and modular component architectures
* **v4** : Expanded capability descriptions
* **v3** : Standardize ratatui meta.json and manifest
* **v2** : Add Description Pane and Prioritize Deployment Target
* **v1** : UX cleanups, theme hotkey, and web dev security (v3.14.0)
