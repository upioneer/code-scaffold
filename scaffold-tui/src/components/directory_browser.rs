use crate::action::Action;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout, Rect};
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, Clear, List, ListItem, ListState};
use std::path::PathBuf;

pub struct DirectoryBrowser {
    pub current_path: PathBuf,
    pub items: Vec<(String, bool)>, // (name, is_dir)
    pub state: ListState,
    pub is_open: bool,
    pub selected_path: Option<String>,
    pub is_creating_folder: bool,
    pub new_folder_name: String,
}

impl DirectoryBrowser {
    pub fn new() -> Self {
        let current_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let mut db = Self {
            current_path,
            items: Vec::new(),
            state: ListState::default(),
            is_open: false,
            selected_path: None,
            is_creating_folder: false,
            new_folder_name: String::new(),
        };
        db.load_directory();
        db
    }

    pub fn load_directory(&mut self) {
        self.items.clear();
        if let Some(parent) = self.current_path.parent() {
            if parent != self.current_path {
                self.items.push(("..".to_string(), true));
            }
        } else {
            // Root directory, still push ".." just in case, though it won't do much
            self.items.push(("..".to_string(), true));
        }
        self.items.push(("[ + Create New Folder ]".to_string(), false));

        if let Ok(entries) = std::fs::read_dir(&self.current_path) {
            let mut dirs = Vec::new();
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                if is_dir {
                    dirs.push((name, true));
                }
            }
            dirs.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
            self.items.extend(dirs);
        }
        self.state.select(Some(0));
    }

    pub fn open(&mut self, initial_path: &str) {
        let p = PathBuf::from(initial_path);
        if p.exists() && p.is_dir() {
            self.current_path = p.canonicalize().unwrap_or(p);
        } else {
            self.current_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        }
        self.load_directory();
        self.is_open = true;
        self.selected_path = None;
    }
}

impl Component for DirectoryBrowser {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        if !self.is_open {
            return Ok(None);
        }

        if self.is_creating_folder {
            match action {
                Action::Char(c) => {
                    self.new_folder_name.push(c);
                }
                Action::Backspace => {
                    self.new_folder_name.pop();
                }
                Action::Enter => {
                    if !self.new_folder_name.is_empty() {
                        let new_path = self.current_path.join(&self.new_folder_name);
                        let _ = std::fs::create_dir(&new_path);
                        self.current_path = new_path;
                        self.load_directory();
                    }
                    self.is_creating_folder = false;
                    self.new_folder_name.clear();
                }
                Action::Quit => {
                    self.is_creating_folder = false;
                    self.new_folder_name.clear();
                }
                _ => {}
            }
            return Ok(Some(Action::Tick));
        }

        let mut i = self.state.selected().unwrap_or(0);
        match action {
            Action::Up => {
                i = i.saturating_sub(1);
                self.state.select(Some(i));
            }
            Action::Down => {
                i = (i + 1).min(self.items.len().saturating_sub(1));
                self.state.select(Some(i));
            }
            Action::Backspace | Action::Left => {
                if let Some(parent) = self.current_path.parent() {
                    self.current_path = parent.to_path_buf();
                    self.load_directory();
                }
            }
            Action::Enter | Action::Right => {
                if let Some(selected) = self.state.selected() {
                    let (name, is_dir) = &self.items[selected];
                    if name == "[ + Create New Folder ]" {
                        self.is_creating_folder = true;
                        self.new_folder_name.clear();
                    } else if name == ".." {
                        if let Some(parent) = self.current_path.parent() {
                            self.current_path = parent.to_path_buf();
                            self.load_directory();
                        }
                    } else if *is_dir {
                        self.current_path = self.current_path.join(name);
                        self.load_directory();
                    }
                }
            }
            Action::Char(' ') => {
                self.selected_path = Some(self.current_path.to_string_lossy().to_string());
                self.is_open = false;
            }
            Action::Quit => {
                self.is_open = false;
            }
            _ => {}
        }
        
        // We return an action to indicate we consumed it, preventing the main app from acting on it
        Ok(Some(Action::Tick)) 
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, _active: bool, theme: &Theme) -> Result<()> {
        if !self.is_open {
            return Ok(());
        }

        let popup_layout = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Percentage(15),
                Constraint::Percentage(70),
                Constraint::Percentage(15),
            ])
            .split(area);

        let area = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([
                Constraint::Percentage(15),
                Constraint::Percentage(70),
                Constraint::Percentage(15),
            ])
            .split(popup_layout[1])[1];

        f.render_widget(Clear, area);

        let items: Vec<ListItem> = self.items.iter().map(|(name, _)| {
            let display_name = if name == "[ + Create New Folder ]" {
                format!(" ➕ {}", name)
            } else {
                format!(" 📁 {}", name)
            };
            ListItem::new(display_name).style(Style::default().fg(theme.text).bg(theme.bg))
        }).collect();

        let title = if self.is_creating_folder {
            format!(" Create Folder: {}_ ", self.new_folder_name)
        } else {
            format!(" Select Folder: {} (Space to Confirm, Esc to Cancel) ", self.current_path.to_string_lossy())
        };
        
        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(title)
                    .border_style(Style::default().fg(theme.accent).bg(theme.bg))
                    .style(Style::default().bg(theme.bg)),
            )
            .highlight_style(Style::default().bg(theme.accent).fg(theme.bg))
            .highlight_symbol(">>");

        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
