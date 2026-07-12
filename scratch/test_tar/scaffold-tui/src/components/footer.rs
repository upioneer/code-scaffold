use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct Footer {}

impl Footer {
    pub fn new() -> Self {
        Self {}
    }
}

impl Component for Footer {
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
        let text_content = format!(
            " [Tab] Focus | [Up/Down] Navigate | [T] Theme ({}) | [Esc] Quit ",
            theme.name
        );
        let text = Paragraph::new(text_content)
            .style(Style::default().fg(theme.primary).bg(theme.bg))
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
