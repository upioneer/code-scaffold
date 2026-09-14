use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};

use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Category {
    DeploymentTarget,
    Artifacts,
    AgentPersona,
    ContributingTemplate,
    AgentSkills,
    License,
    Deploy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepStatus {
    Pending,
    Completed,
    NotApplicable,
}

pub struct NavTree {
    pub categories: Vec<(Category, String)>,
    pub step_statuses: HashMap<Category, StepStatus>,
    pub state: ListState,
    pub selected_idx: usize,
}

impl NavTree {
    pub fn new() -> Self {
        let mut state = ListState::default();
        state.select(Some(0));

        let mut step_statuses = HashMap::new();
        step_statuses.insert(Category::DeploymentTarget, StepStatus::Pending);
        step_statuses.insert(Category::Artifacts, StepStatus::Pending);
        step_statuses.insert(Category::AgentPersona, StepStatus::Pending);
        step_statuses.insert(Category::ContributingTemplate, StepStatus::NotApplicable);
        step_statuses.insert(Category::AgentSkills, StepStatus::Pending);
        step_statuses.insert(Category::License, StepStatus::Pending);
        step_statuses.insert(Category::Deploy, StepStatus::Pending);

        Self {
            categories: vec![
                (Category::DeploymentTarget, "Deployment Target".to_string()),
                (Category::Artifacts, "Artifacts".to_string()),
                (Category::AgentPersona, "Agent Persona".to_string()),
                (
                    Category::ContributingTemplate,
                    "Contributing Template".to_string(),
                ),
                (Category::AgentSkills, "Agent Skills".to_string()),
                (Category::License, "License".to_string()),
                (Category::Deploy, "Deploy".to_string()),
            ],
            step_statuses,
            state,
            selected_idx: 0,
        }
    }

    pub fn selected_category(&self) -> Category {
        self.categories[self.selected_idx].0.clone()
    }

    pub fn set_selected(&mut self, cat: Category) {
        if let Some(idx) = self.categories.iter().position(|c| c.0 == cat) {
            self.selected_idx = idx;
            self.state.select(Some(idx));
        }
    }

    pub fn set_status(&mut self, cat: Category, status: StepStatus) {
        self.step_statuses.insert(cat, status);
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

        let items: Vec<ListItem> = self
            .categories
            .iter()
            .map(|(cat, name)| {
                let status = self
                    .step_statuses
                    .get(cat)
                    .copied()
                    .unwrap_or(StepStatus::Pending);
                let (bracket, style) = match status {
                    StepStatus::Completed => ("[x]", Style::default().fg(theme.primary)),
                    StepStatus::Pending => ("[ ]", Style::default().fg(theme.text)),
                    StepStatus::NotApplicable => ("[-]", Style::default().fg(theme.secondary)),
                };

                let line = ratatui::text::Line::from(vec![
                    ratatui::text::Span::styled(format!(" {} ", bracket), style),
                    ratatui::text::Span::styled(name.clone(), style),
                ]);

                ListItem::new(line).style(Style::default().bg(theme.bg))
            })
            .collect();

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Steps ")
                    .border_style(border_style)
                    .style(Style::default().bg(theme.bg)),
            )
            .highlight_style(Style::default().bg(theme.primary).fg(theme.bg))
            .highlight_symbol(">>");

        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
