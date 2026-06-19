use crate::components::Component;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::style::{Color, Style};

pub struct LoggerPipe {}

impl LoggerPipe {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for LoggerPipe {
    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool) -> Result<()> {
        let border_style = if active { Style::default().fg(Color::Yellow) } else { Style::default() };
        let text = Paragraph::new("LoggerPipe: Status reports and diagnostic terminal monitor")
            .block(Block::default().borders(Borders::ALL).border_style(border_style));
        f.render_widget(text, area);
        Ok(())
    }
}
