#![allow(dead_code, unused_imports, unused_variables)]

mod action;
mod app;
mod components;
mod manifest_engine;
mod tui;

use app::App;
use tui::Tui;
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // Process initialization and cache directory resolution
    let tui = Tui::new()?;
    let mut app = App::new();
    
    app.run(tui).await?;
    
    Ok(())
}
