use crate::components::Component;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

pub struct Footer {}

impl Footer {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for Footer {
    fn draw(&mut self, f: &mut Frame, area: Rect) -> Result<()> {
        let text = Paragraph::new("Footer: Contextual interface keybindings toolbar")
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(text, area);
        Ok(())
    }
}
