use crate::components::Component;
use crate::action::Action;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::style::Style;

pub struct Header {}

impl Header {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for Header {
    fn update(&mut self, _action: Action) -> Result<Option<Action>> {
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, _active: bool, theme: &Theme) -> Result<()> {
        let text = Paragraph::new(" Stateless Scaffolding TUI v3.9.0 ")
            .style(Style::default().fg(theme.text).bg(theme.bg))
            .alignment(ratatui::layout::Alignment::Center)
            .block(Block::default().borders(Borders::ALL).border_style(Style::default().fg(theme.secondary).bg(theme.bg)).style(Style::default().bg(theme.bg)));
        f.render_widget(text, area);
        Ok(())
    }
}
