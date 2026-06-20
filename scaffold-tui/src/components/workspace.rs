use crate::components::Component;
use crate::models::manifest::Manifest;
use crate::action::Action;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, List, ListItem};
use ratatui::style::{Color, Style};
use std::fs;

pub struct Workspace {
    pub manifest: Option<Manifest>,
    pub env_fields: Vec<(String, String)>,
    pub selected_field: usize,
}

impl Workspace {
    pub fn new() -> Self {
        let manifest_content = fs::read_to_string("../manifest.json").unwrap_or_default();
        let manifest: Option<Manifest> = serde_json::from_str(&manifest_content).ok();
        
        let mut env_fields = Vec::new();
        if let Some(m) = &manifest {
            for (k, v) in &m.env {
                env_fields.push((k.clone(), v.clone()));
            }
            env_fields.sort_by(|a, b| a.0.cmp(&b.0));
        }

        Self { 
            manifest,
            env_fields,
            selected_field: 0,
        }
    }
}

impl Component for Workspace {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        if self.env_fields.is_empty() { return Ok(None); }

        match action {
            Action::Up => {
                self.selected_field = self.selected_field.saturating_sub(1);
            }
            Action::Down => {
                self.selected_field = (self.selected_field + 1).min(self.env_fields.len().saturating_sub(1));
            }
            Action::Char(c) => {
                if let Some(field) = self.env_fields.get_mut(self.selected_field) {
                    field.1.push(c);
                }
            }
            Action::Backspace => {
                if let Some(field) = self.env_fields.get_mut(self.selected_field) {
                    field.1.pop();
                }
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool) -> Result<()> {
        let border_style = if active { Style::default().fg(Color::Yellow) } else { Style::default() };
        
        let mut items = Vec::new();
        for (i, (key, val)) in self.env_fields.iter().enumerate() {
            let prefix = if active && i == self.selected_field { ">>" } else { "  " };
            let display = format!("{} {}: {}", prefix, key, val);
            
            let style = if active && i == self.selected_field {
                Style::default().bg(Color::DarkGray).fg(Color::White)
            } else {
                Style::default()
            };
            
            items.push(ListItem::new(display).style(style));
        }

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Workspace Environment Config ").border_style(border_style));
            
        f.render_widget(list, area);
        Ok(())
    }
}
