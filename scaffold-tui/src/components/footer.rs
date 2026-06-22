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
        let text = Paragraph::new(" [Tab] Focus | [Up/Down] Navigate | [T] Theme | [Esc] Quit ")
            .style(Style::default().fg(theme.secondary).bg(theme.bg))
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
