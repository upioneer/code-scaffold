use crate::components::Component;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

pub struct LoggerPipe {}

impl LoggerPipe {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for LoggerPipe {
    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect) -> Result<()> {
        let text = Paragraph::new("LoggerPipe: Status reports and diagnostic terminal monitor")
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(text, area);
        Ok(())
    }
}
