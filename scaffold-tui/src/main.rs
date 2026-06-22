#![allow(warnings)]

mod action;
mod app;
mod components;
mod manifest_engine;
mod models;
mod sync;
mod theme;
mod tui;

use anyhow::Result;
use app::App;
use tui::Tui;

#[tokio::main]
async fn main() -> Result<()> {
    // Process initialization and cache directory resolution
    let payload_dir = sync::sync_payload().await?;

    let tui = Tui::new()?;
    let mut app = App::new(payload_dir);

    app.run(tui).await?;

    Ok(())
}
