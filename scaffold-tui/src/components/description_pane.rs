use crate::action::Action;
use crate::components::nav_tree::Category;
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

#[derive(PartialEq)]
enum GlyphType {
    Whitespace,
    Solid,
    Outline,
}

fn get_glyph_type(c: char) -> GlyphType {
    if c.is_whitespace() {
        GlyphType::Whitespace
    } else if c == '█' || c == '▄' || c == '▀' || c == '▌' || c == '▐' {
        GlyphType::Solid
    } else {
        GlyphType::Outline
    }
}

pub struct DescriptionPane {
    pub current_label: String,
    pub current_desc: String,
    pub current_version: String,
    pub current_logo: Option<Vec<String>>,
    pub current_category: Option<Category>,
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
            current_logo: None,
            current_category: None,
            qr_lines,
            show_qr: false,
        }
    }

    pub fn set_selected_label(
        &mut self,
        label: &str,
        desc: &str,
        version: &str,
        logo: Option<Vec<String>>,
        category: Option<Category>,
    ) {
        self.current_label = label.to_string();
        self.current_desc = desc.to_string();
        self.current_version = version.to_string();
        self.current_logo = logo;
        self.current_category = category;
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
        // desc_text is ONLY used by section 3 (static fallback docs).
        // When current_desc is already populated (shown in section 2),
        // leave desc_text empty so section 3 doesn't duplicate the content.
        let desc_text = if !self.current_desc.is_empty() {
            ""
        } else if self.current_label.is_empty() {
            item_description("")
        } else {
            item_description(&self.current_label)
        };

        let mut desc_lines: Vec<Line> = vec![];

        // 1. Logo as the TOPMOST item in the pane with 2-tone 3D color styling
        if let Some(logo) = &self.current_logo {
            for line in logo {
                // Purely-whitespace lines render as a blank separator to avoid
                // the "phantom band" artifact caused by the span splitter coloring
                // invisible space characters with a background tint.
                if line.trim().is_empty() {
                    desc_lines.push(Line::from(""));
                    continue;
                }

                let mut spans = Vec::new();
                let mut current_text = String::new();
                let mut current_glyph_type = GlyphType::Whitespace;

                for c in line.chars() {
                    let g_type = get_glyph_type(c);
                    if spans.is_empty() && current_text.is_empty() {
                        current_glyph_type = get_glyph_type(c);
                    }

                    if g_type == current_glyph_type {
                        current_text.push(c);
                    } else {
                        let style = match current_glyph_type {
                            GlyphType::Solid => Style::default()
                                .fg(theme.accent)
                                .add_modifier(Modifier::BOLD),
                            _ => Style::default().fg(theme.secondary),
                        };
                        spans.push(Span::styled(current_text, style));
                        current_text = String::from(c);
                        current_glyph_type = g_type;
                    }
                }

                if !current_text.is_empty() {
                    let style = match current_glyph_type {
                        GlyphType::Solid => Style::default()
                            .fg(theme.accent)
                            .add_modifier(Modifier::BOLD),
                        _ => Style::default().fg(theme.secondary),
                    };
                    spans.push(Span::styled(current_text, style));
                }

                desc_lines.push(Line::from(spans));
            }
            desc_lines.push(Line::from(""));
        }

        // 2. Standardized metadata underneath
        // Only show "Skill:" / "Version:" / "Desc:" prefixed labels for skill items.
        // For all other categories (personas, artifacts, licenses, etc.) render
        // the label and description without the skills-specific field prefixes.
        let is_skill_category = matches!(self.current_category, Some(Category::AgentSkills));

        if !self.current_label.is_empty() {
            let avail_width = (sections[0].width as usize).saturating_sub(13);
            let eff_width = if avail_width < 15 { 15 } else { avail_width };

            if is_skill_category {
                let label_wrapped = wrap_text(&self.current_label, eff_width);
                for (i, wrapped_line) in label_wrapped.into_iter().enumerate() {
                    if i == 0 {
                        desc_lines.push(Line::from(vec![
                            Span::styled(
                                "    Skill: ",
                                Style::default()
                                    .fg(theme.secondary)
                                    .add_modifier(Modifier::BOLD),
                            ),
                            Span::styled(
                                wrapped_line,
                                Style::default()
                                    .fg(theme.accent)
                                    .add_modifier(Modifier::BOLD),
                            ),
                        ]));
                    } else {
                        desc_lines.push(Line::from(vec![
                            Span::styled("           ", Style::default()),
                            Span::styled(
                                wrapped_line,
                                Style::default()
                                    .fg(theme.accent)
                                    .add_modifier(Modifier::BOLD),
                            ),
                        ]));
                    }
                }

                if !self.current_version.is_empty() {
                    let v_str = if self.current_version.starts_with('v') {
                        self.current_version.clone()
                    } else {
                        format!("v{}", self.current_version)
                    };
                    desc_lines.push(Line::from(vec![
                        Span::styled(
                            "  Version: ",
                            Style::default()
                                .fg(theme.secondary)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::styled(v_str, Style::default().fg(theme.secondary)),
                    ]));
                }

                if !self.current_desc.is_empty() {
                    let desc_wrapped = wrap_text(&self.current_desc, eff_width);
                    for (i, wrapped_line) in desc_wrapped.into_iter().enumerate() {
                        if i == 0 {
                            desc_lines.push(Line::from(vec![
                                Span::styled(
                                    "     Desc: ",
                                    Style::default()
                                        .fg(theme.secondary)
                                        .add_modifier(Modifier::BOLD),
                                ),
                                Span::styled(wrapped_line, Style::default().fg(theme.text)),
                            ]));
                        } else {
                            desc_lines.push(Line::from(vec![
                                Span::styled("           ", Style::default()),
                                Span::styled(wrapped_line, Style::default().fg(theme.text)),
                            ]));
                        }
                    }
                }
            } else {
                // Non-skill items: render label as a styled header, no prefix labels
                let label_wrapped = wrap_text(&self.current_label, eff_width);
                for wrapped_line in label_wrapped {
                    desc_lines.push(Line::from(Span::styled(
                        wrapped_line,
                        Style::default()
                            .fg(theme.accent)
                            .add_modifier(Modifier::BOLD),
                    )));
                }

                if !self.current_version.is_empty() {
                    let v_str = if self.current_version.starts_with('v') {
                        self.current_version.clone()
                    } else {
                        format!("v{}", self.current_version)
                    };
                    desc_lines.push(Line::from(Span::styled(
                        v_str,
                        Style::default().fg(theme.secondary),
                    )));
                }

                if !self.current_desc.is_empty() {
                    let desc_wrapped = wrap_text(&self.current_desc, eff_width);
                    for wrapped_line in desc_wrapped {
                        desc_lines.push(Line::from(Span::styled(
                            wrapped_line,
                            Style::default().fg(theme.text),
                        )));
                    }
                }
            }

            desc_lines.push(Line::from(""));
        }

        // 3. Additional documentation / Use Cases underneath
        if !desc_text.is_empty() {
            let avail_width = (sections[0].width as usize).saturating_sub(4);
            let eff_width = if avail_width < 15 { 15 } else { avail_width };

            for line in desc_text.lines() {
                if !self.current_desc.is_empty() && line.trim() == self.current_desc.trim() {
                    continue;
                }

                let trimmed = line.trim_start();
                let is_bullet = trimmed.starts_with('*') || trimmed.starts_with('-');
                let is_header = line.trim_end().ends_with(':');

                if is_header {
                    desc_lines.push(Line::from(Span::styled(
                        line.to_string(),
                        Style::default()
                            .fg(theme.primary)
                            .add_modifier(Modifier::BOLD),
                    )));
                } else if is_bullet {
                    let wrapped = wrap_text(line, eff_width);
                    for (i, w_line) in wrapped.into_iter().enumerate() {
                        if i == 0 {
                            desc_lines.push(Line::from(Span::styled(
                                w_line,
                                Style::default().fg(theme.text),
                            )));
                        } else {
                            desc_lines.push(Line::from(Span::styled(
                                format!("  {}", w_line),
                                Style::default().fg(theme.text),
                            )));
                        }
                    }
                } else {
                    let wrapped = wrap_text(line, eff_width);
                    for w_line in wrapped {
                        desc_lines.push(Line::from(Span::styled(
                            w_line,
                            Style::default().fg(theme.text),
                        )));
                    }
                }
            }
        }

        let desc_para = Paragraph::new(desc_lines).style(Style::default().bg(theme.bg));
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

fn wrap_text(text: &str, max_width: usize) -> Vec<String> {
    if max_width == 0 {
        return vec![text.to_string()];
    }
    let mut lines = Vec::new();
    for paragraph in text.lines() {
        let words: Vec<&str> = paragraph.split_whitespace().collect();
        if words.is_empty() {
            lines.push(String::new());
            continue;
        }
        let mut current_line = String::new();
        for word in words {
            if current_line.is_empty() {
                current_line.push_str(word);
            } else if current_line.chars().count() + 1 + word.chars().count() <= max_width {
                current_line.push(' ');
                current_line.push_str(word);
            } else {
                lines.push(current_line);
                current_line = word.to_string();
            }
        }
        if !current_line.is_empty() {
            lines.push(current_line);
        }
    }
    lines
}
