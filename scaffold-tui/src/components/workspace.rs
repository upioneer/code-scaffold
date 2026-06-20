use crate::components::Component;
use crate::models::manifest::Manifest;
use crate::action::Action;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, List, ListItem};
use ratatui::style::Style;
use std::fs;

pub struct Workspace {
    pub manifest: Option<Manifest>,
    pub options: Vec<(String, bool)>,
    pub selected: usize,
}

impl Workspace {
    pub fn new() -> Self {
        let manifest_content = fs::read_to_string("../manifest.json").unwrap_or_default();
        let manifest: Option<Manifest> = serde_json::from_str(&manifest_content).ok();
        
        Self { 
            manifest,
            options: vec![
                ("Deploy Base Artifacts".to_string(), true),
                ("Deploy Core Agent Skills".to_string(), true),
                ("Include Open Source License".to_string(), true),
            ],
            selected: 0,
        }
    }
}

impl Component for Workspace {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        match action {
            Action::Up => {
                self.selected = self.selected.saturating_sub(1);
            }
            Action::Down => {
                self.selected = (self.selected + 1).min(self.options.len().saturating_sub(1));
            }
            Action::Enter | Action::Char(' ') => {
                if let Some(opt) = self.options.get_mut(self.selected) {
                    opt.1 = !opt.1;
                }
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool, theme: &Theme) -> Result<()> {
        let border_color = if active { theme.primary } else { theme.secondary };
        let border_style = Style::default().fg(border_color).bg(theme.bg);
        
        let mut items = Vec::new();
        for (i, (key, val)) in self.options.iter().enumerate() {
            let prefix = if active && i == self.selected { ">>" } else { "  " };
            let checkbox = if *val { "[X]" } else { "[ ]" };
            let display = format!("{} {} {}", prefix, checkbox, key);
            
            let style = if active && i == self.selected {
                Style::default().bg(theme.primary).fg(theme.bg)
            } else {
                Style::default().fg(theme.text).bg(theme.bg)
            };
            
            items.push(ListItem::new(display).style(style));
        }

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Deployment Configuration ").border_style(border_style).style(Style::default().bg(theme.bg)));
            
        f.render_widget(list, area);
        Ok(())
    }
}
