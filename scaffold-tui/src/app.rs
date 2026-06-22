use crate::action::Action;
use crate::components::{
    description_pane::DescriptionPane,
    directory_browser::DirectoryBrowser,
    footer::Footer,
    header::Header,
    nav_tree::{Category, NavTree},
    summary::SummaryPane,
    workspace::Workspace,
    Component,
};
use crate::theme::Theme;
use crate::tui::{handle_terminal_events, Tui};
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout, Rect};
use ratatui::widgets::{Block, Borders, Clear, Paragraph};
use tokio::sync::mpsc::{self, UnboundedSender};

const BRAILLE_FRAMES: &[&str] = &["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActiveBlock {
    NavTree,
    Workspace,
    SummaryPane,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WizardState {
    DeploymentTarget,
    Artifacts,
    AgentPersona,
    Skills,
    License,
    Complete,
    Executing,
}

pub struct App {
    pub should_quit: bool,
    pub active_block: ActiveBlock,
    pub theme: Theme,
    pub theme_idx: usize,
    pub wizard_state: WizardState,
    pub target_folder: String,
    pub splash_tick_count: usize,
    pub splash_frame_idx: usize,
    header: Header,
    nav_tree: NavTree,
    workspace: Workspace,
    description_pane: DescriptionPane,
    summary_pane: SummaryPane,
    footer: Footer,
    directory_browser: DirectoryBrowser,
    tx: UnboundedSender<String>,
    rx: tokio::sync::mpsc::UnboundedReceiver<String>,
    execution_logs: Vec<String>,
    execution_scroll_offset: usize,
    payload_dir: std::path::PathBuf,
}

impl App {
    pub fn new(payload_dir: std::path::PathBuf) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let initial_target = if cfg!(windows) {
            "C:\\".to_string()
        } else {
            directories::UserDirs::new()
                .map(|u| u.home_dir().to_path_buf().to_string_lossy().to_string())
                .unwrap_or_else(|| "/".to_string())
        };

        let mut workspace = Workspace::new(payload_dir.clone());
        workspace.detect_installed(&initial_target);

        let app = Self {
            should_quit: false,
            active_block: ActiveBlock::Workspace,
            theme: Theme::default_theme(),
            theme_idx: 0,
            wizard_state: WizardState::DeploymentTarget,
            target_folder: initial_target,
            splash_tick_count: 0,
            splash_frame_idx: 0,
            header: Header::new(),
            nav_tree: NavTree::new(),
            workspace,
            description_pane: DescriptionPane::new(),
            summary_pane: SummaryPane::new(),
            footer: Footer::new(),
            directory_browser: DirectoryBrowser::new(),
            tx,
            rx,
            execution_logs: Vec::new(),
            execution_scroll_offset: 0,
            payload_dir,
        };
        app
    }

    fn update_summary(&mut self) {
        let selected_artifacts = self
            .workspace
            .items
            .iter()
            .filter(|i| i.selected && i.category == Category::Artifacts)
            .count();
        let selected_persona = self
            .workspace
            .items
            .iter()
            .filter(|i| i.selected && i.category == Category::AgentPersona)
            .map(|i| i.label.clone())
            .collect::<Vec<_>>()
            .join("");
        let selected_skills = self
            .workspace
            .items
            .iter()
            .filter(|i| i.selected && i.category == Category::AgentSkills)
            .count();
        let selected_license = self
            .workspace
            .items
            .iter()
            .filter(|i| i.selected && i.category == Category::License)
            .map(|i| i.label.clone())
            .collect::<Vec<_>>()
            .join(", ");

        if self.wizard_state != WizardState::Complete {
            let (title, text) = match self.wizard_state {
                WizardState::DeploymentTarget => (" Step 1: Deployment Target ", format!("{} The current deployment target is ({}).\nPress [Enter] or [F] to browse for a folder.\nPress [Tab] to keep current folder and proceed.", BRAILLE_FRAMES[self.splash_frame_idx], self.target_folder)),
                WizardState::Artifacts => (" Step 2: Core Artifacts ", "Use [Up/Down] to navigate and [Space] to toggle files.\nPress [Enter] or [Tab] when ready to proceed.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::AgentPersona => (" Step 3: Agent Persona ", "Select the primary focus for the Agent. This will tailor testing guidelines and instructions.\nPress [Enter] or [Tab] to proceed to Skills.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::Skills => (" Step 4: Agent Skills ", "Select the domain skills you need. Notice how GitHub and Firebase toggle their companion artifacts!\nPress [Enter] or [Tab] to proceed to Licensing.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::License => (" Step 5: Licensing ", "Choose an open-source license.\nPress [Enter] or [Tab] to complete the wizard.\nPress [Shift+Tab] to go back.".to_string()),
                _ => ("", "".to_string()),
            };
            self.summary_pane.title = title.to_string();
            self.summary_pane.summary_text = text;
        } else {
            self.summary_pane.title = " Deployment Summary ".to_string();
            self.summary_pane.summary_text = format!(
                "Deployment Footprint:\n- Target: {}\n- {} Artifacts Configured\n- Persona: {}\n- {} Skills Bridged\n- License: {}\n\nSystem Ready. Press [Enter] or [Ctrl+D] to Deploy.",
                self.target_folder,
                selected_artifacts,
                if selected_persona.is_empty() { "None" } else { &selected_persona },
                selected_skills,
                if selected_license.is_empty() { "None" } else { &selected_license }
            );
        }
    }

    pub async fn run(&mut self, mut tui: Tui) -> Result<()> {
        tui.enter()?;
        self.update_summary();

        while !self.should_quit {
            while let Ok(msg) = self.rx.try_recv() {
                self.execution_logs.push(msg);
                if self.wizard_state == WizardState::Executing {
                    // Auto-scroll if offset is 0
                    let total = self.execution_logs.len();
                    let start = if total > 6 + self.execution_scroll_offset {
                        total - 6 - self.execution_scroll_offset
                    } else {
                        0
                    };

                    let display_logs: Vec<String> = self
                        .execution_logs
                        .iter()
                        .skip(start)
                        .take(6)
                        .cloned()
                        .collect();
                    self.summary_pane.summary_text = display_logs.join("\n");
                }
            }

            let selected_label = self.workspace.selected_label().unwrap_or("").to_string();
            let selected_desc = self
                .workspace
                .selected_description()
                .unwrap_or("")
                .to_string();
            let selected_version = self.workspace.selected_version().unwrap_or("").to_string();
            self.description_pane.set_selected_label(
                &selected_label,
                &selected_desc,
                &selected_version,
            );
            self.description_pane.show_qr = self.wizard_state == WizardState::Executing;

            tui.terminal.draw(|f| {
                let size = f.size();

                f.render_widget(
                    ratatui::widgets::Block::default().style(
                        ratatui::style::Style::default()
                            .bg(self.theme.bg)
                            .fg(self.theme.text),
                    ),
                    size,
                );

                let main_layout = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Length(3), // Header
                        Constraint::Min(10),   // Main Body
                        Constraint::Length(8), // Summary Pane
                        Constraint::Length(3), // Footer
                    ])
                    .split(size);

                let body_layout = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints([
                        Constraint::Percentage(25), // Nav Tree
                        Constraint::Percentage(45), // Workspace
                        Constraint::Percentage(30), // Description Pane
                    ])
                    .split(main_layout[1]);

                let _ = self.header.draw(f, main_layout[0], false, &self.theme);
                let _ = self.nav_tree.draw(
                    f,
                    body_layout[0],
                    self.active_block == ActiveBlock::NavTree,
                    &self.theme,
                );
                let _ = self.workspace.draw(
                    f,
                    body_layout[1],
                    self.active_block == ActiveBlock::Workspace,
                    &self.theme,
                );
                let _ = self
                    .description_pane
                    .draw(f, body_layout[2], false, &self.theme);
                let _ = self.summary_pane.draw(
                    f,
                    main_layout[2],
                    self.active_block == ActiveBlock::SummaryPane,
                    &self.theme,
                );
                let _ = self.footer.draw(f, main_layout[3], false, &self.theme);
                let _ = self.directory_browser.draw(f, size, true, &self.theme);
            })?;

            if let Some(action) = handle_terminal_events()? {
                self.update(action)?;
            }
        }

        tui.exit()?;
        Ok(())
    }

    fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
        let popup_layout = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Percentage((100 - percent_y) / 2),
                Constraint::Percentage(percent_y),
                Constraint::Percentage((100 - percent_y) / 2),
            ])
            .split(r);

        Layout::default()
            .direction(Direction::Horizontal)
            .constraints([
                Constraint::Percentage((100 - percent_x) / 2),
                Constraint::Percentage(percent_x),
                Constraint::Percentage((100 - percent_x) / 2),
            ])
            .split(popup_layout[1])[1]
    }

    pub fn update(&mut self, action: Action) -> Result<()> {
        if self.directory_browser.is_open && action != Action::Tick {
            let _ = self.directory_browser.update(action);
            if !self.directory_browser.is_open {
                if let Some(path) = self.directory_browser.selected_path.take() {
                    self.target_folder = path.clone();
                    self.workspace.detect_installed(&path);

                    // Auto-advance
                    self.wizard_state = WizardState::Artifacts;
                    self.workspace.set_category(Category::Artifacts);
                    self.nav_tree.set_selected(Category::Artifacts);
                    self.active_block = ActiveBlock::Workspace;

                    self.update_summary();
                }
            }
            return Ok(());
        }

        match action {
            Action::Tick => {
                self.splash_tick_count = self.splash_tick_count.wrapping_add(1);
                if self.splash_tick_count % 5 == 0 {
                    self.splash_frame_idx = (self.splash_frame_idx + 1) % BRAILLE_FRAMES.len();
                    if self.wizard_state == WizardState::DeploymentTarget {
                        self.update_summary();
                    }
                }
            }
            Action::Quit => self.should_quit = true,
            Action::Execute => {
                if self.wizard_state == WizardState::Complete {
                    self.wizard_state = WizardState::Executing;
                    self.summary_pane.title = " Deploying... ".to_string();
                    self.summary_pane.summary_text = "Initializing engine...".to_string();

                    let tx_clone = self.tx.clone();

                    let mut manifest_path = self.payload_dir.join("manifest.json");
                    if !manifest_path.exists() {
                        manifest_path = std::path::PathBuf::from("manifest.json");
                    }

                    let mut manifest = if let Ok(content) = std::fs::read_to_string(&manifest_path)
                    {
                        serde_json::from_str::<crate::models::manifest::Manifest>(&content)
                            .unwrap_or_else(|_| crate::models::manifest::Manifest {
                                metadata: crate::models::manifest::ManifestMetadata {
                                    version: "3.23.5".into(),
                                    last_updated: "now".into(),
                                },
                                env: std::collections::HashMap::new(),
                                apps: Vec::new(),
                                artifacts: Vec::new(),
                                skills: Vec::new(),
                            })
                    } else {
                        crate::models::manifest::Manifest {
                            metadata: crate::models::manifest::ManifestMetadata {
                                version: "3.23.5".into(),
                                last_updated: "now".into(),
                            },
                            env: std::collections::HashMap::new(),
                            apps: Vec::new(),
                            artifacts: Vec::new(),
                            skills: Vec::new(),
                        }
                    };

                    // Prefix apps targets with target_folder
                    for app in &mut manifest.apps {
                        let target_path =
                            std::path::PathBuf::from(&self.target_folder).join(&app.target);
                        app.target = target_path.to_string_lossy().to_string();
                    }

                    // Inject default directories
                    let required_dirs = [
                        "project_details",
                        "project_details/assets",
                        "project_details/history",
                    ];
                    for d in required_dirs {
                        let target_path = std::path::PathBuf::from(&self.target_folder).join(d);
                        manifest.apps.push(crate::models::manifest::AppEntry {
                            id: d.to_string(),
                            label: d.to_string(),
                            target: target_path.to_string_lossy().to_string(),
                            method: "mkdir".into(),
                        });
                    }

                    // Replace artifacts and skills with strictly user-selected ones
                    let mut selected_artifacts = Vec::new();
                    let mut selected_skills = Vec::new();

                    for item in &self.workspace.items {
                        if !item.selected {
                            continue;
                        }
                        match item.category {
                            Category::Artifacts => {
                                let source = self.payload_dir.join(".templates").join(&item.label);

                                let target_dir = if item.label.eq_ignore_ascii_case("readme.md")
                                    || item.label.eq_ignore_ascii_case(".env")
                                    || item.label.eq_ignore_ascii_case("license.md")
                                    || item.label.eq_ignore_ascii_case(".gitignore")
                                {
                                    std::path::PathBuf::from(&self.target_folder)
                                } else {
                                    std::path::PathBuf::from(&self.target_folder)
                                        .join("project_details")
                                };

                                let target = target_dir.join(&item.label);

                                selected_artifacts.push(crate::models::manifest::ArtifactEntry {
                                    id: item.label.clone(),
                                    label: item.label.clone(),
                                    source: Some(source.to_string_lossy().to_string()),
                                    target: target.to_string_lossy().to_string(),
                                    method: "copy".into(),
                                });
                            }
                            Category::AgentSkills => {
                                let source = self
                                    .payload_dir
                                    .join(".skills")
                                    .join(item.label.replace(".md", ""));
                                let target = std::path::PathBuf::from(&self.target_folder)
                                    .join(".skills")
                                    .join(item.label.replace(".md", ""));
                                selected_skills.push(crate::models::manifest::SkillEntry {
                                    id: item.label.clone(),
                                    label: item.label.clone(),
                                    source: Some(source.to_string_lossy().to_string()),
                                    target: target.to_string_lossy().to_string(),
                                    method: "copy".into(),
                                });
                            }
                            Category::AgentPersona => {
                                let target = std::path::PathBuf::from(&self.target_folder)
                                    .join(".agents")
                                    .join("AGENTS.md");
                                selected_artifacts.push(crate::models::manifest::ArtifactEntry {
                                    id: item.label.clone(),
                                    label: item.label.clone(),
                                    source: None,
                                    target: target.to_string_lossy().to_string(),
                                    method: "touch".into(),
                                });
                            }
                            Category::License => {
                                let source = self
                                    .payload_dir
                                    .join(".licenses")
                                    .join(format!("{}.md", item.label));
                                let target = std::path::PathBuf::from(&self.target_folder)
                                    .join("LICENSE.md");
                                selected_artifacts.push(crate::models::manifest::ArtifactEntry {
                                    id: item.label.clone(),
                                    label: item.label.clone(),
                                    source: Some(source.to_string_lossy().to_string()),
                                    target: target.to_string_lossy().to_string(),
                                    method: "copy".into(),
                                });
                            }
                            _ => {}
                        }
                    }

                    manifest.artifacts = selected_artifacts;
                    manifest.skills = selected_skills;

                    let payload_dir_clone = self.payload_dir.clone();
                    let target_folder_clone = self.target_folder.clone();
                    tokio::spawn(async move {
                        if let Err(e) = crate::manifest_engine::execute(
                            &manifest,
                            tx_clone.clone(),
                            &payload_dir_clone,
                            &target_folder_clone,
                        )
                        .await
                        {
                            let _ = tx_clone.send(format!(" -> (FATAL) Execution failed: {}", e));
                        }
                        let _ = tx_clone.send("".to_string());
                        let _ = tx_clone
                            .send("[DONE] Deployment finished. Press [Esc] to exit.".into());
                    });
                }
            }
            Action::Tab => {
                if self.wizard_state == WizardState::Complete {
                    self.active_block = match self.active_block {
                        ActiveBlock::NavTree => ActiveBlock::Workspace,
                        ActiveBlock::Workspace => ActiveBlock::NavTree,
                        ActiveBlock::SummaryPane => ActiveBlock::NavTree,
                    };
                } else if self.wizard_state == WizardState::DeploymentTarget {
                    self.wizard_state = WizardState::Artifacts;
                    self.workspace.set_category(Category::Artifacts);
                    self.nav_tree.set_selected(Category::Artifacts);
                    self.active_block = ActiveBlock::Workspace;
                } else {
                    let _ = self.update(Action::Enter)?;
                    return Ok(());
                }
            }
            Action::ShiftTab => {
                if self.wizard_state == WizardState::Complete {
                    self.active_block = match self.active_block {
                        ActiveBlock::NavTree => ActiveBlock::Workspace,
                        ActiveBlock::Workspace => ActiveBlock::NavTree,
                        ActiveBlock::SummaryPane => ActiveBlock::Workspace,
                    };
                } else {
                    match self.wizard_state {
                        WizardState::Artifacts => {
                            self.wizard_state = WizardState::DeploymentTarget;
                            self.workspace.set_category(Category::DeploymentTarget);
                            self.nav_tree.set_selected(Category::DeploymentTarget);
                        }
                        WizardState::AgentPersona => {
                            self.wizard_state = WizardState::Artifacts;
                            self.workspace.set_category(Category::Artifacts);
                            self.nav_tree.set_selected(Category::Artifacts);
                        }
                        WizardState::Skills => {
                            let has_agent = self
                                .workspace
                                .items
                                .iter()
                                .any(|i| i.selected && i.label == "agent.md");
                            if has_agent {
                                self.wizard_state = WizardState::AgentPersona;
                                self.workspace.set_category(Category::AgentPersona);
                                self.nav_tree.set_selected(Category::AgentPersona);
                            } else {
                                self.wizard_state = WizardState::Artifacts;
                                self.workspace.set_category(Category::Artifacts);
                                self.nav_tree.set_selected(Category::Artifacts);
                            }
                        }
                        WizardState::License => {
                            self.wizard_state = WizardState::Skills;
                            self.workspace.set_category(Category::AgentSkills);
                            self.nav_tree.set_selected(Category::AgentSkills);
                        }
                        _ => {}
                    }
                    self.update_summary();
                }
            }
            Action::Char('t') | Action::Char('T') => {
                self.theme_idx = self.theme_idx.wrapping_add(1);
                self.theme = crate::theme::Theme::get_by_index(self.theme_idx);
            }
            Action::Char('f') | Action::Char('F') => {
                if self.wizard_state == WizardState::DeploymentTarget {
                    self.directory_browser.open(&self.target_folder);
                }
            }
            Action::Up => {
                if self.wizard_state == WizardState::Executing {
                    let max_offset = self.execution_logs.len().saturating_sub(6);
                    if self.execution_scroll_offset < max_offset {
                        self.execution_scroll_offset += 1;
                        let start = self
                            .execution_logs
                            .len()
                            .saturating_sub(6 + self.execution_scroll_offset);
                        let display_logs: Vec<String> = self
                            .execution_logs
                            .iter()
                            .skip(start)
                            .take(6)
                            .cloned()
                            .collect();
                        self.summary_pane.summary_text = display_logs.join("\n");
                    }
                } else if self.active_block == ActiveBlock::NavTree {
                    let _ = self.nav_tree.update(action)?;
                    self.workspace
                        .set_category(self.nav_tree.selected_category());
                } else if self.active_block == ActiveBlock::Workspace {
                    let _ = self.workspace.update(action)?;
                } else {
                    let _ = self.summary_pane.update(action)?;
                }
            }
            Action::Down => {
                if self.wizard_state == WizardState::Executing {
                    if self.execution_scroll_offset > 0 {
                        self.execution_scroll_offset -= 1;
                        let start = self
                            .execution_logs
                            .len()
                            .saturating_sub(6 + self.execution_scroll_offset);
                        let display_logs: Vec<String> = self
                            .execution_logs
                            .iter()
                            .skip(start)
                            .take(6)
                            .cloned()
                            .collect();
                        self.summary_pane.summary_text = display_logs.join("\n");
                    }
                } else if self.active_block == ActiveBlock::NavTree {
                    let _ = self.nav_tree.update(action)?;
                    self.workspace
                        .set_category(self.nav_tree.selected_category());
                } else if self.active_block == ActiveBlock::Workspace {
                    let _ = self.workspace.update(action)?;
                } else {
                    let _ = self.summary_pane.update(action)?;
                }
            }
            Action::Enter => {
                if self.active_block == ActiveBlock::Workspace {
                    if let Some(idx) = self.workspace.state.selected() {
                        let visible = self.workspace.visible_indices();
                        if idx < visible.len() {
                            let actual = visible[idx];
                            if !self.workspace.items[actual].selected {
                                let _ = self.workspace.update(Action::Char(' '));
                            }
                        }
                    }
                }
                match self.wizard_state {
                    WizardState::DeploymentTarget => {
                        self.directory_browser.open(&self.target_folder);
                    }
                    WizardState::Artifacts => {
                        let has_agent = self
                            .workspace
                            .items
                            .iter()
                            .any(|i| i.selected && i.label == "agent.md");
                        if has_agent {
                            self.wizard_state = WizardState::AgentPersona;
                            self.workspace.set_category(Category::AgentPersona);
                            self.nav_tree.set_selected(Category::AgentPersona);
                        } else {
                            self.wizard_state = WizardState::Skills;
                            self.workspace.set_category(Category::AgentSkills);
                            self.nav_tree.set_selected(Category::AgentSkills);
                        }
                    }
                    WizardState::AgentPersona => {
                        self.wizard_state = WizardState::Skills;
                        self.workspace.set_category(Category::AgentSkills);
                        self.nav_tree.set_selected(Category::AgentSkills);
                    }
                    WizardState::Skills => {
                        self.wizard_state = WizardState::License;
                        self.workspace.set_category(Category::License);
                        self.nav_tree.set_selected(Category::License);
                    }
                    WizardState::License => {
                        self.wizard_state = WizardState::Complete;
                        self.active_block = ActiveBlock::NavTree;
                    }
                    WizardState::Complete => {
                        let _ = self.update(Action::Execute)?;
                    }
                    WizardState::Executing => {}
                }
                self.update_summary();
            }
            _ => {
                if self.wizard_state != WizardState::Complete {
                    self.active_block = ActiveBlock::Workspace;
                    if let Ok(Some(Action::Enter)) = self.workspace.update(action.clone()) {
                        let _ = self.update(Action::Enter);
                    }
                } else {
                    match self.active_block {
                        ActiveBlock::NavTree => {
                            let _ = self.nav_tree.update(action)?;
                            self.workspace
                                .set_category(self.nav_tree.selected_category());
                        }
                        ActiveBlock::Workspace => {
                            let _ = self.workspace.update(action)?;
                        }
                        ActiveBlock::SummaryPane => {
                            let _ = self.summary_pane.update(action)?;
                        }
                    }
                }
                self.update_summary();
            }
        }
        Ok(())
    }
}
