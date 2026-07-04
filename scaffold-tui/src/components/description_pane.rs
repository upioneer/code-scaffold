use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use qrcode::render::unicode;
use qrcode::QrCode;
use ratatui::prelude::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph, Wrap};

const SITE_URL: &str = "https://code-scaffold.web.app";

/// A static description table mapping item labels to human-readable descriptions.
fn item_description(label: &str) -> &'static str {
    match label {
        "Deploy Base Artifacts" =>
            "Copies core project scaffolding files (AGENT.md, DESIGN.md, PLAN.md, etc.) into the target workspace. These artifacts serve as the foundational context layer for agent-driven development.",
        "Deploy Core Agent Skills" =>
            "Installs reusable agent skill modules (.skills/) into the target project. Skills extend AI agent capabilities with domain-specific workflows such as GitHub, Firebase, Playwright, and more.",
        "Include Open Source License" =>
            "Writes the selected open-source license file (LICENSE.md) to the project root. Ensures intellectual property terms are clearly documented for contributors and users.",
        _ =>
            "Select an item in the Deployment Config pane to see its description here.",
    }
}

/// Render a QR code for the given URL as lines using unicode half-block chars.
fn render_qr_lines(url: &str) -> Vec<String> {
    let code = match QrCode::new(url.as_bytes()) {
        Ok(c) => c,
        Err(_) => return vec!["[QR Error]".to_string()],
    };

    // Render to a unicode string using the built-in Dense1x2 renderer
    let rendered = code
        .render::<unicode::Dense1x2>()
        .dark_color(unicode::Dense1x2::Dark)
        .light_color(unicode::Dense1x2::Light)
        .build();

    rendered.lines().map(|l| l.to_string()).collect()
}

pub struct DescriptionPane {
    pub current_label: String,
    pub current_desc: String,
    pub current_version: String,
    qr_lines: Vec<String>,
    pub show_qr: bool,
}

impl DescriptionPane {
    pub fn new() -> Self {
        let qr_lines = render_qr_lines(SITE_URL);
        Self {
            current_label: String::new(),
            current_desc: String::new(),
            current_version: String::new(),
            qr_lines,
            show_qr: false,
        }
    }

    pub fn set_selected_label(&mut self, label: &str, desc: &str, version: &str) {
        self.current_label = label.to_string();
        self.current_desc = desc.to_string();
        self.current_version = version.to_string();
    }
}

impl Component for DescriptionPane {
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
        let border_style = Style::default().fg(theme.secondary).bg(theme.bg);

        let outer = Block::default()
            .borders(Borders::ALL)
            .title(" Info & Guide ")
            .border_style(border_style)
            .style(Style::default().bg(theme.bg));

        let inner = outer.inner(area);
        f.render_widget(outer, area);

        // Split inner area: description on top, QR label + QR below
        let qr_height = if self.show_qr {
            (self.qr_lines.len() as u16).min(inner.height.saturating_sub(2)) // Leave room for top padding or label
        } else {
            0
        };
        let desc_height = if self.show_qr { 0 } else { inner.height };

        let sections = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(desc_height), // Description text
                Constraint::Length(1),           // Separator / QR label
                Constraint::Length(qr_height),   // QR code
                Constraint::Min(0),
            ])
            .split(inner);

        // ── Description ──────────────────────────────────────────────
        let desc_text = if !self.current_desc.is_empty() {
            self.current_desc.as_str()
        } else if self.current_label.is_empty() {
            item_description("")
        } else {
            item_description(&self.current_label)
        };

        let title_line = if !self.current_label.is_empty() {
            if !self.current_version.is_empty() {
                Line::from(vec![
                    Span::styled(
                        format!("▸ {} ", self.current_label),
                        Style::default()
                            .fg(theme.accent)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::styled(
                        format!("v{}", self.current_version),
                        Style::default().fg(theme.secondary),
                    ),
                ])
            } else {
                Line::from(vec![Span::styled(
                    format!("▸ {}", self.current_label),
                    Style::default()
                        .fg(theme.accent)
                        .add_modifier(Modifier::BOLD),
                )])
            }
        } else {
            Line::from(Span::styled(
                "▸ Deployment Config",
                Style::default().fg(theme.secondary),
            ))
        };

        let mut desc_lines: Vec<Line> = vec![title_line, Line::from("")];
        // Preserve explicit newlines, let ratatui handle word-wrapping natively
        for line in desc_text.lines() {
            desc_lines.push(Line::from(Span::styled(
                line.to_string(),
                Style::default().fg(theme.text),
            )));
        }

        let desc_para = Paragraph::new(desc_lines)
            .wrap(Wrap { trim: true })
            .style(Style::default().bg(theme.bg));
        f.render_widget(desc_para, sections[0]);

        // ── QR label ─────────────────────────────────────────────────
        if self.show_qr {
            let qr_label = Paragraph::new(Line::from(vec![Span::styled(
                " View Online Guide ",
                Style::default()
                    .fg(theme.bg)
                    .bg(theme.secondary)
                    .add_modifier(ratatui::style::Modifier::BOLD),
            )]))
            .alignment(ratatui::layout::Alignment::Center);
            f.render_widget(qr_label, sections[1]);

            // ── QR Code ──────────────────────────────────────────────────
            let qr_text: Vec<Line> = self
                .qr_lines
                .iter()
                .take(qr_height as usize)
                .map(|l| {
                    Line::from(Span::styled(
                        l,
                        Style::default().fg(theme.text).bg(theme.bg),
                    ))
                })
                .collect();

            let qr_para = Paragraph::new(qr_text).style(Style::default().bg(theme.bg));
            f.render_widget(qr_para, sections[2]);
        }

        Ok(())
    }
}
