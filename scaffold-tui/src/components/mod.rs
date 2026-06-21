pub mod footer;
pub mod header;
pub mod logger_pipe;
pub mod nav_tree;
pub mod workspace;

use crate::action::Action;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;

pub trait Component {
    fn update(&mut self, action: Action) -> Result<Option<Action>>;
    fn draw(
        &mut self,
        f: &mut ratatui::Frame<'_>,
        area: Rect,
        active: bool,
        theme: &Theme,
    ) -> Result<()>;
}
