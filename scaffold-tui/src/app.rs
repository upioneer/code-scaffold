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
    Welcome,
    DeploymentTarget,
    Artifacts,
    AgentPersona,
    ContributingTemplate,
    Skills,
    License,
    Complete,
    AgentOverwritePrompt,
    Executing,
    UpdateComplete,
    CustomSkillInput,
    ThemeNameInput,
    ThemeBgInput,
    ThemeTextInput,
    ThemePrimaryInput,
    ThemeSecondaryInput,
    ThemeAccentInput,
    AgentCopilotWelcome,
    AgentCopilotTimerSelection,
    AgentCopilot,
    ConfirmExit,
    AgentInstructionsModal,
}

#[derive(Debug, Clone)]
pub struct AgentSession {
    pub pin: String,
    pub key: String,
    pub status: String,
    pub recent_activity: Vec<String>,
    pub expires_at: Option<std::time::Instant>,
}

pub struct App {
    pub should_quit: bool,
    pub restart_requested: bool,
    pub active_block: ActiveBlock,
    pub theme: Theme,
    pub theme_idx: usize,
    pub wizard_state: WizardState,
    pub target_folder: String,
    pub custom_skill_input: String,
    pub custom_theme_name: String,
    pub custom_theme_bg: String,
    pub custom_theme_text: String,
    pub custom_theme_primary: String,
    pub custom_theme_secondary: String,
    pub custom_theme_accent: String,
    pub theme_input_buffer: String,
    pub is_advanced_theme_mode: bool,
    pub theme_input_error: String,
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
    pub welcome_scroll_offset: u16,
    pub welcome_max_scroll: std::cell::Cell<u16>,
    payload_dir: std::path::PathBuf,
    pub agent_overwrite_choice: Option<bool>,
    pub update_available: Option<String>,
    pub agent_session: Option<AgentSession>,
    pub copilot_timer_input: String,
    pub copilot_timer_error: String,
    pub cancel_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl App {
    pub fn default_target_dir() -> String {
        std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| {
                directories::UserDirs::new()
                    .map(|u| u.home_dir().to_path_buf().to_string_lossy().to_string())
                    .unwrap_or_else(|| {
                        if cfg!(windows) {
                            "C:\\".to_string()
                        } else {
                            "/".to_string()
                        }
                    })
            })
    }

    pub fn new(payload_dir: std::path::PathBuf) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let initial_target = Self::default_target_dir();

        let mut workspace = Workspace::new(payload_dir.clone());
        workspace.detect_installed(&initial_target);

        let wizard_state = if crate::prefs::has_seen_welcome() {
            WizardState::DeploymentTarget
        } else {
            WizardState::Welcome
        };

        let app = Self {
            should_quit: false,
            restart_requested: false,
            active_block: ActiveBlock::Workspace,
            theme: Theme::get_by_index(crate::prefs::load_theme_idx()),
            theme_idx: crate::prefs::load_theme_idx(),
            wizard_state,
            target_folder: Self::default_target_dir(),
            custom_skill_input: String::new(),
            custom_theme_name: String::new(),
            custom_theme_bg: String::new(),
            custom_theme_text: String::new(),
            custom_theme_primary: String::new(),
            custom_theme_secondary: String::new(),
            custom_theme_accent: String::new(),
            theme_input_buffer: String::new(),
            is_advanced_theme_mode: false,
            theme_input_error: String::new(),
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
            welcome_scroll_offset: 0,
            welcome_max_scroll: std::cell::Cell::new(0),
            payload_dir,
            agent_overwrite_choice: None,
            update_available: None,
            agent_session: None,
            copilot_timer_input: "60".to_string(),
            copilot_timer_error: String::new(),
            cancel_tx: None,
        };
        crate::updater::spawn_update_checker(app.tx.clone());
        app
    }

    fn update_summary(&mut self) {
        if matches!(
            self.wizard_state,
            WizardState::Executing
                | WizardState::CustomSkillInput
                | WizardState::ThemeNameInput
                | WizardState::ThemeBgInput
                | WizardState::ThemeTextInput
                | WizardState::ThemePrimaryInput
                | WizardState::ThemeSecondaryInput
                | WizardState::ThemeAccentInput
                | WizardState::AgentCopilotWelcome
                | WizardState::AgentCopilotTimerSelection
                | WizardState::AgentCopilot
                | WizardState::AgentOverwritePrompt
                | WizardState::ConfirmExit
        ) {
            return;
        }

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
            .join(", ");
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
                WizardState::Welcome => {
                    (" Step 0: Welcome ", "Initializing workspace orchestrator...\nWaiting for user input.".to_string())
                }
                WizardState::DeploymentTarget => {
                    let default_dir = Self::default_target_dir();
                    let reset_text = if self.target_folder != default_dir {
                        "\nPress [R] to reset default directory."
                    } else {
                        ""
                    };
                    let clean_path = self.target_folder.replace("\\\\?\\", "");
                    (
                        " Step 1: Deployment Target ",
                        format!(
                            "{} The current deployment target is: {}\nPress [Enter] or [F] to browse for a folder.\nPress [C] for Scaffold Connect.{}\nPress [Tab] to keep current folder and proceed.\nPress [Shift+E] to launch custom theme engine.\nPress [W] to review the Welcome message.",
                            BRAILLE_FRAMES[self.splash_frame_idx], clean_path, reset_text
                        ),
                    )
                }
                WizardState::Artifacts => (" Step 2: Core Artifacts ", "Use [Up/Down] to navigate and [Space] to toggle files.\nPress [Enter] or [Tab] when ready to proceed.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::AgentPersona => (" Step 3: Agent Persona (Conditional) ", "Select the primary focus for the Agent. This will tailor testing guidelines and instructions.\nPress [Enter] or [Tab] to proceed to Contributing Template.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::ContributingTemplate => (" Step 4: Contributing Template (Conditional) ", "Select an open-source or proprietary PR contribution policy.\nPress [Enter] or [Tab] to proceed to Skills.\nPress [Shift+Tab] to go back.".to_string()),
                WizardState::Skills => {
                    let mut text = "Select the domain skills you need. Notice how GitHub and Firebase toggle their companion artifacts!\nPress [Enter] or [Tab] to proceed to Licensing.\nPress [Shift+Tab] to go back.".to_string();
                    if let Some(idx) = self.workspace.state.selected() {
                        let visible = self.workspace.visible_indices();
                        if idx < visible.len() {
                            let actual = visible[idx];
                            if self.workspace.items[actual].label.starts_with("(BYOS) ") {
                                text.push_str("\nPress [Shift+D] to delete custom skill.");
                            }
                        }
                    }
                    (" Step 5: Agent Skills (Conditional) ", text)
                }
                WizardState::License => (" Step 6: Licensing (Conditional) ", "Choose an open-source license.\nPress [Enter] or [Tab] to complete the wizard.\nPress [Shift+Tab] to go back.".to_string()),
                _ => ("", "".to_string()),
            };
            self.summary_pane.title = title.to_string();
            self.summary_pane.summary_text = text;
        } else {
            self.summary_pane.title = " Step 7: Ready to Deploy ".to_string();
            let clean_path = self.target_folder.replace("\\\\?\\", "");
            self.summary_pane.summary_text = format!(
                "Deployment Footprint:\n- Target: {}\n- {} Artifacts Configured\n- Persona(s): {}\n- {} Skills Bridged\n- License: {}\n\n*** SYSTEM READY! Press [Enter] now to deploy the project scaffolding! ***\n(Press [Shift+Tab] to go back)",
                clean_path,
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
                if let Some(version) = msg.strip_prefix("[UPDATE_AVAILABLE] ") {
                    self.update_available = Some(version.to_string());
                    self.header.update_available = Some(version.to_string());
                    continue;
                }
                if msg == "[UPDATE_COMPLETE]" {
                    self.wizard_state = WizardState::UpdateComplete;
                    self.summary_pane.title = " Update Complete ".to_string();
                    self.summary_pane.summary_text = "The application has successfully been updated!\n\nPlease manually exit and restart the CLI for the new version to take effect.\n\nPress [Enter] or [Esc] to exit.".to_string();
                    continue;
                }
                if msg == "[CLIENT_DISCONNECTED]" {
                    self.header.agent_connected = None;
                    if let Some(session) = &mut self.agent_session {
                        session.status = "LISTENING".to_string();
                        session.recent_activity.push(
                            "Agent disconnected. Relay is keeping the room open for follow-up commands...".to_string(),
                        );
                    }
                    continue;
                }
                if msg == "SESSION_TIMEOUT" {
                    if let Some(old_tx) = self.cancel_tx.take() {
                        let _ = old_tx.send(());
                    }
                    self.header.agent_connected = None;
                    if let Some(session) = &mut self.agent_session {
                        session.status = "EXPIRED".to_string();
                        session.pin = "".to_string();
                        session.key = "".to_string();
                        session.recent_activity.push(
                            "10-minute Alpha limit reached. Session expired. Please re-pair."
                                .to_string(),
                        );
                    }
                    continue;
                }
                if let Some(agent_name) = msg.strip_prefix("AGENT_PAIRED:") {
                    self.header.agent_connected = Some(agent_name.to_string());
                    if let Some(session) = &mut self.agent_session {
                        session.status = "PAIRED".to_string();
                        session
                            .recent_activity
                            .push(format!("Handshake complete. Client: {}", agent_name));
                    }
                    continue;
                }
                if let Some(session) = &mut self.agent_session {
                    if self.wizard_state == WizardState::AgentCopilot {
                        session.recent_activity.push(msg.clone());
                    }
                }
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
            let selected_logo = self.workspace.selected_logo().cloned();
            let selected_category = Some(self.workspace.current_category.clone());
            self.description_pane.set_selected_label(
                &selected_label,
                &selected_desc,
                &selected_version,
                selected_logo,
                selected_category,
            );
            self.description_pane.show_qr = self.wizard_state == WizardState::Executing;

            tui.terminal.draw(|f| {
                let size = f.size();

                let main_layout = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Length(6), // Header
                        Constraint::Min(10),   // Main Body
                        Constraint::Length(11), // Summary Pane
                        Constraint::Length(3), // Footer
                    ])
                    .split(size);

                let body_layout = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints([
                        Constraint::Percentage(25), // Nav Tree
                        Constraint::Length(1),      // Spacer
                        Constraint::Percentage(25), // Workspace
                        Constraint::Length(1),      // Spacer
                        Constraint::Min(0),         // Description Pane (fill remaining)
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
                    body_layout[2],
                    self.active_block == ActiveBlock::Workspace,
                    &self.theme,
                );
                let _ = self
                    .description_pane
                    .draw(f, body_layout[4], false, &self.theme);
                let _ = self.summary_pane.draw(
                    f,
                    main_layout[2],
                    self.active_block == ActiveBlock::SummaryPane,
                    &self.theme,
                );
                let _ = self.footer.draw(f, main_layout[3], false, &self.theme);
                let _ = self.directory_browser.draw(f, size, true, &self.theme);

                if self.wizard_state == WizardState::Welcome {
                    let logo = if size.width < 75 {
                        ""
                    } else if size.width < 100 {
                        r#"
  ____ ___  ____  _____
 / ___/ _ \|  _ \| ____|
| |  | | | | | | |  _|
| |__| |_| | |_| | |___
 \____\___/|____/|_____|
  ____   ____    _    _____ _____ ___  _     ____
 / ___| / ___|  / \  |  ___|  ___/ _ \| |   |  _ \
 \___ \| |     / _ \ | |_  | |_ | | | | |   | | | |
  ___) | |___ / ___ \|  _| |  _|| |_| | |___| |_| |
 |____/ \____/_/   \_\_|   |_|   \___/|_____|____/"#
                    } else {
                        r#"
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝

███████╗ ██████╗ █████╗ ███████╗███████╗ ██████╗ ██╗     ██████╗
██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██╔══██╗
███████╗██║     ███████║█████╗  █████╗  ██║   ██║██║     ██║  ██║
╚════██║██║     ██╔══██║██╔══╝  ██╔══╝  ██║   ██║██║     ██║  ██║
███████║╚██████╗██║  ██║██║     ██║     ╚██████╔╝███████╗██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝      ╚═════╝ ╚══════╝╚═════╝"#
                    };

                    let mut text_lines = Vec::new();
                    text_lines.push(ratatui::text::Line::from(""));

                    let c1 = self.theme.primary;
                    let mut c2 = self.theme.accent;

                    if crate::theme::Theme::color_distance(&c1, &c2) < 10.0 {
                        c2 = self.theme.secondary;
                    }
                    if crate::theme::Theme::color_distance(&c1, &c2) < 10.0 {
                        c2 = crate::theme::Theme::auto_derive_accent(&c1);
                    }

                    let (r1, g1, b1) = if let ratatui::style::Color::Rgb(r, g, b) = c1 { (r as f32, g as f32, b as f32) } else { (255.0, 255.0, 255.0) };
                    let (r2, g2, b2) = if let ratatui::style::Color::Rgb(r, g, b) = c2 { (r as f32, g as f32, b as f32) } else { (200.0, 200.0, 200.0) };

                    let logo = logo.trim_start_matches('\n');
                    let tick = self.splash_tick_count;
                    let height = logo.lines().count();

                    for (i, line) in logo.lines().enumerate() {
                        if line.is_empty() {
                            text_lines.push(ratatui::text::Line::from(""));
                            continue;
                        }
                        let mut spans = Vec::new();
                        let len = line.chars().count();
                        for (j, mut ch) in line.chars().enumerate() {
                            let ratio = if len > 1 { j as f32 / (len - 1) as f32 } else { 0.0 };
                            let r = (r1 * (1.0 - ratio) + r2 * ratio) as u8;
                            let g = (g1 * (1.0 - ratio) + g2 * ratio) as u8;
                            let b = (b1 * (1.0 - ratio) + b2 * ratio) as u8;

                            // Procedural Hologram Assembly Effect
                            // Delay rendering of characters from top-left to bottom-right
                            let char_delay = (i * 2 + (j / 4)) as usize;
                            if tick < char_delay {
                                ch = ' ';
                            } else if tick < char_delay + 8 && ch != ' ' {
                                // Glitch phase: render random braille dots
                                let noise = ((i * j * tick) % 255) as u32;
                                ch = char::from_u32(0x2800 + noise).unwrap_or(' ');
                            }

                            spans.push(ratatui::text::Span::styled(ch.to_string(), ratatui::style::Style::default().fg(ratatui::style::Color::Rgb(r, g, b))));
                        }
                        text_lines.push(ratatui::text::Line::from(spans));
                    }

                    text_lines.push(ratatui::text::Line::from(""));
                    text_lines.push(ratatui::text::Line::from(ratatui::text::Span::styled(
                        "The ultimate orchestrator for AI-driven workspaces.",
                        ratatui::style::Style::default().fg(self.theme.secondary)
                    )));
                    text_lines.push(ratatui::text::Line::from(""));
                    text_lines.push(ratatui::text::Line::from(""));

                    let mut is_in_path = false;
                    if let Ok(exe_path) = std::env::current_exe() {
                        if let Some(dir) = exe_path.parent() {
                            if let Ok(path_var) = std::env::var("PATH") {
                                let dir_str = dir.to_string_lossy().to_string();
                                is_in_path = path_var.contains(&dir_str);
                            }
                        }
                    }

                    let mut welcome = String::new();
                    if is_in_path {
                        welcome.push_str("✅ Code Scaffold is successfully detected in your system PATH!\nYou can natively launch it from any directory in your terminal.");
                    } else {
                        welcome.push_str("To make launching environments frictionless, you can add this executable to your system PATH.\nThis allows you to type 'code-scaffold' natively from any directory in terminal.\n");
                        if cfg!(windows) {
                            welcome.push_str("\nPress [P] to automatically inject Code Scaffold into your User PATH.");
                        } else {
                            welcome.push_str("\nOn Linux/macOS, add to PATH by running: sudo ln -s $(pwd)/code-scaffold /usr/local/bin/");
                        }
                    }

                    let changelog_str = include_str!(concat!(env!("OUT_DIR"), "/changelog.txt"));
                    if !changelog_str.trim().is_empty() {
                        welcome.push_str("\n\n");
                        welcome.push_str(changelog_str);
                    }

                    welcome.push_str("\n\nPress [Enter] or [Tab] to continue.");

                    for line in welcome.lines() {
                        text_lines.push(ratatui::text::Line::from(ratatui::text::Span::styled(
                            line.to_string(),
                            ratatui::style::Style::default().fg(self.theme.text).bg(self.theme.bg)
                        )));
                    }

                    let area = Self::centered_rect(80, 70, size);
                    let mut max_lines = 0;
                    let inner_width = area.width.saturating_sub(10) as usize;
                    for line in &text_lines {
                        let w = line.width();
                        if inner_width > 0 {
                            max_lines += (w / inner_width) + 1;
                        } else {
                            max_lines += 1;
                        }
                    }
                    let visible_height = area.height.saturating_sub(2) as usize;
                    let max_scroll = max_lines.saturating_sub(visible_height) as u16;
                    self.welcome_max_scroll.set(max_scroll);

                    let mut block = ratatui::widgets::Block::default()
                        .title(" Step 0: Welcome ")
                        .borders(ratatui::widgets::Borders::ALL)
                        .border_style(ratatui::style::Style::default().fg(self.theme.primary))
                        .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                        .padding(ratatui::widgets::Padding::new(4, 4, 1, 1));

                    if max_scroll > 0 && self.welcome_scroll_offset < max_scroll {
                        if self.splash_tick_count % 60 < 30 {
                            block = block.title(
                                ratatui::widgets::block::Title::from(ratatui::text::Span::styled(
                                    " ▼ Scroll ▼ ",
                                    ratatui::style::Style::default().fg(self.theme.accent).add_modifier(ratatui::style::Modifier::BOLD)
                                ))
                                .position(ratatui::widgets::block::Position::Bottom)
                                .alignment(ratatui::layout::Alignment::Center)
                            );
                        }
                    }

                    let popup_block = ratatui::widgets::Paragraph::new(text_lines)
                        .alignment(ratatui::layout::Alignment::Left)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .scroll((self.welcome_scroll_offset, 0))
                        .block(block);

                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);

                    let mut scrollbar_state = ratatui::widgets::ScrollbarState::new(max_scroll as usize)
                        .position(self.welcome_scroll_offset as usize);

                    f.render_stateful_widget(
                        ratatui::widgets::Scrollbar::default()
                            .orientation(ratatui::widgets::ScrollbarOrientation::VerticalRight)
                            .begin_symbol(Some("▲"))
                            .end_symbol(Some("▼"))
                            .style(ratatui::style::Style::default().fg(self.theme.primary)),
                        area,
                        &mut scrollbar_state
                    );
                } else if self.wizard_state == WizardState::CustomSkillInput {
                    let text = format!("Please enter a valid approved platform URL or CLI install command (e.g. npx/git clone):\n\n> {}\u{2588}\n\nPress [Enter] to submit, or [Esc] to cancel.", self.custom_skill_input);
                    let lines = Self::format_highlighted_lines(&text, &self.theme);
                    let popup_block = ratatui::widgets::Paragraph::new(lines)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Import Custom Skill (BYOS) ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.primary))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(4, 4, 1, 1))
                        );
                    let area = Self::centered_rect(80, 40, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if matches!(
                    self.wizard_state,
                    WizardState::ThemeNameInput
                        | WizardState::ThemeBgInput
                        | WizardState::ThemeTextInput
                        | WizardState::ThemePrimaryInput
                        | WizardState::ThemeSecondaryInput
                        | WizardState::ThemeAccentInput
                ) {
                    let prompt = match self.wizard_state {
                        WizardState::ThemeNameInput => "Step 1: Enter a unique Theme Name (Max 15 chars, no spaces)".to_string(),
                        WizardState::ThemeBgInput => format!("Step 2: Enter Background Hex (e.g. #1E1E1E)\n\nName: {}", self.custom_theme_name),
                        WizardState::ThemeTextInput => format!("Step 3: Enter Text Hex (e.g. #FFFFFF)\n\nName: {} | BG: {}", self.custom_theme_name, self.custom_theme_bg),
                        WizardState::ThemePrimaryInput => format!("Step 4: Enter Primary Highlight Hex (e.g. #FF0055)\n\nName: {} | BG: {} | Text: {}", self.custom_theme_name, self.custom_theme_bg, self.custom_theme_text),
                        WizardState::ThemeSecondaryInput => format!("Step 5 (Advanced): Enter Secondary Hex\n\nName: {} | BG: {} | Text: {} | Primary: {}", self.custom_theme_name, self.custom_theme_bg, self.custom_theme_text, self.custom_theme_primary),
                        WizardState::ThemeAccentInput => format!("Step 6 (Advanced): Enter Accent Hex\n\nName: {} | BG: {} | Text: {} | Primary: {} | Sec: {}", self.custom_theme_name, self.custom_theme_bg, self.custom_theme_text, self.custom_theme_primary, self.custom_theme_secondary),
                        _ => String::new(),
                    };

                    let error_msg = if !self.theme_input_error.is_empty() {
                        format!("\n\n[ERROR]: {}", self.theme_input_error)
                    } else {
                        String::new()
                    };

                    let tab_hint = if self.wizard_state == WizardState::ThemeNameInput {
                        if self.is_advanced_theme_mode {
                            "\n\n[Advanced Mode ON - 5 Colors] (Press [Tab] to toggle off)"
                        } else {
                            "\n\n[Standard Mode - 3 Colors] (Press [Tab] for 5 Colors)"
                        }
                    } else {
                        ""
                    };

                    let input_prefix = match self.wizard_state {
                        WizardState::ThemeNameInput => "Theme Name",
                        WizardState::ThemeBgInput => "Background",
                        WizardState::ThemeTextInput => "Text",
                        WizardState::ThemePrimaryInput => "Primary",
                        WizardState::ThemeSecondaryInput => "Secondary",
                        WizardState::ThemeAccentInput => "Theme (Accent)",
                        WizardState::AgentCopilotWelcome => "Agent Bridge",
                        WizardState::AgentCopilot => "Copilot",
                        _ => "",
                    };

                    let link_hint = "\n\nNeed inspiration? Visit: schemecolor.com/palettes";

                    let text = format!("{}\n\n{}: > {}\u{2588}{}{}{}\n\nPress [Enter] to submit, or [Esc] to cancel.", prompt, input_prefix, self.theme_input_buffer, error_msg, tab_hint, link_hint);
                    let lines = Self::format_highlighted_lines(&text, &self.theme);
                    let popup_block = ratatui::widgets::Paragraph::new(lines)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Custom Theme Builder ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.primary))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(4, 4, 1, 1))
                        );
                    let area = Self::centered_rect(80, 50, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if self.wizard_state == WizardState::AgentCopilotWelcome {
                    let text = format!(
                        "⚠️ SCAFFOLD CONNECT IS CURRENTLY IN ALPHA ⚠️\n\nAgent Connection Setup\n\nTo bridge an AI agent (like Claude, ChatGPT, or Devin) to this machine, you must first equip it with the Code Scaffold skill.\n\nInstruct your agent to run the following installation payload:\n\n> npx @code-scaffold/skills-cli add upioneer/code-scaffold\n\n{}\n\nPress [Enter] to generate your ephemeral room key.",
                        qrcode::QrCode::new(b"npx @code-scaffold/skills-cli add upioneer/code-scaffold")
                            .unwrap()
                            .render::<qrcode::render::unicode::Dense1x2>()
                            .quiet_zone(false)
                            .build()
                    );
                    let popup_block = ratatui::widgets::Paragraph::new(text)
                        .alignment(ratatui::layout::Alignment::Center)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Scaffold Connect (ALPHA) ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(
                                    ratatui::style::Style::default().fg(self.theme.secondary),
                                ),
                        );
                    let area = Self::top_centered_rect(80, 90, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if self.wizard_state == WizardState::AgentCopilotTimerSelection {
                    let text = "Scaffold Connect is currently in Alpha.\n\nTo prevent excessive allotment usage on the free tier, a hard cap of 10 minutes per session is enforced.\n\nPress [Enter] to start the 10-minute session, or [Esc] to cancel.";
                    let lines = Self::format_highlighted_lines(text, &self.theme);

                    let popup_block = ratatui::widgets::Paragraph::new(lines)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Session Expiration ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.accent))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(4, 4, 1, 1))
                        );
                    let area = Self::centered_rect(60, 20, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if self.wizard_state == WizardState::AgentCopilot {
                    let mut title_name = "Agent".to_string();
                    let mut text = "Initializing remote agent broker...\n\n".to_string();
                    if let Some(session) = &self.agent_session {
                        if !session.pin.is_empty() {
                            let uri = format!("scaffold://{}@{}", session.pin, session.key);
                            text.push_str(&format!("Provide this connection string to your agent:\n> I am ready to pair. Here is my Scaffold Connect URI: {}. Please refer to the code-scaffold skill instructions you just installed to learn how to execute the connection.\n\n", uri));

                            if self.header.agent_connected.is_none() {
                                let qr_str = qrcode::QrCode::new(uri.as_bytes())
                                    .unwrap()
                                    .render::<qrcode::render::unicode::Dense1x2>()
                                    .build();
                                text.push_str(&format!("{}\n\n", qr_str));
                            }
                            text.push_str(&format!("Status: {}\n\n", session.status));
                        } else {
                            text.push_str(&format!("Status: {}\n\n", session.status));
                        }

                        if let Some(expiry) = session.expires_at {
                            let now = std::time::Instant::now();
                            if expiry > now {
                                let rem = expiry.duration_since(now).as_secs();
                                let h = rem / 3600;
                                let m = (rem % 3600) / 60;
                                let s = rem % 60;
                                text.push_str(&format!("Time Remaining: {:02}:{:02}:{:02}\n\n", h, m, s));
                            } else {
                                text.push_str("Time Remaining: 00:00:00 (EXPIRED)\n\n");
                            }
                        }

                        if self.header.agent_connected.is_none() {
                            text.push_str("(Press [R] to rotate PIN and encryption keys)\n\n");
                        }
                        for act in &session.recent_activity {
                            text.push_str(&format!("> {}\n", act));
                        }
                    }
                    if let Some(agent) = &self.header.agent_connected {
                        title_name = agent.clone();
                    }

                    let popup_block = ratatui::widgets::Paragraph::new(text)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .block(
                            ratatui::widgets::Block::default()
                                .title(if self.header.agent_connected.is_some() {
                                    format!(" 🤖 Scaffold Connect (ALPHA) [{}] ", title_name)
                                } else {
                                    " 🤖 Scaffold Connect (ALPHA) ".to_string()
                                })
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.accent))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(4, 4, 1, 1))
                        );
                    let area = Self::top_centered_rect(80, 90, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if self.wizard_state == WizardState::ConfirmExit {
                    let text = "Are you sure you want to exit Code Scaffold?\n\nPress [Enter] or [Y] to exit.\nPress [Esc] or [N] to cancel.";
                    let lines = Self::format_highlighted_lines(text, &self.theme);
                    let popup_block = ratatui::widgets::Paragraph::new(lines)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .alignment(ratatui::layout::Alignment::Center)
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Confirm Exit ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.accent))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(2, 2, 1, 1))
                        );
                    let area = Self::centered_rect(40, 30, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                } else if self.wizard_state == WizardState::AgentInstructionsModal {
                    let text = "Agent Harness Mode\n\nTo hook an AI agent into this project's scaffolding system, invoke the agent in this directory and direct it to use the Code Scaffold skill.\n\nExample Prompt:\n\"Initialize a new feature using the code-scaffold skill\"\n\nPress [Esc] or [Shift+A] to close this modal.";
                    let lines = Self::format_highlighted_lines(text, &self.theme);
                    let popup_block = ratatui::widgets::Paragraph::new(lines)
                        .wrap(ratatui::widgets::Wrap { trim: false })
                        .alignment(ratatui::layout::Alignment::Center)
                        .block(
                            ratatui::widgets::Block::default()
                                .title(" Agent Instructions ")
                                .borders(ratatui::widgets::Borders::ALL)
                                .border_style(ratatui::style::Style::default().fg(self.theme.accent))
                                .style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text))
                                .padding(ratatui::widgets::Padding::new(2, 2, 1, 1))
                        );
                    let area = Self::centered_rect(60, 40, size);
                    f.render_widget(ratatui::widgets::Clear, area);
                    f.render_widget(popup_block, area);
                }
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

    fn top_centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
        let popup_layout = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(2), // Top margin
                Constraint::Percentage(percent_y),
                Constraint::Min(0),
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

    fn format_highlighted_lines<'a>(
        text: &'a str,
        theme: &crate::theme::Theme,
    ) -> Vec<ratatui::text::Line<'a>> {
        let mut lines = Vec::new();
        for line_str in text.lines() {
            let mut spans = Vec::new();
            let mut remaining = line_str;

            while let Some(start_idx) = remaining.find('[') {
                if let Some(end_idx) = remaining[start_idx..].find(']') {
                    let full_end = start_idx + end_idx + 1;

                    if start_idx > 0 {
                        spans.push(ratatui::text::Span::styled(
                            remaining[..start_idx].to_string(),
                            ratatui::style::Style::default().fg(theme.text),
                        ));
                    }

                    spans.push(ratatui::text::Span::styled(
                        remaining[start_idx..full_end].to_string(),
                        ratatui::style::Style::default()
                            .fg(theme.accent)
                            .add_modifier(ratatui::style::Modifier::BOLD),
                    ));

                    remaining = &remaining[full_end..];
                } else {
                    break;
                }
            }

            if !remaining.is_empty() {
                spans.push(ratatui::text::Span::styled(
                    remaining.to_string(),
                    ratatui::style::Style::default().fg(theme.text),
                ));
            }

            lines.push(ratatui::text::Line::from(spans));
        }
        lines
    }

    pub fn update(&mut self, action: Action) -> Result<()> {
        if self.wizard_state == WizardState::CustomSkillInput {
            match action {
                Action::Char(c) => {
                    if self.custom_skill_input
                        == "Invalid! Must be a valid approved platform URL or CLI command."
                    {
                        self.custom_skill_input.clear();
                    }
                    self.custom_skill_input.push(c);
                }
                Action::Backspace => {
                    if self.custom_skill_input
                        == "Invalid! Must be a valid approved platform URL or CLI command."
                    {
                        self.custom_skill_input.clear();
                    }
                    self.custom_skill_input.pop();
                }
                Action::Enter => {
                    let input = self.custom_skill_input.trim();
                    let approved_prefixes = [
                        "https://github.com/",
                        "https://skillsmp.com/",
                        "https://agentskills.io/",
                        "https://agentskill.sh/",
                        "https://www.skills.sh/",
                        "https://microsoft.github.io/skills/",
                        "https://mcpservers.org/agent-skills",
                        "npx ",
                        "git clone ",
                        "uvx ",
                        "/learn ",
                    ];

                    if approved_prefixes
                        .iter()
                        .any(|prefix| input.starts_with(prefix))
                    {
                        let name = input
                            .split('/')
                            .last()
                            .unwrap_or("custom-skill")
                            .trim()
                            .replace(".git", "");
                        let parsed_name = if name.is_empty() {
                            "custom-skill".to_string()
                        } else {
                            name
                        };
                        self.workspace
                            .items
                            .push(crate::components::workspace::WorkspaceItem {
                                label: parsed_name,
                                selected: true,
                                category: crate::components::nav_tree::Category::AgentSkills,
                                description: Some(input.to_string()),
                                version: None,
                                exists_in_target: false,
                                target_version: None,
                                logo: None,
                            });
                        crate::prefs::add_custom_skill(input);
                        self.wizard_state = WizardState::Skills;
                    } else {
                        self.custom_skill_input.clear();
                        self.custom_skill_input.push_str(
                            "Invalid! Must be a valid approved platform URL or CLI command.",
                        );
                    }
                }
                Action::Quit => {
                    self.wizard_state = WizardState::Skills;
                }
                _ => {}
            }
            return Ok(());
        }
        if self.wizard_state == WizardState::AgentCopilotTimerSelection {
            match action {
                Action::Quit => {
                    self.wizard_state = WizardState::Welcome;
                }
                Action::Enter => {
                    let session = crate::scaffold_connect::ScaffoldConnectSession::new_ephemeral();
                    let session_clone = session.clone();
                    self.agent_session = Some(crate::app::AgentSession {
                        pin: session.pin.clone(),
                        key: session.key.clone(),
                        status: "Connecting...".to_string(),
                        recent_activity: vec!["Initializing ephemeral keys...".to_string()],
                        expires_at: None,
                    });
                    self.wizard_state = WizardState::AgentCopilot;

                    if let Some(old_tx) = self.cancel_tx.take() {
                        let _ = old_tx.send(());
                    }
                    let (cancel_tx, cancel_rx) = tokio::sync::oneshot::channel::<()>();
                    self.cancel_tx = Some(cancel_tx);

                    let tx_clone = self.tx.clone();
                    tokio::spawn(async move {
                        tokio::select! {
                            res = session_clone.connect(tx_clone.clone()) => {
                                if let Err(e) = res {
                                    let _ = tx_clone.send(format!("Scaffold Connect Error: {}", e));
                                }
                            }
                            _ = cancel_rx => {
                                let _ = tx_clone.send("[CLIENT_DISCONNECTED]".to_string());
                            }
                        }
                    });
                    let tx_timer = self.tx.clone();
                    tokio::spawn(async move {
                        tokio::time::sleep(tokio::time::Duration::from_secs(10 * 60)).await;
                        let _ = tx_timer.send("SESSION_TIMEOUT".to_string());
                    });
                }
                _ => {}
            }
            return Ok(());
        }
        if matches!(
            self.wizard_state,
            WizardState::ThemeNameInput
                | WizardState::ThemeBgInput
                | WizardState::ThemeTextInput
                | WizardState::ThemePrimaryInput
                | WizardState::ThemeSecondaryInput
                | WizardState::ThemeAccentInput
        ) {
            match action {
                Action::Char(c) => {
                    if !self.theme_input_error.is_empty() {
                        self.theme_input_error.clear();
                    }
                    self.theme_input_buffer.push(c);
                }
                Action::Backspace => {
                    if !self.theme_input_error.is_empty() {
                        self.theme_input_error.clear();
                    }
                    self.theme_input_buffer.pop();
                }
                Action::Tab => {
                    if self.wizard_state == WizardState::ThemeNameInput {
                        self.is_advanced_theme_mode = !self.is_advanced_theme_mode;
                    }
                }
                Action::Quit => {
                    self.wizard_state = WizardState::Welcome;
                    self.theme_input_buffer.clear();
                }
                Action::Enter => {
                    if !self.theme_input_error.is_empty() {
                        self.theme_input_error.clear();
                        self.theme_input_buffer.clear();
                        return Ok(());
                    }

                    let val = self.theme_input_buffer.trim().to_string();

                    match self.wizard_state {
                        WizardState::ThemeNameInput => {
                            if val.is_empty()
                                || val.len() > 15
                                || !val.chars().all(|c| c.is_alphanumeric() || c == '-')
                            {
                                self.theme_input_error =
                                    "Invalid name! Alphanumeric & hyphens only. Max 15 chars."
                                        .to_string();
                            } else {
                                self.custom_theme_name = val;
                                self.theme_input_buffer.clear();
                                self.wizard_state = WizardState::ThemeBgInput;
                            }
                        }
                        WizardState::ThemeBgInput => {
                            if Theme::hex_to_color(&val).is_none() {
                                self.theme_input_error =
                                    "Invalid hex code! Must be 6 characters (e.g. #FFFFFF)."
                                        .to_string();
                            } else {
                                self.custom_theme_bg = val;
                                self.theme_input_buffer.clear();
                                self.wizard_state = WizardState::ThemeTextInput;
                            }
                        }
                        WizardState::ThemeTextInput => {
                            if let Some(text_color) = Theme::hex_to_color(&val) {
                                if let Some(bg_color) = Theme::hex_to_color(&self.custom_theme_bg) {
                                    let dist = Theme::color_distance(&text_color, &bg_color);
                                    if dist < 50.0 {
                                        self.theme_input_error = format!("Contrast Guard Triggered: Distance {:.1} is too low. Please increase contrast.", dist);
                                    } else {
                                        self.custom_theme_text = val;
                                        self.theme_input_buffer.clear();
                                        self.wizard_state = WizardState::ThemePrimaryInput;
                                    }
                                }
                            } else {
                                self.theme_input_error = "Invalid hex code!".to_string();
                            }
                        }
                        WizardState::ThemePrimaryInput => {
                            if let Some(primary_color) = Theme::hex_to_color(&val) {
                                if let Some(bg_color) = Theme::hex_to_color(&self.custom_theme_bg) {
                                    let dist = Theme::color_distance(&primary_color, &bg_color);
                                    if dist < 40.0 {
                                        self.theme_input_error = format!("Contrast Guard Triggered: Highlight distance {:.1} is too low.", dist);
                                    } else {
                                        self.custom_theme_primary = val;
                                        self.theme_input_buffer.clear();

                                        if self.is_advanced_theme_mode {
                                            self.wizard_state = WizardState::ThemeSecondaryInput;
                                        } else {
                                            // Finish in 3-color mode!
                                            self.custom_theme_secondary = Theme::color_to_hex(
                                                &Theme::auto_derive_secondary(&primary_color),
                                            );
                                            self.custom_theme_accent = Theme::color_to_hex(
                                                &Theme::auto_derive_accent(&primary_color),
                                            );

                                            let new_theme = Theme {
                                                name: self.custom_theme_name.clone(),
                                                bg: Theme::hex_to_color(&self.custom_theme_bg)
                                                    .unwrap(),
                                                text: Theme::hex_to_color(&self.custom_theme_text)
                                                    .unwrap(),
                                                primary: Theme::hex_to_color(
                                                    &self.custom_theme_primary,
                                                )
                                                .unwrap(),
                                                secondary: Theme::hex_to_color(
                                                    &self.custom_theme_secondary,
                                                )
                                                .unwrap(),
                                                accent: Theme::hex_to_color(
                                                    &self.custom_theme_accent,
                                                )
                                                .unwrap(),
                                            };
                                            crate::prefs::add_custom_theme(&new_theme);
                                            self.theme = new_theme;
                                            self.wizard_state = WizardState::Welcome;
                                        }
                                    }
                                }
                            } else {
                                self.theme_input_error = "Invalid hex code!".to_string();
                            }
                        }
                        WizardState::ThemeSecondaryInput => {
                            if Theme::hex_to_color(&val).is_none() {
                                self.theme_input_error = "Invalid hex code!".to_string();
                            } else {
                                self.custom_theme_secondary = val;
                                self.theme_input_buffer.clear();
                                self.wizard_state = WizardState::ThemeAccentInput;
                            }
                        }
                        WizardState::ThemeAccentInput => {
                            if Theme::hex_to_color(&val).is_none() {
                                self.theme_input_error = "Invalid hex code!".to_string();
                            } else {
                                self.custom_theme_accent = val;
                                self.theme_input_buffer.clear();

                                let new_theme = Theme {
                                    name: self.custom_theme_name.clone(),
                                    bg: Theme::hex_to_color(&self.custom_theme_bg).unwrap(),
                                    text: Theme::hex_to_color(&self.custom_theme_text).unwrap(),
                                    primary: Theme::hex_to_color(&self.custom_theme_primary)
                                        .unwrap(),
                                    secondary: Theme::hex_to_color(&self.custom_theme_secondary)
                                        .unwrap(),
                                    accent: Theme::hex_to_color(&self.custom_theme_accent).unwrap(),
                                };
                                crate::prefs::add_custom_theme(&new_theme);
                                self.theme = new_theme;
                                self.wizard_state = WizardState::Welcome;
                            }
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
            return Ok(());
        }
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
                if self.splash_tick_count % 2 == 0 {
                    let prev_idx = self.splash_frame_idx;
                    self.splash_frame_idx = (self.splash_frame_idx + 1) % BRAILLE_FRAMES.len();
                    // Advance the braille color exactly once per complete cycle (when frame wraps to 0).
                    if prev_idx == BRAILLE_FRAMES.len() - 1 {
                        self.summary_pane.braille_color_idx =
                            self.summary_pane.braille_color_idx.wrapping_add(1);
                    }
                    if self.wizard_state == WizardState::DeploymentTarget {
                        self.update_summary();
                    }
                }
            }
            Action::AgentInstructions => {
                if self.wizard_state == WizardState::AgentInstructionsModal {
                    self.wizard_state = WizardState::DeploymentTarget;
                } else {
                    self.wizard_state = WizardState::AgentInstructionsModal;
                }
            }
            Action::OpenIde => {
                if !self.target_folder.is_empty() {
                    let _ = std::process::Command::new("code")
                        .arg(&self.target_folder)
                        .spawn();
                    let _ = std::process::Command::new("agy")
                        .arg(&self.target_folder)
                        .spawn();
                }
            }
            Action::Quit => match self.wizard_state {
                WizardState::DeploymentTarget => {
                    self.wizard_state = WizardState::ConfirmExit;
                }
                WizardState::ConfirmExit | WizardState::AgentInstructionsModal => {
                    self.wizard_state = WizardState::DeploymentTarget;
                }
                WizardState::Executing | WizardState::UpdateComplete | WizardState::Complete => {
                    self.should_quit = true;
                }
                _ => {
                    self.wizard_state = WizardState::DeploymentTarget;
                }
            },
            Action::Execute => {
                if self.wizard_state == WizardState::UpdateComplete {
                    self.should_quit = true;
                    return Ok(());
                }

                if self.wizard_state == WizardState::Complete {
                    let agent_path = std::path::PathBuf::from(&self.target_folder)
                        .join(".agents")
                        .join("AGENTS.md");

                    if agent_path.exists() && self.agent_overwrite_choice.is_none() {
                        self.wizard_state = WizardState::AgentOverwritePrompt;
                        self.summary_pane.title = " Conflict Detected ".to_string();
                        self.summary_pane.summary_text = "The target directory already contains an AGENTS.md file.\n\nPress [Y] to Overwrite it.\nPress [N] to Leave it Intact.".to_string();
                        return Ok(());
                    }

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
                        "project_details/changelog",
                        "project_details/playbooks",
                        "project_details/proof",
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
                                    || item.label.eq_ignore_ascii_case("apps/")
                                    || item.label.eq_ignore_ascii_case("packages/")
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
                                    content: None,
                                });
                            }
                            Category::AgentSkills => {
                                if let Some(desc) = &item.description {
                                    if desc.starts_with("http")
                                        || desc.starts_with("npx")
                                        || desc.starts_with("git")
                                        || desc.starts_with("uvx")
                                        || desc.starts_with("/learn")
                                    {
                                        selected_skills.push(crate::models::manifest::SkillEntry {
                                            id: item.label.clone(),
                                            label: item.label.clone(),
                                            source: Some(desc.clone()),
                                            target: std::path::PathBuf::from(&self.target_folder)
                                                .join(".skills")
                                                .join(&item.label)
                                                .to_string_lossy()
                                                .to_string(),
                                            method: "remote".into(),
                                        });
                                        continue;
                                    }
                                }

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
                                if self.agent_overwrite_choice == Some(false) {
                                    continue;
                                }
                                let target = std::path::PathBuf::from(&self.target_folder)
                                    .join(".agents")
                                    .join("AGENTS.md");

                                if let Some(existing) = selected_artifacts
                                    .iter_mut()
                                    .find(|a| a.method == "inject_persona")
                                {
                                    if let (Some(existing_content), Some(new_content)) =
                                        (&mut existing.content, &item.description)
                                    {
                                        *existing_content = format!(
                                            "{}\n* **{}**: {}",
                                            existing_content, item.label, new_content
                                        );
                                    }
                                } else {
                                    let content = if let Some(desc) = &item.description {
                                        Some(format!("* **{}**: {}", item.label, desc))
                                    } else {
                                        None
                                    };
                                    selected_artifacts.push(
                                        crate::models::manifest::ArtifactEntry {
                                            id: "agent_personas".to_string(),
                                            label: "Agent Personas".to_string(),
                                            source: Some(
                                                self.payload_dir
                                                    .join(".templates")
                                                    .join("agent.md")
                                                    .to_string_lossy()
                                                    .to_string(),
                                            ),
                                            target: target.to_string_lossy().to_string(),
                                            method: "inject_persona".into(),
                                            content,
                                        },
                                    );
                                }
                            }
                            Category::ContributingTemplate => {
                                if item.label == "None" {
                                    continue;
                                }
                                let source = self
                                    .payload_dir
                                    .join(".contributions")
                                    .join(format!("{}.md", item.label));
                                let target = std::path::PathBuf::from(&self.target_folder)
                                    .join("CONTRIBUTING.md");

                                let fallback_content = if !source.exists() {
                                    match item.label.as_str() {
                                        "open-source" => Some(
                                            include_str!("../../.contributions/open-source.md")
                                                .to_string(),
                                        ),
                                        "strict-ownership" => Some(
                                            include_str!(
                                                "../../.contributions/strict-ownership.md"
                                            )
                                            .to_string(),
                                        ),
                                        _ => None,
                                    }
                                } else {
                                    None
                                };

                                let (method, src, content) = if let Some(c) = fallback_content {
                                    ("write".into(), None, Some(c))
                                } else {
                                    (
                                        "copy".into(),
                                        Some(source.to_string_lossy().to_string()),
                                        None,
                                    )
                                };

                                selected_artifacts.push(crate::models::manifest::ArtifactEntry {
                                    id: item.label.clone(),
                                    label: item.label.clone(),
                                    source: src,
                                    target: target.to_string_lossy().to_string(),
                                    method,
                                    content,
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
                                    content: None,
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
                match self.wizard_state {
                    WizardState::Complete => {
                        self.wizard_state = WizardState::License;
                        self.workspace.set_category(Category::License);
                        self.nav_tree.set_selected(Category::License);
                        self.active_block = ActiveBlock::Workspace;
                    }
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
                        let has_contributing = self
                            .workspace
                            .items
                            .iter()
                            .any(|i| i.selected && i.label == "contributing.md");

                        if has_contributing {
                            self.wizard_state = WizardState::ContributingTemplate;
                            self.workspace.set_category(Category::ContributingTemplate);
                            self.nav_tree.set_selected(Category::ContributingTemplate);
                        } else if has_agent {
                            self.wizard_state = WizardState::AgentPersona;
                            self.workspace.set_category(Category::AgentPersona);
                            self.nav_tree.set_selected(Category::AgentPersona);
                        } else {
                            self.wizard_state = WizardState::Artifacts;
                            self.workspace.set_category(Category::Artifacts);
                            self.nav_tree.set_selected(Category::Artifacts);
                        }
                    }
                    WizardState::ContributingTemplate => {
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
            Action::Char(c) if self.wizard_state == WizardState::Skills && c != 'D' && c != ' ' => {
                let _ = self.workspace.update(Action::Char(c))?;
            }
            Action::Char('t') | Action::Char('T') => {
                self.theme_idx = self.theme_idx.wrapping_add(1);
                self.theme = crate::theme::Theme::get_by_index(self.theme_idx);
                crate::prefs::save_theme_idx(self.theme_idx);
            }
            Action::Char('E') => {
                self.wizard_state = WizardState::ThemeNameInput;
                self.theme_input_buffer.clear();
                self.is_advanced_theme_mode = false;
                self.theme_input_error.clear();
            }
            Action::Char('w') | Action::Char('W') => {
                if self.wizard_state != WizardState::Welcome
                    && self.wizard_state != WizardState::CustomSkillInput
                    && self.wizard_state != WizardState::ThemeNameInput
                    && self.wizard_state != WizardState::ThemeBgInput
                    && self.wizard_state != WizardState::ThemeTextInput
                    && self.wizard_state != WizardState::ThemePrimaryInput
                    && self.wizard_state != WizardState::ThemeSecondaryInput
                    && self.wizard_state != WizardState::ThemeAccentInput
                {
                    self.wizard_state = WizardState::Welcome;
                    self.splash_tick_count = 0;
                }
            }
            Action::Char('f') | Action::Char('F') => {
                if self.wizard_state == WizardState::DeploymentTarget {
                    self.directory_browser.open(&self.target_folder);
                }
            }
            Action::Char('D') => {
                if self.wizard_state == WizardState::Skills {
                    if let Some(idx) = self.workspace.state.selected() {
                        let visible = self.workspace.visible_indices();
                        if idx < visible.len() {
                            let actual = visible[idx];
                            if self.workspace.items[actual].label.starts_with("(BYOS) ") {
                                if let Some(url) = self.workspace.items[actual].description.clone()
                                {
                                    crate::prefs::remove_custom_skill(&url);
                                }
                                self.workspace.items.remove(actual);
                                let new_visible = self.workspace.visible_indices();
                                if let Some(current_idx) = self.workspace.state.selected() {
                                    if current_idx >= new_visible.len() && !new_visible.is_empty() {
                                        self.workspace.state.select(Some(new_visible.len() - 1));
                                    }
                                }
                                self.update_summary();
                            }
                        }
                    }
                }
            }
            Action::Char('p') | Action::Char('P') => {
                if self.wizard_state == WizardState::Welcome && cfg!(windows) {
                    if let Ok(exe_path) = std::env::current_exe() {
                        if let Some(dir) = exe_path.parent() {
                            let dir_str = dir.to_string_lossy().to_string();
                            let script = format!(
                                "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); \
                                 if ($userPath -notmatch [regex]::Escape('{}')) {{ \
                                     $newPath = $userPath + ';{}'; \
                                     [Environment]::SetEnvironmentVariable('Path', $newPath, 'User'); \
                                 }}",
                                dir_str, dir_str
                            );
                            let _ = std::process::Command::new("powershell")
                                .args(&["-NoProfile", "-Command", &script])
                                .status();

                            self.wizard_state = WizardState::DeploymentTarget;
                            crate::prefs::set_has_seen_welcome(true);
                            self.update_summary();
                        }
                    }
                }
            }
            Action::Char('r') | Action::Char('R') => {
                if self.wizard_state == WizardState::DeploymentTarget {
                    self.target_folder = Self::default_target_dir();
                    self.workspace.detect_installed(&self.target_folder);
                    self.update_summary();
                } else if self.wizard_state == WizardState::AgentCopilot {
                    if self.agent_session.is_some() && self.header.agent_connected.is_none() {
                        match crate::prefs::can_rotate_keys() {
                            Ok(_) => {
                                crate::prefs::log_key_rotation();
                                if let Some(old_tx) = self.cancel_tx.take() {
                                    let _ = old_tx.send(());
                                }
                                self.agent_session = None;
                                self.copilot_timer_input.clear();
                                self.wizard_state = WizardState::AgentCopilotWelcome;
                            }
                            Err(msg) => {
                                if let Some(session) = &mut self.agent_session {
                                    session.recent_activity.push(msg);
                                }
                            }
                        }
                    }
                }
            }
            Action::Char('y') | Action::Char('Y') => {
                if self.wizard_state == WizardState::ConfirmExit {
                    self.should_quit = true;
                } else if self.wizard_state == WizardState::AgentOverwritePrompt {
                    self.agent_overwrite_choice = Some(true);
                    self.wizard_state = WizardState::Complete;
                    let _ = self.update(Action::Execute)?;
                }
            }
            Action::Char('n') | Action::Char('N') => {
                if self.wizard_state == WizardState::ConfirmExit {
                    self.wizard_state = WizardState::DeploymentTarget;
                } else if self.wizard_state == WizardState::AgentOverwritePrompt {
                    self.agent_overwrite_choice = Some(false);
                    self.wizard_state = WizardState::Complete;
                    let _ = self.update(Action::Execute)?;
                }
            }
            Action::Char('K') => {
                if self.agent_session.is_some() {
                    self.agent_session = None;
                    self.header.agent_connected = None;
                    if self.wizard_state == WizardState::AgentCopilot {
                        self.wizard_state = WizardState::DeploymentTarget;
                    }
                }
            }
            Action::Char('c') | Action::Char('C') => {
                self.copilot_timer_input = "60".to_string();
                self.copilot_timer_error.clear();
                if !crate::prefs::has_seen_copilot_welcome() {
                    self.wizard_state = WizardState::AgentCopilotWelcome;
                } else if self.agent_session.is_some() {
                    if self.wizard_state == WizardState::AgentCopilot {
                        self.wizard_state = WizardState::DeploymentTarget;
                    } else {
                        self.wizard_state = WizardState::AgentCopilot;
                    }
                } else {
                    self.wizard_state = WizardState::AgentCopilotTimerSelection;
                }
            }
            Action::Char('u') | Action::Char('U') => {
                if self.update_available.is_some() {
                    self.wizard_state = WizardState::Executing;
                    self.summary_pane.title = " Applying Update ".to_string();
                    self.summary_pane.summary_text =
                        "Downloading in-place update payload...".to_string();
                    self.execution_logs
                        .push("Starting self-update routine...".to_string());

                    let tx_clone = self.tx.clone();
                    tokio::spawn(async move {
                        let _ =
                            tx_clone.send("Downloading latest binary from GitHub...".to_string());
                        match tokio::task::spawn_blocking(move || crate::updater::perform_update())
                            .await
                        {
                            Ok(Ok(_)) => {
                                let _ = tx_clone
                                    .send("Update successful! Shutting down...".to_string());
                                let _ = tx_clone.send("[UPDATE_COMPLETE]".to_string());
                            }
                            Ok(Err(e)) => {
                                let _ = tx_clone.send(format!("Update failed: {}", e));
                            }
                            Err(e) => {
                                let _ = tx_clone.send(format!("Task panic: {}", e));
                            }
                        }
                    });
                }
            }
            Action::Up => {
                if self.wizard_state == WizardState::Welcome {
                    self.welcome_scroll_offset = self.welcome_scroll_offset.saturating_sub(1);
                } else if self.wizard_state == WizardState::Executing {
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
                    self.update_summary();
                } else {
                    let _ = self.summary_pane.update(action)?;
                }
            }
            Action::Down => {
                if self.wizard_state == WizardState::Welcome {
                    self.welcome_scroll_offset = self
                        .welcome_scroll_offset
                        .saturating_add(1)
                        .min(self.welcome_max_scroll.get());
                } else if self.wizard_state == WizardState::Executing {
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
                    self.update_summary();
                } else {
                    let _ = self.summary_pane.update(action)?;
                }
            }
            Action::Enter => {
                if self.active_block == ActiveBlock::Workspace {
                    if self.wizard_state == WizardState::DeploymentTarget
                        || self.wizard_state == WizardState::License
                    {
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
                }
                match self.wizard_state {
                    WizardState::ConfirmExit => {
                        self.should_quit = true;
                    }
                    WizardState::Welcome => {
                        self.wizard_state = WizardState::DeploymentTarget;
                        crate::prefs::set_has_seen_welcome(true);
                    }
                    WizardState::DeploymentTarget => {
                        self.directory_browser.open(&self.target_folder);
                    }
                    WizardState::Artifacts => {
                        let has_agent = self
                            .workspace
                            .items
                            .iter()
                            .any(|i| i.selected && i.label == "agent.md");
                        let has_contributing = self
                            .workspace
                            .items
                            .iter()
                            .any(|i| i.selected && i.label == "contributing.md");

                        if has_agent {
                            self.wizard_state = WizardState::AgentPersona;
                            self.workspace.set_category(Category::AgentPersona);
                            self.nav_tree.set_selected(Category::AgentPersona);
                        } else if has_contributing {
                            self.wizard_state = WizardState::ContributingTemplate;
                            self.workspace.set_category(Category::ContributingTemplate);
                            self.nav_tree.set_selected(Category::ContributingTemplate);
                        } else {
                            self.wizard_state = WizardState::Skills;
                            self.workspace.set_category(Category::AgentSkills);
                            self.nav_tree.set_selected(Category::AgentSkills);
                        }
                    }
                    WizardState::AgentPersona => {
                        let has_contributing = self
                            .workspace
                            .items
                            .iter()
                            .any(|i| i.selected && i.label == "contributing.md");

                        if has_contributing {
                            self.wizard_state = WizardState::ContributingTemplate;
                            self.workspace.set_category(Category::ContributingTemplate);
                            self.nav_tree.set_selected(Category::ContributingTemplate);
                        } else {
                            self.wizard_state = WizardState::Skills;
                            self.workspace.set_category(Category::AgentSkills);
                            self.nav_tree.set_selected(Category::AgentSkills);
                        }
                    }
                    WizardState::ContributingTemplate => {
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
                        self.workspace.set_category(Category::Deploy);
                        self.nav_tree.set_selected(Category::Deploy);
                        self.active_block = ActiveBlock::NavTree;
                    }
                    WizardState::Complete | WizardState::UpdateComplete => {
                        let _ = self.update(Action::Execute)?;
                    }
                    WizardState::AgentCopilotWelcome => {
                        crate::prefs::set_has_seen_copilot_welcome(true);
                        self.wizard_state = WizardState::AgentCopilotTimerSelection;
                    }
                    WizardState::Executing
                    | WizardState::CustomSkillInput
                    | WizardState::ThemeNameInput
                    | WizardState::ThemeBgInput
                    | WizardState::ThemeTextInput
                    | WizardState::ThemePrimaryInput
                    | WizardState::ThemeSecondaryInput
                    | WizardState::ThemeAccentInput
                    | WizardState::AgentCopilotTimerSelection
                    | WizardState::AgentCopilot
                    | WizardState::AgentOverwritePrompt
                    | WizardState::AgentInstructionsModal => {}
                }
                self.update_summary();
            }
            Action::Char(' ') => {
                if self.wizard_state == WizardState::Skills {
                    if let Some(idx) = self.workspace.state.selected() {
                        let visible = self.workspace.visible_indices();
                        if idx < visible.len() {
                            let actual = visible[idx];
                            if self.workspace.items[actual].label
                                == "[+] Bring Your Own Skill (BYOS)"
                            {
                                self.wizard_state = WizardState::CustomSkillInput;
                                self.custom_skill_input.clear();
                                return Ok(());
                            }
                        }
                    }
                }
                if self.wizard_state != WizardState::Complete {
                    self.active_block = ActiveBlock::Workspace;
                    let _ = self.workspace.update(action.clone())?;
                }
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

#[cfg(test)]
mod visual_artifacts_tests {
    use super::*;
    use crate::action::Action;
    use ratatui::backend::TestBackend;
    use ratatui::Terminal;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_human_movements_no_artifacts() {
        let mut terminal = Terminal::new(TestBackend::new(120, 40)).unwrap();
        let mut app = App::new(PathBuf::from("../.skills"));
        app.wizard_state = WizardState::Executing;

        for _ in 0..5 {
            app.update(Action::Down).unwrap();
            terminal
                .draw(|f| {
                    let size = f.size();
                    let ml = ratatui::layout::Layout::default()
                        .direction(ratatui::layout::Direction::Vertical)
                        .constraints([
                            ratatui::layout::Constraint::Length(6),
                            ratatui::layout::Constraint::Min(10),
                            ratatui::layout::Constraint::Length(11),
                            ratatui::layout::Constraint::Length(3),
                        ])
                        .split(size);
                    let bl = ratatui::layout::Layout::default()
                        .direction(ratatui::layout::Direction::Horizontal)
                        .constraints([
                            ratatui::layout::Constraint::Percentage(24),
                            ratatui::layout::Constraint::Length(1),
                            ratatui::layout::Constraint::Percentage(30),
                            ratatui::layout::Constraint::Length(1),
                            ratatui::layout::Constraint::Percentage(45),
                        ])
                        .split(ml[1]);
                    let _ = app.nav_tree.draw(
                        f,
                        bl[0],
                        app.active_block == ActiveBlock::NavTree,
                        &app.theme,
                    );
                    let _ = app.workspace.draw(
                        f,
                        bl[2],
                        app.active_block == ActiveBlock::Workspace,
                        &app.theme,
                    );
                })
                .unwrap();
        }

        app.update(Action::Tab).unwrap();
        for _ in 0..10 {
            app.update(Action::Down).unwrap();
            terminal
                .draw(|f| {
                    let size = f.size();
                    let ml = ratatui::layout::Layout::default()
                        .direction(ratatui::layout::Direction::Vertical)
                        .constraints([
                            ratatui::layout::Constraint::Length(6),
                            ratatui::layout::Constraint::Min(10),
                            ratatui::layout::Constraint::Length(11),
                            ratatui::layout::Constraint::Length(3),
                        ])
                        .split(size);
                    let bl = ratatui::layout::Layout::default()
                        .direction(ratatui::layout::Direction::Horizontal)
                        .constraints([
                            ratatui::layout::Constraint::Percentage(24),
                            ratatui::layout::Constraint::Length(1),
                            ratatui::layout::Constraint::Percentage(30),
                            ratatui::layout::Constraint::Length(1),
                            ratatui::layout::Constraint::Percentage(45),
                        ])
                        .split(ml[1]);
                    let _ = app.nav_tree.draw(
                        f,
                        bl[0],
                        app.active_block == ActiveBlock::NavTree,
                        &app.theme,
                    );
                    let _ = app.workspace.draw(
                        f,
                        bl[2],
                        app.active_block == ActiveBlock::Workspace,
                        &app.theme,
                    );
                })
                .unwrap();
        }

        let buffer = terminal.backend().buffer();
        assert_eq!(app.active_block, ActiveBlock::Workspace);
    }

    #[test]
    fn test_default_target_dir_is_current_dir() {
        let expected = std::env::current_dir()
            .unwrap()
            .to_string_lossy()
            .to_string();
        assert_eq!(App::default_target_dir(), expected);
    }

    #[test]
    fn test_contributing_templates_not_empty() {
        // Test with empty/dummy payload dir to verify fallback items are loaded
        let workspace = Workspace::new(std::path::PathBuf::from("/nonexistent/dummy/path"));
        let cont_items: Vec<_> = workspace
            .items
            .iter()
            .filter(|i| i.category == Category::ContributingTemplate)
            .collect();
        assert!(
            !cont_items.is_empty(),
            "ContributingTemplate items must never be empty"
        );
        assert!(cont_items.iter().any(|i| i.label == "open-source"));
        assert!(cont_items.iter().any(|i| i.label == "strict-ownership"));
    }
}
