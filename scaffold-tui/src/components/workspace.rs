use crate::action::Action;
use crate::components::nav_tree::Category;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, List, ListItem};

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
        let mut items = vec![
            WorkspaceItem {
                label: "readme.md".to_string(),
                selected: true,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "vercel.json".to_string(),
                selected: true,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "deploy.yml".to_string(),
                selected: true,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "env.example".to_string(),
                selected: true,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "firebase.md".to_string(),
                selected: false,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "middleware.ts".to_string(),
                selected: false,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "layout.tsx".to_string(),
                selected: false,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "redis.ts".to_string(),
                selected: false,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "ratelimit.ts".to_string(),
                selected: false,
                category: Category::Artifacts,
            },
            WorkspaceItem {
                label: "MIT License".to_string(),
                selected: true,
                category: Category::License,
            },
            WorkspaceItem {
                label: "Apache 2.0".to_string(),
                selected: false,
                category: Category::License,
            },
            WorkspaceItem {
                label: "GPL v3".to_string(),
                selected: false,
                category: Category::License,
            },
        ];

        let skills_path = if std::path::Path::new(".skills").exists() {
            ".skills"
        } else {
            "../.skills"
        };

        if let Ok(entries) = std::fs::read_dir(skills_path) {
            let mut skill_names: Vec<String> = entries
                .flatten()
                .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
                .map(|e| e.file_name().to_string_lossy().to_string())
                .collect();
            skill_names.sort();
            for name in skill_names {
                items.push(WorkspaceItem {
                    label: name,
                    selected: false,
                    category: Category::AgentSkills,
                });
            }
        } else {
            items.push(WorkspaceItem {
                label: "Failed to load skills directory".into(),
                selected: false,
                category: Category::AgentSkills,
            });
        }

        Self {
            items,
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
        self.items
            .iter()
            .enumerate()
            .filter(|(_, item)| item.category == self.current_category)
            .map(|(i, _)| i)
            .collect()
    }
}

impl Component for Workspace {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return Ok(None);
        }

        match action {
            Action::Up => {
                self.selected_idx = self.selected_idx.saturating_sub(1);
            }
            Action::Down => {
                self.selected_idx = (self.selected_idx + 1).min(visible.len().saturating_sub(1));
            }
            Action::Char(' ') => {
                let actual_idx = visible[self.selected_idx];
                let new_state = !self.items[actual_idx].selected;
                self.items[actual_idx].selected = new_state;
                let label = self.items[actual_idx].label.clone();
                let category = self.items[actual_idx].category.clone();

                // Enforce companions
                if category == Category::AgentSkills {
                    if label == "firebase" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "firebase.md" && i.category == Category::Artifacts)
                        {
                            companion.selected = new_state;
                        }
                    } else if label == "github" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "deploy.yml" && i.category == Category::Artifacts)
                        {
                            companion.selected = new_state;
                        }
                    }
                } else if category == Category::Artifacts {
                    if label == "firebase.md" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "firebase" && i.category == Category::AgentSkills)
                        {
                            companion.selected = new_state;
                        }
                    } else if label == "deploy.yml" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "github" && i.category == Category::AgentSkills)
                        {
                            companion.selected = new_state;
                        }
                    }
                }
            }
            Action::Enter => {
                return Ok(Some(Action::Enter));
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

        let visible = self.visible_indices();
        let mut list_items = Vec::new();

        for (i, actual_idx) in visible.iter().enumerate() {
            let item = &self.items[*actual_idx];
            let prefix = if active && i == self.selected_idx {
                ">>"
            } else {
                "  "
            };
            let checkbox = if item.selected { "[X]" } else { "[ ]" };
            let display = format!("{} {} {}", prefix, checkbox, item.label);

            let style = if active && i == self.selected_idx {
                Style::default().bg(theme.primary).fg(theme.bg)
            } else {
                Style::default().fg(theme.text).bg(theme.bg)
            };

            list_items.push(ListItem::new(display).style(style));
        }

        let list = List::new(list_items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Deployment Configuration ")
                .border_style(border_style)
                .style(Style::default().bg(theme.bg)),
        );

        f.render_widget(list, area);
        Ok(())
    }
}
