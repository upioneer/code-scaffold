pub mod header;
pub mod nav_tree;
pub mod workspace;
pub mod logger_pipe;
pub mod footer;

use anyhow::Result;
use crate::action::Action;

pub trait Component {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let _ = action;
        Ok(None)
    }
    fn draw(&mut self, f: &mut ratatui::Frame<'_>, area: ratatui::prelude::Rect, active: bool) -> Result<()>;
}
