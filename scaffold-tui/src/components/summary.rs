use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct SummaryPane {
    pub title: String,
    pub summary_text: String,
}

impl SummaryPane {
    pub fn new() -> Self {
        Self {
            title: " Deployment Summary ".to_string(),
            summary_text: "Initializing...".to_string(),
        }
    }
}

impl Component for SummaryPane {
    fn update(&mut self, _action: Action) -> Result<Option<Action>> {
        Ok(None)
    }

    fn draw(
        &mut self,
        f: &mut ratatui::Frame<'_>,
        area: Rect,
        active: bool,
        theme: &Theme,
    ) -> Result<()> {
        let border_color = if active {
            theme.primary
        } else {
            theme.secondary
        };
        let border_style = Style::default().fg(border_color).bg(theme.bg);

        let text = Paragraph::new(self.summary_text.as_str())
            .style(Style::default().fg(theme.text).bg(theme.bg))
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(self.title.as_str())
                    .border_style(border_style)
                    .style(Style::default().bg(theme.bg)),
            );

        f.render_widget(text, area);
        Ok(())
    }
}
