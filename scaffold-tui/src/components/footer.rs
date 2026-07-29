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

        let mut spans = Vec::new();
        let mut remaining = text_content.as_str();

        while let Some(start_idx) = remaining.find('[') {
            if let Some(end_idx) = remaining[start_idx..].find(']') {
                let full_end = start_idx + end_idx + 1;

                if start_idx > 0 {
                    spans.push(ratatui::text::Span::styled(
                        remaining[..start_idx].to_string(),
                        Style::default().fg(theme.primary),
                    ));
                }

                spans.push(ratatui::text::Span::styled(
                    remaining[start_idx..full_end].to_string(),
                    Style::default()
                        .fg(theme.accent)
                        .add_modifier(ratatui::style::Modifier::BOLD),
                ));

                remaining = &remaining[full_end..];
            } else {
                break;
            }
        }

        if !remaining.is_empty() {
            spans.push(ratatui::text::Span::styled(
                remaining.to_string(),
                Style::default().fg(theme.primary),
            ));
        }

        let text = Paragraph::new(ratatui::text::Line::from(spans))
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
