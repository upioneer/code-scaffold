use crate::components::Component;
use crate::components::nav_tree::Category;
use crate::action::Action;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, List, ListItem};
use ratatui::style::Style;

pub struct WorkspaceItem {
    pub label: String,
    pub selected: bool,
    pub category: Category,
}

pub struct Workspace {
    pub items: Vec<WorkspaceItem>,
    pub selected_idx: usize,
    pub current_category: Category,
}

impl Workspace {
    pub fn new() -> Self {
        Self { 
            items: vec![
                WorkspaceItem { label: "readme.md".to_string(), selected: true, category: Category::Artifacts },
                WorkspaceItem { label: "vercel.json".to_string(), selected: true, category: Category::Artifacts },
                WorkspaceItem { label: "deploy.yml".to_string(), selected: true, category: Category::Artifacts },
                WorkspaceItem { label: "env.example".to_string(), selected: true, category: Category::Artifacts },
                WorkspaceItem { label: "middleware.ts".to_string(), selected: false, category: Category::Artifacts },
                WorkspaceItem { label: "layout.tsx".to_string(), selected: false, category: Category::Artifacts },
                WorkspaceItem { label: "redis.ts".to_string(), selected: false, category: Category::Artifacts },
                WorkspaceItem { label: "ratelimit.ts".to_string(), selected: false, category: Category::Artifacts },
                
                WorkspaceItem { label: "Web Dev".to_string(), selected: false, category: Category::AgentSkills },
                WorkspaceItem { label: "Docker / DevOps".to_string(), selected: false, category: Category::AgentSkills },
                WorkspaceItem { label: "Mobile (iOS/And)".to_string(), selected: false, category: Category::AgentSkills },
                WorkspaceItem { label: "DBA".to_string(), selected: false, category: Category::AgentSkills },
                WorkspaceItem { label: "Systems Scripting".to_string(), selected: false, category: Category::AgentSkills },
                
                WorkspaceItem { label: "MIT License".to_string(), selected: true, category: Category::License },
                WorkspaceItem { label: "Apache 2.0".to_string(), selected: false, category: Category::License },
                WorkspaceItem { label: "GPL v3".to_string(), selected: false, category: Category::License },
            ],
            selected_idx: 0,
            current_category: Category::Artifacts,
        }
    }

    pub fn set_category(&mut self, cat: Category) {
        if self.current_category != cat {
            self.current_category = cat;
            self.selected_idx = 0;
        }
    }

    fn visible_indices(&self) -> Vec<usize> {
        self.items.iter().enumerate()
            .filter(|(_, item)| item.category == self.current_category)
            .map(|(i, _)| i)
            .collect()
    }
}

impl Component for Workspace {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let visible = self.visible_indices();
        if visible.is_empty() { return Ok(None); }

        match action {
            Action::Up => {
                self.selected_idx = self.selected_idx.saturating_sub(1);
            }
            Action::Down => {
                self.selected_idx = (self.selected_idx + 1).min(visible.len().saturating_sub(1));
            }
            Action::Enter | Action::Char(' ') => {
                let actual_idx = visible[self.selected_idx];
                self.items[actual_idx].selected = !self.items[actual_idx].selected;
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool, theme: &Theme) -> Result<()> {
        let border_color = if active { theme.primary } else { theme.secondary };
        let border_style = Style::default().fg(border_color).bg(theme.bg);
        
        let visible = self.visible_indices();
        let mut list_items = Vec::new();
        
        for (i, actual_idx) in visible.iter().enumerate() {
            let item = &self.items[*actual_idx];
            let prefix = if active && i == self.selected_idx { ">>" } else { "  " };
            let checkbox = if item.selected { "[X]" } else { "[ ]" };
            let display = format!("{} {} {}", prefix, checkbox, item.label);
            
            let style = if active && i == self.selected_idx {
                Style::default().bg(theme.primary).fg(theme.bg)
            } else {
                Style::default().fg(theme.text).bg(theme.bg)
            };
            
            list_items.push(ListItem::new(display).style(style));
        }

        let list = List::new(list_items)
            .block(Block::default().borders(Borders::ALL).title(" Deployment Configuration ").border_style(border_style).style(Style::default().bg(theme.bg)));
            
        f.render_widget(list, area);
        Ok(())
    }
}
