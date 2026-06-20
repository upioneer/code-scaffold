use crate::components::Component;
use crate::action::Action;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};
use ratatui::style::Style;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Category {
    Artifacts,
    AgentSkills,
    License,
}

pub struct NavTree {
    pub categories: Vec<(Category, String)>,
    pub state: ListState,
}

impl NavTree {
    pub fn new() -> Self {
        let mut state = ListState::default();
        state.select(Some(0));
        Self { 
            categories: vec![
                (Category::Artifacts, "Artifacts".to_string()),
                (Category::AgentSkills, "Agent Skills".to_string()),
                (Category::License, "License".to_string()),
            ],
            state 
        }
    }

    pub fn selected_category(&self) -> Category {
        let i = self.state.selected().unwrap_or(0);
        self.categories[i].0.clone()
    }
}

impl Component for NavTree {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let mut i = self.state.selected().unwrap_or(0);
        match action {
            Action::Down => {
                i = (i + 1).min(self.categories.len().saturating_sub(1));
                self.state.select(Some(i));
            }
            Action::Up => {
                i = i.saturating_sub(1);
                self.state.select(Some(i));
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool, theme: &Theme) -> Result<()> {
        let border_color = if active { theme.primary } else { theme.secondary };
        let border_style = Style::default().fg(border_color).bg(theme.bg);
        
        let items: Vec<ListItem> = self.categories.iter()
            .map(|(_, name)| {
                ListItem::new(format!("  {}", name)).style(Style::default().fg(theme.text).bg(theme.bg))
            })
            .collect();

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Categories ").border_style(border_style).style(Style::default().bg(theme.bg)))
            .highlight_style(Style::default().bg(theme.primary).fg(theme.bg))
            .highlight_symbol(">>");

        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
