use ratatui::Frame;
use anyhow::Result;
use crate::action::Action;

pub trait Component {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let _ = action;
        Ok(None)
    }
    fn draw(&mut self, f: &mut Frame, area: ratatui::prelude::Rect) -> Result<()>;
}
