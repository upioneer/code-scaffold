use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: PathBuf,
    pub is_dir: bool,
    pub is_expanded: bool,
    pub children: Option<Vec<FileNode>>,
}

impl FileNode {
    pub fn new(path: &Path, is_expanded: bool) -> Self {
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let is_dir = path.is_dir();

        let mut node = Self {
            name,
            path: path.to_path_buf(),
            is_dir,
            is_expanded,
            children: None,
        };

        if is_dir && is_expanded {
            node.read_children();
        }

        node
    }

    pub fn read_children(&mut self) {
        if !self.is_dir {
            return;
        }
        let mut children = Vec::new();
        if let Ok(entries) = fs::read_dir(&self.path) {
            for entry in entries.flatten() {
                children.push(FileNode::new(&entry.path(), false));
            }
            // Sort: directories first, then files alphabetically
            children.sort_by(|a, b| match (a.is_dir, b.is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            });
        }
        self.children = Some(children);
    }

    pub fn toggle_expand(&mut self) {
        if self.is_dir {
            self.is_expanded = !self.is_expanded;
            if self.is_expanded && self.children.is_none() {
                self.read_children();
            }
        }
    }
}
