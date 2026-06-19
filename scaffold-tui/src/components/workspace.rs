use crate::components::Component;
use anyhow::Result;
use ratatui::Frame;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct Workspace {}

impl Workspace {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for Workspace {
    fn draw(&mut self, f: &mut Frame, area: Rect) -> Result<()> {
        let text = Paragraph::new("Workspace: Dynamic input field configuration manager")
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(text, area);
        Ok(())
    }
}
