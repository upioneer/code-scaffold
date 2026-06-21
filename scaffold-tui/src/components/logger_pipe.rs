use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};
use std::sync::mpsc::{Receiver, TryRecvError};

pub struct LoggerPipe {
    pub logs: Vec<String>,
    pub rx: Receiver<String>,
    pub state: ListState,
}

impl LoggerPipe {
    pub fn new(rx: Receiver<String>) -> Self {
        Self {
            logs: Vec::new(),
            rx,
            state: ListState::default(),
        }
    }

    pub fn poll_logs(&mut self) {
        loop {
            match self.rx.try_recv() {
                Ok(msg) => {
                    self.logs.push(msg);
                    let len = self.logs.len();
                    if len > 0 {
                        self.state.select(Some(len - 1));
                    }
                }
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => break,
            }
        }
    }
}

impl Component for LoggerPipe {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let count = self.logs.len();
        if count == 0 {
            return Ok(None);
        }

        let mut i = self.state.selected().unwrap_or(0);
        match action {
            Action::Down => {
                i = (i + 1).min(count.saturating_sub(1));
                self.state.select(Some(i));
            }
            Action::Up => {
                i = i.saturating_sub(1);
                self.state.select(Some(i));
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(
        &mut self,
        f: &mut ratatui::Frame<'_>,
        area: Rect,
        active: bool,
        theme: &Theme,
    ) -> Result<()> {
        self.poll_logs();

        let border_color = if active {
            theme.primary
        } else {
            theme.secondary
        };
        let border_style = Style::default().fg(border_color).bg(theme.bg);

        let items: Vec<ListItem> = self
            .logs
            .iter()
            .map(|msg| {
                let color = if msg.contains("ERROR") {
                    ratatui::style::Color::Red
                } else if msg.contains("Created")
                    || msg.contains("Initialized")
                    || msg.contains("Success")
                {
                    theme.accent
                } else {
                    theme.text
                };
                ListItem::new(msg.clone()).style(Style::default().fg(color).bg(theme.bg))
            })
            .collect();

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Logger Pipe ")
                    .border_style(border_style)
                    .style(Style::default().bg(theme.bg)),
            )
            .highlight_style(Style::default().bg(theme.primary).fg(theme.bg));

        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
