use crate::components::Component;
use crate::action::Action;
use crate::models::file_tree::FileNode;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};
use ratatui::style::Style;
use std::env;

pub struct NavTree {
    pub root: FileNode,
    pub state: ListState,
}

impl NavTree {
    pub fn new() -> Self {
        let current_dir = env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
        let root = FileNode::new(&current_dir, true);
        let mut state = ListState::default();
        state.select(Some(0));
        Self { root, state }
    }

    pub fn get_visible_nodes(&self) -> Vec<(String, std::path::PathBuf, bool)> {
        let mut result = Vec::new();
        self.flatten_node(&self.root, 0, &mut result);
        result
    }

    fn flatten_node(&self, node: &FileNode, depth: usize, result: &mut Vec<(String, std::path::PathBuf, bool)>) {
        let indent = "  ".repeat(depth);
        let icon = if node.is_dir {
            if node.is_expanded { "v" } else { ">" }
        } else {
            " "
        };
        let display = format!("{}{} {}", indent, icon, node.name);
        result.push((display, node.path.clone(), node.is_dir));

        if node.is_dir && node.is_expanded {
            if let Some(children) = &node.children {
                for child in children {
                    self.flatten_node(child, depth + 1, result);
                }
            }
        }
    }

    fn toggle_node_by_path(&mut self, target_path: &std::path::Path, force_expand: bool, force_collapse: bool, toggle: bool) {
        Self::toggle_recursive(&mut self.root, target_path, force_expand, force_collapse, toggle);
    }

    fn toggle_recursive(node: &mut FileNode, target_path: &std::path::Path, force_expand: bool, force_collapse: bool, toggle: bool) -> bool {
        if node.path == target_path {
            if force_expand && !node.is_expanded {
                node.toggle_expand();
            } else if force_collapse && node.is_expanded {
                node.toggle_expand();
            } else if toggle {
                node.toggle_expand();
            }
            return true;
        }

        if let Some(children) = &mut node.children {
            for child in children {
                if Self::toggle_recursive(child, target_path, force_expand, force_collapse, toggle) {
                    return true;
                }
            }
        }
        false
    }
}

impl Component for NavTree {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let visible_count = self.get_visible_nodes().len();
        if visible_count == 0 { return Ok(None); }

        let mut i = self.state.selected().unwrap_or(0);

        match action {
            Action::Down => {
                i = (i + 1).min(visible_count.saturating_sub(1));
                self.state.select(Some(i));
            }
            Action::Up => {
                i = i.saturating_sub(1);
                self.state.select(Some(i));
            }
            Action::Right | Action::Left | Action::Enter => {
                let nodes = self.get_visible_nodes();
                if let Some((_, path, is_dir)) = nodes.get(i) {
                    if *is_dir {
                        self.toggle_node_by_path(path, action == Action::Right, action == Action::Left, action == Action::Enter);
                    }
                }
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: Rect, active: bool, theme: &Theme) -> Result<()> {
        let border_color = if active { theme.primary } else { theme.secondary };
        let border_style = Style::default().fg(border_color).bg(theme.bg);
        
        let nodes = self.get_visible_nodes();
        let items: Vec<ListItem> = nodes.into_iter()
            .map(|(display, _, is_dir)| {
                let text_color = if is_dir { theme.accent } else { theme.text };
                ListItem::new(display).style(Style::default().fg(text_color).bg(theme.bg))
            })
            .collect();

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Project Explorer ").border_style(border_style).style(Style::default().bg(theme.bg)))
            .highlight_style(Style::default().bg(theme.primary).fg(theme.bg))
            .highlight_symbol(">> ");

        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
