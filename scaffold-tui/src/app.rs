use crate::action::Action;
use crate::tui::{Tui, handle_terminal_events};
use crate::components::{
    Component,
    header::Header,
    nav_tree::NavTree,
    workspace::Workspace,
    logger_pipe::LoggerPipe,
    footer::Footer,
};
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout};

pub struct App {
    pub should_quit: bool,
    header: Header,
    nav_tree: NavTree,
    workspace: Workspace,
    logger_pipe: LoggerPipe,
    footer: Footer,
}

impl App {
    pub fn new() -> Self {
        Self {
            should_quit: false,
            header: Header::new(),
            nav_tree: NavTree::new(),
            workspace: Workspace::new(),
            logger_pipe: LoggerPipe::new(),
            footer: Footer::new(),
        }
    }

    pub async fn run(&mut self, mut tui: Tui) -> Result<()> {
        tui.enter()?;

        while !self.should_quit {
            tui.terminal.draw(|f| {
                let size = f.size();
                
                let main_layout = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Length(3),      // Header
                        Constraint::Min(10),        // Main Body
                        Constraint::Length(8),      // Logger Pipe
                        Constraint::Length(3),      // Footer
                    ])
                    .split(size);
                
                let body_layout = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints([
                        Constraint::Percentage(30), // Nav Tree
                        Constraint::Percentage(70), // Workspace
                    ])
                    .split(main_layout[1]);

                let _ = self.header.draw(f, main_layout[0]);
                let _ = self.nav_tree.draw(f, body_layout[0]);
                let _ = self.workspace.draw(f, body_layout[1]);
                let _ = self.logger_pipe.draw(f, main_layout[2]);
                let _ = self.footer.draw(f, main_layout[3]);
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
            _ => {}
        }
        Ok(())
    }
}
