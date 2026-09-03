use crate::models::manifest::Manifest;
use anyhow::Result;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tokio::sync::mpsc::UnboundedSender;

fn copy_dir_all(
    src: impl AsRef<std::path::Path>,
    dst: impl AsRef<std::path::Path>,
) -> std::io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

pub async fn execute(
    manifest: &Manifest,
    tx: UnboundedSender<String>,
    payload_dir: &std::path::PathBuf,
    target_folder: &str,
) -> Result<()> {
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
                if let Err(e) = fs::create_dir_all(&path) {
                    let _ = tx.send(format!(
                        " -> (Error) Failed to create directory {}: {}",
                        app.target, e
                    ));
                } else {
                    let _ = tx.send(format!(" -> Created target directory: {}", app.target));
                }
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
                    let _ = fs::create_dir_all(parent);
                }
                if let Err(e) = fs::write(&path, "") {
                    let _ = tx.send(format!(
                        " -> (Error) Failed to initialize artifact {}: {}",
                        artifact.target, e
                    ));
                } else {
                    let _ = tx.send(format!(" -> Initialized artifact: {}", artifact.target));
                }
            }
        } else if artifact.method == "inject_persona" {
            if let Some(src) = &artifact.source {
                let src_path = PathBuf::from(src);
                if src_path.exists() {
                    if let Some(parent) = path.parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    match fs::read_to_string(&src_path) {
                        Ok(mut content) => {
                            if let Some(desc) = &artifact.content {
                                content = content.replace(
                                    "[Define the agent's primary role and responsibilities here]",
                                    desc,
                                );
                            }
                            if let Err(e) = fs::write(&path, content) {
                                let _ = tx.send(format!(
                                    " -> (Error) Failed to write persona {}: {}",
                                    artifact.target, e
                                ));
                            } else {
                                let _ = tx.send(format!(
                                    " -> Injected persona into: {}",
                                    artifact.target
                                ));
                            }
                        }
                        Err(e) => {
                            let _ = tx.send(format!(
                                " -> (Error) Failed to read persona source {}: {}",
                                src, e
                            ));
                        }
                    }
                } else {
                    let _ = tx.send(format!(
                        " -> (Missing Source) Failed to generate: {}",
                        artifact.target
                    ));
                }
            } else {
                let _ = tx.send(format!(
                    " -> (No Source) Failed to generate: {}",
                    artifact.target
                ));
            }
        } else if artifact.method == "write" {
            if let Some(content) = &artifact.content {
                if let Some(parent) = path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if path.exists() {
                    let _ = tx.send(format!(" -> Skipped (already exists): {}", artifact.target));
                } else if let Err(e) = fs::write(&path, content) {
                    let _ = tx.send(format!(
                        " -> (Error) Failed to write artifact {}: {}",
                        artifact.target, e
                    ));
                } else {
                    let _ = tx.send(format!(" -> Generated artifact: {}", artifact.target));
                }
            } else {
                let _ = tx.send(format!(
                    " -> (No Content) Failed to generate: {}",
                    artifact.target
                ));
            }
        } else if artifact.method == "copy" {
            if let Some(src) = &artifact.source {
                let src_path = PathBuf::from(src);
                if src_path.exists() {
                    if let Some(parent) = path.parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    let res = if path.exists() {
                        Ok(false)
                    } else if src_path.is_dir() {
                        copy_dir_all(&src_path, &path).map(|_| true)
                    } else {
                        fs::copy(&src_path, &path).map(|_| true)
                    };
                    match res {
                        Err(e) => {
                            let _ = tx.send(format!(
                                " -> (Error) Failed to generate: {} ({})",
                                artifact.target, e
                            ));
                        }
                        Ok(false) => {
                            let _ = tx
                                .send(format!(" -> Skipped (already exists): {}", artifact.target));
                        }
                        Ok(true) => {
                            let _ = tx.send(format!(" -> Generated artifact: {}", artifact.target));
                        }
                    }
                } else {
                    let _ = tx.send(format!(
                        " -> (Missing Source) Failed to generate: {}",
                        artifact.target
                    ));
                }
            } else {
                let _ = tx.send(format!(
                    " -> (No Source) Failed to generate: {}",
                    artifact.target
                ));
            }
        }
    }
    tokio::time::sleep(Duration::from_millis(500)).await; // UX execution padding

    // 4. Validate and Execute Skill Modules
    let _ = tx.send("".to_string());
    let _ = tx.send("[3/3] Provisioning Target Skill Modules...".to_string());
    for skill in &manifest.skills {
        if skill.method == "copy" {
            let target_path = PathBuf::from(&skill.target);
            if let Some(src) = &skill.source {
                let src_path = PathBuf::from(src);
                if src_path.exists() {
                    if let Some(parent) = target_path.parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    let res = if src_path.is_dir() {
                        copy_dir_all(&src_path, &target_path)
                    } else {
                        fs::copy(&src_path, &target_path).map(|_| ())
                    };
                    if let Err(e) = res {
                        let _ = tx.send(format!(
                            " -> (Error) Failed to provision: {} ({})",
                            skill.label, e
                        ));
                    } else {
                        let _ = tx.send(format!(" -> Provisioned module: {}", skill.label));
                    }
                } else {
                    let _ = tx.send(format!(
                        " -> (Missing Source) Failed to provision: {}",
                        skill.label
                    ));
                }
            } else {
                let _ = tx.send(format!(
                    " -> (No Source) Failed to provision: {}",
                    skill.label
                ));
            }
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
    let env_path = PathBuf::from(target_folder).join(".env");
    if let Err(e) = fs::write(&env_path, env_block) {
        let _ = tx.send(format!(
            " -> (Error) Failed to write .env at {:?}: {}",
            env_path, e
        ));
    } else {
        let _ = tx.send(" -> Written localized .env definitions".to_string());
    }

    let _ = tx.send("".to_string());
    let _ = tx.send("Execution Cycle Completed Successfully!".to_string());
    let _ = tx.send("=========================================".to_string());

    Ok(())
}
