use crate::components::Component;
use anyhow::Result;
use ratatui::Frame;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct NavTree {}

impl NavTree {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for NavTree {
    fn draw(&mut self, f: &mut Frame, area: Rect) -> Result<()> {
        let text = Paragraph::new("NavTree: Structural project file tree node explorer")
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(text, area);
        Ok(())
    }
}
