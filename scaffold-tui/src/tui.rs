use crate::action::Action;
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use crossterm::{
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::prelude::CrosstermBackend;
use ratatui::Terminal;
use std::io::{stdout, Stdout};

pub struct Tui {
    pub terminal: Terminal<CrosstermBackend<Stdout>>,
}

impl Tui {
    pub fn new() -> anyhow::Result<Self> {
        let terminal = Terminal::new(CrosstermBackend::new(stdout()))?;
        Ok(Self { terminal })
    }

    pub fn enter(&mut self) -> anyhow::Result<()> {
        enable_raw_mode()?;
        stdout().execute(EnterAlternateScreen)?;
        Ok(())
    }

    pub fn exit(&mut self) -> anyhow::Result<()> {
        disable_raw_mode()?;
        stdout().execute(LeaveAlternateScreen)?;
        self.terminal.show_cursor()?;
        Ok(())
    }
}

pub fn map_key_to_action(key: KeyEvent) -> Action {
    if key.modifiers.contains(KeyModifiers::CONTROL) {
        match key.code {
            KeyCode::Char('d') => return Action::Execute,
            KeyCode::Char('c') | KeyCode::Char('q') => return Action::Quit,
            _ => {}
        }
    }
    match key.code {
        KeyCode::Esc => Action::Quit,
        KeyCode::Up => Action::Up,
        KeyCode::Down => Action::Down,
        KeyCode::Left => Action::Left,
        KeyCode::Right => Action::Right,
        KeyCode::Enter => Action::Enter,
        KeyCode::BackTab => Action::ShiftTab,
        KeyCode::Tab => Action::Tab,
        KeyCode::Backspace => Action::Backspace,
        KeyCode::Char(c) => Action::Char(c),
        _ => Action::Tick,
    }
}

pub fn handle_terminal_events() -> anyhow::Result<Option<Action>> {
    if event::poll(std::time::Duration::from_millis(16))? {
        match event::read()? {
            Event::Key(key) => {
                if key.kind == KeyEventKind::Press {
                    return Ok(Some(map_key_to_action(key)));
                }
            }
            Event::Mouse(mouse_event) => match mouse_event.kind {
                event::MouseEventKind::ScrollUp => return Ok(Some(Action::Up)),
                event::MouseEventKind::ScrollDown => return Ok(Some(Action::Down)),
                _ => {}
            },
            _ => {}
        }
        Ok(None)
    } else {
        Ok(Some(Action::Tick))
    }
}
