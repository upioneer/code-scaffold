use crate::components::Component;
use crate::models::manifest::Manifest;
use crate::action::Action;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::style::{Color, Style};
use std::fs;

pub struct Workspace {
    pub manifest: Option<Manifest>,
}

impl Workspace {
    pub fn new() -> Self {
        // Find manifest.json in parent directory since scaffold-tui is nested
        let manifest_content = fs::read_to_string("../manifest.json").unwrap_or_default();
        let manifest: Option<Manifest> = serde_json::from_str(&manifest_content).ok();
        Self { manifest }
    }
}

impl Component for Workspace {
    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool) -> Result<()> {
        let border_style = if active { Style::default().fg(Color::Yellow) } else { Style::default() };
        
        let display_text = if let Some(m) = &self.manifest {
            format!("Manifest Successfully Loaded!\n\nVersion: {}\nEnvironment Variables: {}\nApps: {}\nArtifacts: {}\nSkills: {}", 
                m.metadata.version, m.env.len(), m.apps.len(), m.artifacts.len(), m.skills.len())
        } else {
            "Failed to load ../manifest.json".to_string()
        };

        let text = Paragraph::new(display_text)
            .block(Block::default().borders(Borders::ALL).title(" Workspace Configuration ").border_style(border_style));
        f.render_widget(text, area);
        Ok(())
    }
}
