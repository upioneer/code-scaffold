pub mod description_pane;
pub mod directory_browser;
pub mod footer;
pub mod header;
pub mod nav_tree;
pub mod summary;
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
