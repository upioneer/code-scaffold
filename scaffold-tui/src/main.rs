#![allow(warnings)]

mod acp_server;
mod action;
mod app;
mod components;
mod headless;
mod manifest_engine;
mod models;
mod prefs;
mod scaffold_connect;
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

    if args.iter().any(|arg| arg == "--version-json") {
        let output = serde_json::json!({ "version": env!("CARGO_PKG_VERSION") });
        println!("{}", serde_json::to_string_pretty(&output).unwrap());
        return Ok(());
    }

    // Updates are now polled asynchronously in the background by the TUI

    // Process initialization and cache directory resolution
    let payload_dir = sync::sync_payload().await?;

    if args
        .iter()
        .any(|arg| arg == "--help" || arg == "-h" || arg == "/help" || arg == "/h")
    {
        headless::print_headless_help(payload_dir);
        return Ok(());
    }

    if args.iter().any(|arg| arg == "--headless") {
        headless::run_headless(payload_dir, args).await?;
        return Ok(());
    }

    if args.iter().any(|arg| arg == "--acp" || arg == "--server") {
        acp_server::run_acp_server(payload_dir, args).await?;
        return Ok(());
    }

    let tui = Tui::new()?;
    let mut app = App::new(payload_dir);

    app.run(tui).await?;

    Ok(())
}
