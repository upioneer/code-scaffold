#![allow(warnings)]

mod action;
mod app;
mod components;
mod manifest_engine;
mod tui;

use anyhow::Result;
use app::App;
use tui::Tui;

#[tokio::main]
async fn main() -> Result<()> {
    // Process initialization and cache directory resolution
    let tui = Tui::new()?;
    let mut app = App::new();

    app.run(tui).await?;

    Ok(())
}
