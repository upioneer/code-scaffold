#![allow(warnings)]

mod action;
mod app;
mod components;
mod manifest_engine;
mod models;
mod prefs;
mod sync;
mod theme;
mod tui;
mod updater;

use anyhow::Result;
use app::App;
use tui::Tui;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args
        .iter()
        .any(|arg| arg == "--version" || arg == "-v" || arg == "-V")
    {
        println!("Code Scaffold TUI v{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    // Ping GitHub for updates (non-blocking 3-second timeout)
    let _ = updater::check_for_updates().await;

    // Process initialization and cache directory resolution
    let payload_dir = sync::sync_payload().await?;

    let tui = Tui::new()?;
    let mut app = App::new(payload_dir);

    app.run(tui).await?;

    Ok(())
}
