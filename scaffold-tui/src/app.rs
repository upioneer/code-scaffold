use crate::action::Action;
use crate::components::{
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
    Welcome,
    Artifacts,
    Skills,
    License,
    DeploymentTarget,
    Complete,
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
    summary_pane: SummaryPane,
    footer: Footer,
    tx: UnboundedSender<String>,
}

impl App {
    pub fn new(payload_dir: std::path::PathBuf) -> (Self, UnboundedSender<String>) {
        let (tx, _rx) = mpsc::unbounded_channel();
        let app = Self {
            should_quit: false,
            active_block: ActiveBlock::Workspace,
            theme: Theme::plum(),
            theme_idx: 0,
            wizard_state: WizardState::Welcome,
            target_folder: "./".to_string(),
            splash_tick_count: 0,
            splash_frame_idx: 0,
            header: Header::new(),
            nav_tree: NavTree::new(),
            workspace: Workspace::new(payload_dir),
            summary_pane: SummaryPane::new(),
            footer: Footer::new(),
            tx: tx.clone(),
        };
        (app, tx)
    }

    fn update_summary(&mut self) {
        let selected_artifacts = self
            .workspace
            .items
            .iter()
            .filter(|i| i.selected && i.category == Category::Artifacts)
            .count();
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
                WizardState::Welcome => (" Welcome to Code Scaffold! ", format!("{} We will guide you through the initial setup.\nPress [Enter] to begin configuring Artifacts.", BRAILLE_FRAMES[self.splash_frame_idx])),
                WizardState::Artifacts => (" Step 1: Core Artifacts ", "Use [Up/Down] to navigate and [Space] to toggle files.\nPress [Enter] when ready to proceed to Skills.".to_string()),
                WizardState::Skills => (" Step 2: Agent Skills ", "Select the domain skills you need. Notice how GitHub and Firebase toggle their companion artifacts!\nPress [Enter] when ready to proceed to Licensing.".to_string()),
                WizardState::License => (" Step 3: Licensing ", "Choose an open-source license.\nPress [Enter] to set the Deployment Target.".to_string()),
                WizardState::DeploymentTarget => (" Step 4: Deployment Target ", format!("The default deployment target is ({}).\nPress [F] to open the native OS file explorer and select a different folder.\nPress [Enter] to complete the wizard.", self.target_folder)),
                _ => ("", "".to_string()),
            };
            self.summary_pane.title = title.to_string();
            self.summary_pane.summary_text = text;
        } else {
            self.summary_pane.title = " Deployment Summary ".to_string();
            self.summary_pane.summary_text = format!(
                "Deployment Footprint:\n- Target: {}\n- {} Artifacts Configured\n- {} Skills Bridged\n- License: {}\n\nSystem Ready. Press [Ctrl+X] to Deploy.",
                self.target_folder,
                selected_artifacts,
                selected_skills,
                if selected_license.is_empty() { "None" } else { &selected_license }
            );
        }
    }

    pub async fn run(&mut self, mut tui: Tui) -> Result<()> {
        tui.enter()?;
        self.update_summary();

        while !self.should_quit {
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
                        Constraint::Percentage(30), // Nav Tree
                        Constraint::Percentage(70), // Workspace
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
                let _ = self.summary_pane.draw(
                    f,
                    main_layout[2],
                    self.active_block == ActiveBlock::SummaryPane,
                    &self.theme,
                );
                let _ = self.footer.draw(f, main_layout[3], false, &self.theme);
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
        match action {
            Action::Tick => {
                self.splash_tick_count = self.splash_tick_count.wrapping_add(1);
                if self.splash_tick_count % 5 == 0 {
                    self.splash_frame_idx = (self.splash_frame_idx + 1) % BRAILLE_FRAMES.len();
                    if self.wizard_state == WizardState::Welcome {
                        self.update_summary();
                    }
                }
            }
            Action::Quit => self.should_quit = true,
            Action::Execute => {
                if self.wizard_state == WizardState::Complete {
                    let tx_clone = self.tx.clone();
                    self.should_quit = true;
                    // To do: wire backend execution engine back in with standard out rendering
                }
            }
            Action::Tab => {
                if self.wizard_state == WizardState::Complete {
                    self.active_block = match self.active_block {
                        ActiveBlock::NavTree => ActiveBlock::Workspace,
                        ActiveBlock::Workspace => ActiveBlock::SummaryPane,
                        ActiveBlock::SummaryPane => ActiveBlock::NavTree,
                    };
                }
            }
            Action::ShiftTab => {
                if self.wizard_state == WizardState::Complete {
                    self.active_block = match self.active_block {
                        ActiveBlock::NavTree => ActiveBlock::SummaryPane,
                        ActiveBlock::Workspace => ActiveBlock::NavTree,
                        ActiveBlock::SummaryPane => ActiveBlock::Workspace,
                    };
                }
            }
            Action::Char('t') | Action::Char('T') => {
                self.theme_idx = self.theme_idx.wrapping_add(1);
                self.theme = crate::theme::Theme::get_by_index(self.theme_idx);
            }
            Action::Char('f') | Action::Char('F') => {
                if self.wizard_state == WizardState::DeploymentTarget {
                    if let Some(path) = rfd::FileDialog::new().pick_folder() {
                        self.target_folder = path.to_string_lossy().to_string();
                        self.update_summary();
                    }
                }
            }
            Action::Enter => {
                match self.wizard_state {
                    WizardState::Welcome => {
                        self.wizard_state = WizardState::Artifacts;
                        self.workspace.set_category(Category::Artifacts);
                        self.nav_tree.set_selected(Category::Artifacts);
                        self.active_block = ActiveBlock::Workspace;
                    }
                    WizardState::Artifacts => {
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
                        self.wizard_state = WizardState::DeploymentTarget;
                    }
                    WizardState::DeploymentTarget => {
                        self.wizard_state = WizardState::Complete;
                        self.active_block = ActiveBlock::NavTree;
                    }
                    WizardState::Complete => {
                        if self.active_block == ActiveBlock::Workspace {
                            let _ = self.workspace.update(action)?;
                        }
                    }
                }
                self.update_summary();
            }
            _ => {
                if self.wizard_state != WizardState::Welcome {
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
        }
        Ok(())
    }
}
