use crate::action::Action;
use crate::components::nav_tree::Category;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};

pub struct WorkspaceItem {
    pub label: String,
    pub selected: bool,
    pub category: Category,
    pub description: Option<String>,
    pub version: Option<String>,
}

pub struct Workspace {
    pub items: Vec<WorkspaceItem>,
    pub selected_idx: usize,
    pub current_category: Category,
    pub state: ListState,
}

impl Workspace {
    pub fn new(payload_dir: std::path::PathBuf) -> Self {
        let mut items = vec![];

        items.push(WorkspaceItem {
            label: "Web Dev".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });
        items.push(WorkspaceItem {
            label: "Docker / DevOps".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });
        items.push(WorkspaceItem {
            label: "Mobile (iOS/And)".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });
        items.push(WorkspaceItem {
            label: "DBA".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });
        items.push(WorkspaceItem {
            label: "Systems Scripting".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });
        items.push(WorkspaceItem {
            label: "Generic".into(),
            selected: false,
            category: Category::AgentPersona,
            description: None,
            version: None,
        });

        let templates_dir = payload_dir.join(".templates");
        if templates_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&templates_dir) {
                let mut tmpl_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect();
                tmpl_names.sort();
                for name in tmpl_names {
                    if name.to_lowercase() == "license.md" {
                        continue;
                    }
                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::Artifacts,
                        description: None,
                        version: None,
                    });
                }
            }
        } else {
            items.push(WorkspaceItem {
                label: "Failed to load .templates directory".into(),
                selected: false,
                category: Category::Artifacts,
                description: None,
                version: None,
            });
        }

        let licenses_dir = payload_dir.join(".licenses");
        if licenses_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&licenses_dir) {
                let mut lic_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
                    .map(|e| {
                        let name = e.file_name().to_string_lossy().to_string();
                        name.strip_suffix(".md").unwrap_or(&name).to_string()
                    })
                    .collect();
                lic_names.sort();
                for name in lic_names {
                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::License,
                        description: None,
                        version: None,
                    });
                }
            }
        }

        let skills_dir = payload_dir.join(".skills");
        if skills_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&skills_dir) {
                let mut skill_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect();
                skill_names.sort();
                for name in skill_names {
                    let mut desc = None;
                    let mut vers = None;
                    let meta_path = skills_dir.join(&name).join("meta.json");
                    if let Ok(content) = std::fs::read_to_string(&meta_path) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(desc_str) = json.get("description").and_then(|v| v.as_str()) {
                                desc = Some(desc_str.to_string());
                            }
                            if let Some(vers_str) = json.get("version").and_then(|v| v.as_str()) {
                                vers = Some(vers_str.to_string());
                            }
                        }
                    }
                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::AgentSkills,
                        description: desc,
                        version: vers,
                    });
                }
            } else {
                items.push(WorkspaceItem {
                    label: "Failed to read skills directory".into(),
                    selected: false,
                    category: Category::AgentSkills,
                    description: None,
                    version: None,
                });
            }
        } else {
            items.push(WorkspaceItem {
                label: "Could not find .skills directory".into(),
                selected: false,
                category: Category::AgentSkills,
                description: None,
                version: None,
            });
        }

        Self {
            items,
            selected_idx: 0,
            current_category: Category::Artifacts,
            state: ListState::default(),
        }
    }

    pub fn set_category(&mut self, cat: Category) {
        if self.current_category != cat {
            self.current_category = cat;
            self.selected_idx = 0;
            self.state.select(Some(0));
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

    pub fn selected_label(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        Some(&self.items[*actual_idx].label)
    }

    pub fn selected_description(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        self.items[*actual_idx].description.as_deref()
    }

    pub fn selected_version(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        self.items[*actual_idx].version.as_deref()
    }

    pub fn detect_installed(&mut self, target_folder: &str) {
        let target = std::path::PathBuf::from(target_folder);
        if !target.exists() || !target.is_dir() {
            return;
        }

        for item in &mut self.items {
            match item.category {
                Category::Artifacts => {
                    // Check if artifact file exists in the target folder
                    if target.join(&item.label).exists() {
                        item.selected = true;
                    }
                }
                Category::AgentSkills => {
                    // Check if skill folder exists in the target .skills folder
                    if target.join(".skills").join(&item.label).exists() {
                        item.selected = true;
                    }
                }
                Category::License => {
                    // Difficult to pinpoint exact license without reading contents, but if the exact name exists:
                    if target.join(&item.label).exists() || target.join("LICENSE.md").exists() {
                        // For simplicity, we might not auto-select a specific license
                    }
                }
                Category::AgentPersona => {}
            }
        }
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
                self.state.select(Some(self.selected_idx));
            }
            Action::Down => {
                self.selected_idx = (self.selected_idx + 1).min(visible.len().saturating_sub(1));
                self.state.select(Some(self.selected_idx));
            }
            Action::Char(' ') => {
                let actual_idx = visible[self.selected_idx];
                let new_state = !self.items[actual_idx].selected;
                let category = self.items[actual_idx].category.clone();
                let label = self.items[actual_idx].label.clone();

                if category == Category::License || category == Category::AgentPersona {
                    for item in &mut self.items {
                        if item.category == category {
                            item.selected = false;
                        }
                    }
                }

                self.items[actual_idx].selected = new_state;

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
            let checkbox = if item.selected { "[X]" } else { "[ ]" };
            let display = format!("{} {}", checkbox, item.label);

            let style = Style::default().fg(theme.text).bg(theme.bg);

            list_items.push(ListItem::new(display).style(style));
        }

        let list = List::new(list_items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Deployment Configuration ")
                .border_style(border_style)
                .style(Style::default().bg(theme.bg)),
        );

        let list = if active {
            list.highlight_style(Style::default().bg(theme.primary).fg(theme.bg))
                .highlight_symbol(">> ")
        } else {
            list.highlight_style(Style::default().fg(theme.primary))
                .highlight_symbol("   ")
        };

        self.state.select(Some(self.selected_idx));
        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
