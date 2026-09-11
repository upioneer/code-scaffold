---
​‌‍name: Ratatui TUI Framework
description: Build high-performance, robust Terminal User Interfaces (TUI) with modern Ratatui architecture, safe terminal lifecycle handling, async event loops, and rich component pipelines in Rust.
version: 5
---

# Ratatui TUI Framework Skill

Use this skill when designing, building, modernizing, or debugging high-performance Terminal User Interfaces (TUI) using the Ratatui ecosystem in Rust.

* **Entity Mapping**: Rust terminal application runtimes, Crossterm backend primitives, asynchronous event loops, reactive component trees, and terminal layout constraints.
* **Problem Domain**: Resilient terminal lifecycle management, flicker-free rendering, responsive multi-column layouts, modal state machines, and headless UI testing.

---

## 1. Terminal Lifecycle & Panic Safety Architecture

Terminal applications mutate shared host terminal state: raw mode, alternate screen buffers, mouse capture, and cursor visibility. Failure to restore this state upon exit or fatal panic corrupts the host shell environment.

### Recommended Dual-Path Lifecycle Architecture

* **Path A (Modern Ratatui v0.28+ Idiom)**: Built-in convenience constructors for clean entry and exit.
* **Path B (Production RAII Guard with Panic Interceptor)**: Explicit Crossterm backend management with an RAII guard and panic hook to guarantee terminal restoration under all exit conditions.

### Implementation: Resilient Terminal Guard with Panic Recovery

```rust
use std::io::{self, stdout, Stdout};
use ratatui::prelude::*;
use ratatui::crossterm::{
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    event::{EnableMouseCapture, DisableMouseCapture},
    execute,
};

pub struct TuiManager {
    pub terminal: Terminal<CrosstermBackend<Stdout>>,
}

impl TuiManager {
    pub fn init() -> io::Result<Self> {
        // 1. Install panic hook before mutating terminal state
        Self::install_panic_hook();

        // 2. Configure terminal state: raw mode, alternate screen buffer, mouse capture
        enable_raw_mode()?;
        let mut stdout = stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;

        // 3. Instantiate backend and clear terminal screen
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;
        terminal.clear()?;
        terminal.hide_cursor()?;

        Ok(Self { terminal })
    }

    pub fn restore(&mut self) -> io::Result<()> {
        // Reverse terminal mutations in strict reverse order
        disable_raw_mode()?;
        execute!(self.terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;
        self.terminal.show_cursor()?;
        Ok(())
    }

    fn install_panic_hook() {
        let original_hook = std::panic::take_hook();
        std::panic::set_hook(Box::new(move |panic_info| {
            // Always restore terminal before printing panic backtrace
            let _ = disable_raw_mode();
            let _ = execute!(io::stdout(), LeaveAlternateScreen, DisableMouseCapture);
            let _ = execute!(io::stdout(), ratatui::crossterm::cursor::Show);
            original_hook(panic_info);
        }));
    }
}

impl Drop for TuiManager {
    fn drop(&mut self) {
        let _ = self.restore();
    }
}
```

---

## 2. Event Loop & Concurrency Architecture

Interactive TUI applications require non-blocking event loops capable of multiplexing user keyboard input, mouse clicks, window resize triggers, periodic animation ticks, and asynchronous background worker results.

### Windows Keyboard Deduplication Invariant

On Windows operating systems, Crossterm emits multiple event kinds for a single keystroke: `KeyEventKind::Press`, `KeyEventKind::Repeat`, and `KeyEventKind::Release`. Always filter key events strictly for `KeyEventKind::Press` to avoid duplicate action triggers across cross-platform deployments.

### High-Performance Asynchronous Event Loop Pattern (Tokio & MPSC Channels)

```rust
use std::time::Duration;
use ratatui::crossterm::event::{self, Event as CrosstermEvent, KeyEvent, KeyEventKind};
use tokio::sync::mpsc;

#[derive(Debug, Clone)]
pub enum AppEvent {
    Tick,
    Key(KeyEvent),
    Mouse(event::MouseEvent),
    Resize(u16, u16),
    BackgroundData(String),
    Error(String),
}

pub struct EventHandler {
    rx: mpsc::UnboundedReceiver<AppEvent>,
    _task: tokio::task::JoinHandle<()>,
}

impl EventHandler {
    pub fn new(tick_rate: Duration) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let event_tx = tx.clone();

        let task = tokio::spawn(async move {
            let mut tick_interval = tokio::time::interval(tick_rate);
            loop {
                let tick_delay = tick_interval.tick();
                let crossterm_event = tokio::task::spawn_blocking(|| {
                    if event::poll(Duration::from_millis(50)).unwrap_or(false) {
                        event::read().ok()
                    } else {
                        None
                    }
                });

                tokio::select! {
                    _ = tick_delay => {
                        if event_tx.send(AppEvent::Tick).is_err() { break; }
                    }
                    Ok(Some(evt)) = crossterm_event => {
                        match evt {
                            CrosstermEvent::Key(key) => {
                                // CRITICAL: Filter for Press events on Windows
                                if key.kind == KeyEventKind::Press {
                                    if event_tx.send(AppEvent::Key(key)).is_err() { break; }
                                }
                            }
                            CrosstermEvent::Mouse(mouse) => {
                                if event_tx.send(AppEvent::Mouse(mouse)).is_err() { break; }
                            }
                            CrosstermEvent::Resize(w, h) => {
                                if event_tx.send(AppEvent::Resize(w, h)).is_err() { break; }
                            }
                            _ => {}
                        }
                    }
                }
            }
        });

        Self { rx, _task: task }
    }

    pub async fn next(&mut self) -> Option<AppEvent> {
        self.rx.recv().await
    }
}
```

---

## 3. Application State & Architectural Patterns

### Pattern A: Elm Architecture (Model-View-Update / MVU)

The Model-View-Update pattern guarantees unidirectional data flow and clear separation of state transition logic from layout rendering:

```rust
pub enum Action {
    Quit,
    NextTab,
    PrevTab,
    SelectItem(usize),
    ToggleModal,
    Noop,
}

pub struct AppModel {
    pub current_tab: usize,
    pub selected_item: usize,
    pub is_modal_open: bool,
    pub should_quit: bool,
}

impl AppModel {
    pub fn update(&mut self, action: Action) {
        match action {
            Action::Quit => self.should_quit = true,
            Action::NextTab => self.current_tab = (self.current_tab + 1) % 4,
            Action::PrevTab => self.current_tab = self.current_tab.checked_sub(1).unwrap_or(3),
            Action::SelectItem(idx) => self.selected_item = idx,
            Action::ToggleModal => self.is_modal_open = !self.is_modal_open,
            Action::Noop => {}
        }
    }
}
```

### Pattern B: Modular Component Trait Pipeline

For multi-screen dashboards and complex CLIs, split the UI into modular components adhering to an explicit lifecycle contract:

```rust
use ratatui::prelude::*;
use tokio::sync::mpsc::UnboundedSender;

pub trait Component {
    fn register_action_handler(&mut self, _tx: UnboundedSender<Action>) -> std::io::Result<()> {
        Ok(())
    }
    fn handle_key_events(&mut self, _key: KeyEvent) -> std::io::Result<Option<Action>> {
        Ok(None)
    }
    fn update(&mut self, _action: Action) -> std::io::Result<Option<Action>> {
        Ok(None)
    }
    fn draw(&mut self, frame: &mut Frame, area: Rect) -> std::io::Result<()>;
}
```

---

## 4. Layout Engine & Responsive Geometry

Ratatui provides a flexbox-style constraint solver for calculating rectangular bounding boxes (`Rect`).

### Core Constraint Types

* `Constraint::Length(u16)`: Exact, inflexible cell dimension.
* `Constraint::Percentage(u16)`: Relative proportion of the available parent area.
* `Constraint::Ratio(u32, u32)`: Exact fractional division (e.g. 1/3, 2/5).
* `Constraint::Min(u16)`: Flexible space that never shrinks below the specified minimum.
* `Constraint::Max(u16)`: Flexible space that never grows beyond the specified maximum.
* `Constraint::Fill(u16)`: Proportional distribution of remaining residual space.

### Nested Dashboard Layout Hierarchy

```rust
fn build_dashboard_layout(area: Rect) -> (Rect, Rect, Rect, Rect) {
    // 1. Primary vertical division: Header (3), Main Body (Remaining), Status Bar (1)
    let vertical_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(10),
            Constraint::Length(1),
        ])
        .split(area);

    let header_area = vertical_chunks[0];
    let body_area = vertical_chunks[1];
    let footer_area = vertical_chunks[2];

    // 2. Secondary horizontal division: Navigation Sidebar (25%), Content (75%)
    let horizontal_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(25),
            Constraint::Percentage(75),
        ])
        .split(body_area);

    let sidebar_area = horizontal_chunks[0];
    let content_area = horizontal_chunks[1];

    (header_area, sidebar_area, content_area, footer_area)
}
```

### Modal Dialog Geometry: Centered Popup Math

Always use dynamic percentage math and margin offsets to center popups across all terminal dimensions:

```rust
pub fn centered_rect(percent_x: u16, percent_y: u16, area: Rect) -> Rect {
    let popup_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(area);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(popup_layout[1])[1]
}
```

---

## 5. Styling, Color Palettes & Centralized Themes

### Hierarchical Text Composition

Ratatui builds styled text using a 3-layer structural hierarchy:

* **Span**: An atomic substring with a single uniform `Style`.
* **Line**: A horizontal vector of `Span` instances representing a single line.
* **Text**: A vertical collection of `Line` instances representing a paragraph or document.

```rust
let styled_header = Line::from(vec![
    Span::styled(" [SYSTEM] ", Style::default().bg(Color::Cyan).fg(Color::Black).bold()),
    Span::raw(" Engine status: "),
    Span::styled("ONLINE", Style::default().fg(Color::Green).bold()),
]);
```

### Centralized Theme Architecture

```rust
#[derive(Clone, Debug)]
pub struct TuiTheme {
    pub background: Color,
    pub border: Color,
    pub border_active: Color,
    pub text_primary: Color,
    pub text_secondary: Color,
    pub accent: Color,
    pub success: Color,
    pub warning: Color,
    pub error: Color,
}

impl Default for TuiTheme {
    fn default() -> Self {
        Self {
            background: Color::Rgb(15, 23, 42),     // Slate 900
            border: Color::Rgb(51, 65, 85),         // Slate 700
            border_active: Color::Rgb(34, 211, 238), // Cyan 400
            text_primary: Color::Rgb(248, 250, 252), // Slate 50
            text_secondary: Color::Rgb(148, 163, 184), // Slate 400
            accent: Color::Rgb(56, 189, 248),       // Sky 400
            success: Color::Rgb(74, 222, 128),      // Emerald 400
            warning: Color::Rgb(250, 204, 21),      // Amber 400
            error: Color::Rgb(248, 113, 113),       // Rose 400
        }
    }
}
```

---

## 6. Comprehensive Widget Catalog & Stateful Primitives

### Block & Borders

```rust
use ratatui::widgets::{Block, Borders, BorderType, Padding};

let block = Block::default()
    .title(" Active Modules ")
    .title_alignment(Alignment::Center)
    .borders(Borders::ALL)
    .border_type(BorderType::Rounded)
    .border_style(Style::default().fg(theme.border_active))
    .padding(Padding::horizontal(1));
```

### Paragraph with Wrapping & Scrolling

```rust
use ratatui::widgets::{Paragraph, Wrap};

let content = Paragraph::new(text_payload)
    .block(block)
    .style(Style::default().fg(theme.text_primary))
    .wrap(Wrap { trim: true })
    .scroll((scroll_offset_y, 0));
frame.render_widget(content, area);
```

### Interactive List with ListState

```rust
use ratatui::widgets::{List, ListItem, ListState};

let items = vec![
    ListItem::new("1. Cluster Orchestrator"),
    ListItem::new("2. Database Shard Manager"),
    ListItem::new("3. Ingress Route Controller"),
];

let list = List::new(items)
    .block(Block::bordered().title(" Services "))
    .highlight_style(Style::default().bg(Color::Rgb(30, 41, 59)).fg(Color::Cyan).bold())
    .highlight_symbol(" > ");

// Stateful rendering passes mutable reference to state
frame.render_stateful_widget(list, area, &mut list_state);
```

### Multi-Column Table with TableState

```rust
use ratatui::widgets::{Table, Row, Cell, TableState};

let headers = Row::new(vec!["ID", "Service", "Health", "Latency"])
    .style(Style::default().fg(Color::Cyan).bold())
    .bottom_margin(1);

let rows = vec![
    Row::new(vec!["01", "auth-service", "HEALTHY", "4ms"]),
    Row::new(vec!["02", "gateway-proxy", "HEALTHY", "12ms"]),
    Row::new(vec!["03", "cache-redis", "DEGRADED", "85ms"]),
];

let widths = [
    Constraint::Length(4),
    Constraint::Percentage(40),
    Constraint::Length(12),
    Constraint::Length(10),
];

let table = Table::new(rows, widths)
    .header(headers)
    .block(Block::bordered().title(" Microservice Matrix "))
    .highlight_style(Style::default().bg(Color::Rgb(30, 41, 59)).bold())
    .highlight_symbol(" -> ");

frame.render_stateful_widget(table, area, &mut table_state);
```

### Real-Time Gauges & Sparklines

```rust
use ratatui::widgets::{Gauge, LineGauge, Sparkline};

// Percentage gauge
let gauge = Gauge::default()
    .block(Block::bordered().title(" Memory Utilization "))
    .gauge_style(Style::default().fg(Color::Green).bg(Color::DarkGray))
    .percent(78);
frame.render_widget(gauge, gauge_area);

// Trend sparkline for historical telemetry
let sparkline_data: Vec<u64> = vec![12, 18, 25, 40, 32, 45, 60, 52, 70, 85, 92];
let sparkline = Sparkline::default()
    .block(Block::bordered().title(" QPS Trend "))
    .style(Style::default().fg(Color::Cyan))
    .data(&sparkline_data);
frame.render_widget(sparkline, sparkline_area);
```

### Modal Popups & The Clear Widget

When rendering modal overlays or dropdown menus, ALWAYS render `Clear` over the popup rectangle before rendering the modal widget to occlude underlying cells:

```rust
use ratatui::widgets::Clear;

if app.is_modal_open {
    let popup_area = centered_rect(60, 40, frame.area());
    // 1. Wipe background cells
    frame.render_widget(Clear, popup_area);

    // 2. Render modal content over wiped region
    let modal_block = Block::bordered()
        .title(" Confirmation ")
        .style(Style::default().bg(Color::Rgb(15, 23, 42)));
    let modal_text = Paragraph::new("Are you sure you want to deploy to production?")
        .block(modal_block)
        .alignment(Alignment::Center);
    frame.render_widget(modal_text, popup_area);
}
```

---

## 7. Interactive Input, Text Buffers & Hardware Cursor

### Modal Input State Machine

```rust
#[derive(Debug, PartialEq, Eq)]
pub enum InputMode {
    Normal,
    Editing,
    Search,
}

pub struct TextInput {
    pub buffer: String,
    pub cursor_position: usize,
}

impl TextInput {
    pub fn insert_char(&mut self, c: char) {
        self.buffer.insert(self.cursor_position, c);
        self.cursor_position += 1;
    }

    pub fn delete_backspace(&mut self) {
        if self.cursor_position > 0 {
            self.cursor_position -= 1;
            self.buffer.remove(self.cursor_position);
        }
    }
}
```

### Hardware Blinking Cursor Placement

To allow native terminal emulators to render the physical blinking cursor precisely over the active input field, set the cursor position on the `Frame`:

```rust
if app.input_mode == InputMode::Editing {
    // Calculate exact visual cell offset inside the input block border
    let cursor_x = input_area.x + app.text_input.cursor_position as u16 + 1;
    let cursor_y = input_area.y + 1;
    frame.set_cursor_position(Position::new(cursor_x, cursor_y));
}
```

---

## 8. Headless Unit Testing & Buffer Assertions

Ratatui features a zero-dependency `TestBackend` that simulates an in-memory terminal screen for deterministic headless testing in CI/CD environments.

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::backend::TestBackend;
    use ratatui::Terminal;

    #[test]
    fn test_status_bar_rendering() {
        let backend = TestBackend::new(40, 3);
        let mut terminal = Terminal::new(backend).unwrap();

        terminal.draw(|frame| {
            let area = frame.area();
            let p = Paragraph::new("Ready: Code Scaffold v7.23.0");
            frame.render_widget(p, area);
        }).unwrap();

        // Assert terminal buffer output cell contents
        let buffer = terminal.backend().buffer();
        let first_cell = buffer.cell(Position::new(0, 0)).unwrap();
        assert_eq!(first_cell.symbol(), "R");
    }
}
```

---

## 9. Performance Optimization & Production Invariants

* **Zero-Allocation Rendering**: Never execute heavy allocations, vector clones, or string formatting inside `ui()` / `draw()` closures. Keep rendering functions pure projections of application state.
* **Double-Buffered Diffing**: Ratatui compares the current buffer against the previous frame and only issues ANSI escape codes for mutated cells. Avoid calling `terminal.clear()` inside the primary event loop as it invalidates the diff cache and induces screen flicker.
* **Cross-Platform Key Release Filtering**: Always filter Crossterm key events using `if key.kind == KeyEventKind::Press` to ensure identical behavior between Windows consoles and POSIX terminals.
* **Terminal Teardown Invariance**: Ensure `disable_raw_mode()` and `LeaveAlternateScreen` are invoked even on early returns, `?` operator exits, and unexpected signal terminations.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
