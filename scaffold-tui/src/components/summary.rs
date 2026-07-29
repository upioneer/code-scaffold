use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout, Rect};
use ratatui::style::Style;
use ratatui::text::Span;
use ratatui::widgets::{Block, Borders, Paragraph};

pub struct SummaryPane {
    pub title: String,
    pub summary_text: String,
    /// Index into [accent, primary, secondary] — advances once per full braille animation cycle.
    pub braille_color_idx: usize,
}

impl SummaryPane {
    pub fn new() -> Self {
        Self {
            title: " Deployment Summary ".to_string(),
            summary_text: "Initializing...".to_string(),
            braille_color_idx: 0,
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

        // The single color for ALL braille chars this frame — cycles per animation loop.
        let braille_color = match self.braille_color_idx % 3 {
            0 => theme.accent,
            1 => theme.primary,
            _ => theme.secondary,
        };

        // ── Outer block ──────────────────────────────────────────────────────
        let outer = Block::default()
            .borders(Borders::ALL)
            .title(self.title.as_str())
            .border_style(border_style)
            .style(Style::default().bg(theme.bg));
        let inner = outer.inner(area);
        f.render_widget(outer, area);

        let cols = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Min(0)])
            .split(inner);

        // ── Text column ──────────────────────────────────────────────────────
        let mut lines = Vec::new();
        for line_str in self.summary_text.lines() {
            let mut spans = Vec::new();
            let mut remaining = line_str;

            while let Some(start_idx) = remaining.find('[') {
                if let Some(end_idx) = remaining[start_idx..].find(']') {
                    let full_end = start_idx + end_idx + 1;

                    if start_idx > 0 {
                        push_text_spans(
                            &remaining[..start_idx],
                            Style::default().fg(theme.text),
                            braille_color,
                            &mut spans,
                        );
                    }

                    spans.push(Span::styled(
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
                push_text_spans(
                    remaining,
                    Style::default().fg(theme.text),
                    braille_color,
                    &mut spans,
                );
            }

            lines.push(ratatui::text::Line::from(spans));
        }

        let text_para = Paragraph::new(lines).style(Style::default().bg(theme.bg));
        f.render_widget(text_para, cols[0]);

        Ok(())
    }
}

/// `braille_color` is the single pre-chosen color for ALL braille chars this frame —
/// it is derived from `braille_color_idx` in `SummaryPane::draw` and changes only once
/// per complete animation cycle, not per individual character.
fn push_text_spans<'a>(
    text: &'a str,
    base_style: Style,
    braille_color: ratatui::style::Color,
    spans: &mut Vec<Span<'a>>,
) {
    let mut current = String::new();
    let mut is_braille = false;

    for c in text.chars() {
        let char_is_braille = c >= '\u{2800}' && c <= '\u{28FF}';
        if current.is_empty() {
            is_braille = char_is_braille;
        }

        if char_is_braille == is_braille {
            current.push(c);
        } else {
            if !current.is_empty() {
                if is_braille {
                    spans.push(Span::styled(
                        current,
                        Style::default()
                            .fg(braille_color)
                            .add_modifier(ratatui::style::Modifier::BOLD),
                    ));
                } else {
                    spans.push(Span::styled(current, base_style));
                }
            }
            current = String::from(c);
            is_braille = char_is_braille;
        }
    }

    if !current.is_empty() {
        if is_braille {
            spans.push(Span::styled(
                current,
                Style::default()
                    .fg(braille_color)
                    .add_modifier(ratatui::style::Modifier::BOLD),
            ));
        } else {
            spans.push(Span::styled(current, base_style));
        }
    }
}
