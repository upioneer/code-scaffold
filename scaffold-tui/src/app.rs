use crate::action::Action;
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
    header: Header,
    nav_tree: NavTree,
    workspace: Workspace,
    logger_pipe: LoggerPipe,
    footer: Footer,
}

impl App {
    pub fn new() -> (Self, mpsc::Sender<String>) {
        let (tx, rx) = mpsc::channel();
        let app = Self {
            should_quit: false,
            active_block: ActiveBlock::NavTree,
            header: Header::new(),
            nav_tree: NavTree::new(),
            workspace: Workspace::new(),
            logger_pipe: LoggerPipe::new(rx),
            footer: Footer::new(),
        };
        (app, tx)
    }

    pub async fn run(&mut self, mut tui: Tui) -> Result<()> {
        tui.enter()?;

        while !self.should_quit {
            tui.terminal.draw(|f| {
                let size = f.size();

                let main_layout = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Length(3), // Header
                        Constraint::Min(10),   // Main Body
                        Constraint::Length(8), // Logger Pipe
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

                let _ = self.header.draw(f, main_layout[0], false);
                let _ = self.nav_tree.draw(f, body_layout[0], self.active_block == ActiveBlock::NavTree);
                let _ = self.workspace.draw(f, body_layout[1], self.active_block == ActiveBlock::Workspace);
                let _ = self.logger_pipe.draw(f, main_layout[2], self.active_block == ActiveBlock::LoggerPipe);
                let _ = self.footer.draw(f, main_layout[3], false);
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
                    ActiveBlock::NavTree => { let _ = self.nav_tree.update(action)?; }
                    ActiveBlock::Workspace => { let _ = self.workspace.update(action)?; }
                    ActiveBlock::LoggerPipe => { let _ = self.logger_pipe.update(action)?; }
                }
            }
        }
        Ok(())
    }
}
