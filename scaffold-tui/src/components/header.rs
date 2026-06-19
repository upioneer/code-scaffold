use crate::components::Component;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct Header {}

impl Header {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for Header {
    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, _active: bool) -> Result<()> {
        let text = Paragraph::new("Header: Active directory and manifest state")
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(text, area);
        Ok(())
    }
}
