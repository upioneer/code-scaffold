use crate::models::manifest::Manifest;
use anyhow::Result;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;
use std::sync::mpsc::Sender;
use std::time::Duration;

pub async fn execute(manifest: &Manifest, tx: Sender<String>) -> Result<()> {
    let _ = tx.send("=========================================".to_string());
    let _ = tx.send("Initiating Native Scaffolding Engine...".to_string());

    // 1. Resolve host configuration directory natively without cross-platform pathing bugs
    if let Some(proj_dirs) = ProjectDirs::from("", "", "scaffold-tui") {
        let config_dir = proj_dirs.config_dir();
        if !config_dir.exists() {
            fs::create_dir_all(config_dir)?;
            let _ = tx.send(format!(
                "Initialized target host cache at: {:?}",
                config_dir
            ));
        } else {
            let _ = tx.send(format!("Host cache resolved at: {:?}", config_dir));
        }
    }

    // 2. Validate and Execute App Directory Generation
    let _ = tx.send("".to_string());
    let _ = tx.send("[1/3] Processing Directory Artifacts...".to_string());
    for app in &manifest.apps {
        if app.method == "mkdir" {
            let path = PathBuf::from(&app.target);
            if !path.exists() {
                fs::create_dir_all(&path)?;
                let _ = tx.send(format!(" -> Created target directory: {}", app.target));
            } else {
                let _ = tx.send(format!(" -> Directory exists (skipped): {}", app.target));
            }
        }
    }
    tokio::time::sleep(Duration::from_millis(500)).await; // UX execution padding

    // 3. Validate and Execute Core Project Artifacts
    let _ = tx.send("".to_string());
    let _ = tx.send("[2/3] Generating Project Artifacts...".to_string());
    for artifact in &manifest.artifacts {
        let path = PathBuf::from(&artifact.target);

        if artifact.method == "touch" {
            if !path.exists() {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(&path, "")?;
                let _ = tx.send(format!(" -> Initialized artifact: {}", artifact.target));
            }
        } else if artifact.method == "copy" {
            // Future Remote Fetch Logic
            let _ = tx.send(format!(
                " -> (Mocked) Pulled remote source for: {}",
                artifact.target
            ));
        }
    }
    tokio::time::sleep(Duration::from_millis(500)).await; // UX execution padding

    // 4. Validate and Execute Skill Modules
    let _ = tx.send("".to_string());
    let _ = tx.send("[3/3] Provisioning Target Skill Modules...".to_string());
    for skill in &manifest.skills {
        if skill.method == "copy" {
            let _ = tx.send(format!(
                " -> (Mocked) Bridged plugin container: {}",
                skill.label
            ));
        } else if skill.method == "append" {
            let _ = tx.send(format!(
                " -> (Mocked) Appended instructions for: {}",
                skill.label
            ));
        }
    }
    tokio::time::sleep(Duration::from_millis(500)).await; // UX execution padding

    // 5. Environmental Variable Export
    let _ = tx.send("".to_string());
    let _ = tx.send("Generating .env block...".to_string());
    let mut env_block = String::new();
    for (k, v) in &manifest.env {
        env_block.push_str(&format!("{}={}\n", k, v));
    }
    fs::write(".env", env_block)?;
    let _ = tx.send(" -> Written localized .env definitions".to_string());

    let _ = tx.send("".to_string());
    let _ = tx.send("Execution Cycle Completed Successfully!".to_string());
    let _ = tx.send("=========================================".to_string());

    Ok(())
}
