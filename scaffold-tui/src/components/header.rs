use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, Paragraph};
use serde_json::Value;

pub struct Header {
    pub version: String,
    pub update_available: Option<String>,
    pub agent_connected: Option<String>,
}

impl Header {
    pub fn new() -> Self {
        Self {
            version: format!(
                "v{}",
                option_env!("GIT_VERSION").unwrap_or(env!("CARGO_PKG_VERSION"))
            ),
            update_available: None,
            agent_connected: None,
        }
    }
}

impl Component for Header {
    fn update(&mut self, _action: Action) -> Result<Option<Action>> {
        Ok(None)
    }

    fn draw(
        &mut self,
        f: &mut ratatui::Frame<'_>,
        area: Rect,
        _active: bool,
        theme: &Theme,
    ) -> Result<()> {
        let mut banner = format!(" Code Scaffold TUI {} ", self.version);
        if let Some(agent) = &self.agent_connected {
            banner.push_str(&format!(" [🤖 Agent Connected: {} - Press C] ", agent));
        }
        if let Some(update) = &self.update_available {
            banner.push_str(&format!(" [Update Available: v{} - Press U] ", update));
        }
        let title = banner;
        let text = Paragraph::new(title)
            .style(Style::default().fg(theme.text).bg(theme.bg))
            .alignment(ratatui::layout::Alignment::Center)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_style(Style::default().fg(theme.secondary).bg(theme.bg))
                    .style(Style::default().bg(theme.bg)),
            );
        f.render_widget(text, area);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_header_version() {
        let h = Header::new();
        println!("Resolved Version: {}", h.version);
        assert_ne!(h.version, "vUnknown", "Failed to parse version!");
    }
}
