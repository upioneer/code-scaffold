use crate::action::Action;
use crate::theme::Theme;
use crate::components::{
    footer::Footer, header::Header, logger_pipe::LoggerPipe, nav_tree::NavTree,
    workspace::Workspace, Component,
};
use crate::tui::{handle_terminal_events, Tui};
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout};
use std::sync::mpsc;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActiveBlock {
    NavTree,
    Workspace,
    LoggerPipe,
}

pub struct App {
    pub should_quit: bool,
    pub active_block: ActiveBlock,
    pub theme: Theme,
    header: Header,
    nav_tree: NavTree,
    workspace: Workspace,
    logger_pipe: LoggerPipe,
    footer: Footer,
    tx: mpsc::Sender<String>,
}

impl App {
    pub fn new() -> (Self, mpsc::Sender<String>) {
        let (tx, rx) = mpsc::channel();
        let app = Self {
            should_quit: false,
            active_block: ActiveBlock::NavTree,
            theme: Theme::plum(), // Default theme configuration
            header: Header::new(),
            nav_tree: NavTree::new(),
            workspace: Workspace::new(),
            logger_pipe: LoggerPipe::new(rx),
            footer: Footer::new(),
            tx: tx.clone(),
        };
        (app, tx)
    }

    pub async fn run(&mut self, mut tui: Tui) -> Result<()> {
        tui.enter()?;

        while !self.should_quit {
            tui.terminal.draw(|f| {
                let size = f.size();
                
                // Paint global background foundation
                f.render_widget(
                    ratatui::widgets::Block::default().style(ratatui::style::Style::default().bg(self.theme.bg).fg(self.theme.text)),
                    size
                );

                let main_layout = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Length(3), // Header
                        Constraint::Min(10),   // Main Body
                        Constraint::Length(10), // Logger Pipe
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
                let _ = self.nav_tree.draw(f, body_layout[0], self.active_block == ActiveBlock::NavTree, &self.theme);
                let _ = self.workspace.draw(f, body_layout[1], self.active_block == ActiveBlock::Workspace, &self.theme);
                let _ = self.logger_pipe.draw(f, main_layout[2], self.active_block == ActiveBlock::LoggerPipe, &self.theme);
                let _ = self.footer.draw(f, main_layout[3], false, &self.theme);
            })?;

            if let Some(action) = handle_terminal_events()? {
                self.update(action)?;
            }
        }

        tui.exit()?;
        Ok(())
    }

    pub fn update(&mut self, action: Action) -> Result<()> {
        match action {
            Action::Quit => self.should_quit = true,
            Action::Execute => {
                let tx_clone = self.tx.clone();
                let _ = tx_clone.send("Initiating Deployment sequence...".to_string());
                
                let manifest_content = std::fs::read_to_string("../manifest.json").unwrap_or_default();
                if let Ok(target_payload) = serde_json::from_str::<crate::models::manifest::Manifest>(&manifest_content) {
                    tokio::spawn(async move {
                        if let Err(e) = crate::manifest_engine::execute(&target_payload, tx_clone.clone()).await {
                            let _ = tx_clone.send(format!("CRITICAL ERROR: {}", e));
                        }
                    });
                } else {
                    let _ = tx_clone.send("ERROR: Could not parse manifest.json payload!".to_string());
                }
            }
            Action::Tab => {
                self.active_block = match self.active_block {
                    ActiveBlock::NavTree => ActiveBlock::Workspace,
                    ActiveBlock::Workspace => ActiveBlock::LoggerPipe,
                    ActiveBlock::LoggerPipe => ActiveBlock::NavTree,
                };
            }
            Action::ShiftTab => {
                self.active_block = match self.active_block {
                    ActiveBlock::NavTree => ActiveBlock::LoggerPipe,
                    ActiveBlock::Workspace => ActiveBlock::NavTree,
                    ActiveBlock::LoggerPipe => ActiveBlock::Workspace,
                };
            }
            _ => {
                match self.active_block {
                    ActiveBlock::NavTree => { 
                        let _ = self.nav_tree.update(action)?; 
                        self.workspace.set_category(self.nav_tree.selected_category());
                    }
                    ActiveBlock::Workspace => { let _ = self.workspace.update(action)?; }
                    ActiveBlock::LoggerPipe => { let _ = self.logger_pipe.update(action)?; }
                }
            }
        }
        Ok(())
    }
}
