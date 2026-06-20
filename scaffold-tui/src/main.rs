#![allow(warnings)]

mod action;
mod app;
mod components;
mod manifest_engine;
mod models;
mod tui;

use anyhow::Result;
use app::App;
use tui::Tui;

#[tokio::main]
async fn main() -> Result<()> {
    // Process initialization and cache directory resolution
    let tui = Tui::new()?;
    let (mut app, tx) = App::new();

    // Mock background worker task simulating long-running compilation
    let tx_clone = tx.clone();
    tokio::spawn(async move {
        let mut count = 1;
        let _ = tx_clone.send("Background execution thread booted...".to_string());
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            let _ = tx_clone.send(format!("[INFO] Diagnostic task report #{}", count));
            count += 1;
        }
    });

    app.run(tui).await?;

    Ok(())
}
