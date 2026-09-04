use crate::skills_cli::errors::{find_suggestions, SkillsError};
use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::lockfile::LockfileManager;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};

pub fn run_uninstall(
    index: &SkillIndex,
    printer: &Printer,
    slugs: &[String],
    target: &Path,
    force: bool,
) -> Result<()> {
    if slugs.is_empty() {
        return Err(SkillsError::MissingArgument {
            flag: "<skills...>".to_string(),
            subcommand: "uninstall".to_string(),
        }
        .into());
    }

    if !target.exists() {
        return Err(SkillsError::InvalidTarget {
            path: target.to_path_buf(),
            reason: "Directory does not exist.".to_string(),
        }
        .into());
    }

    let skills_dir = target.join(".skills");
    let lock_mgr = LockfileManager::new(target);
    let mut results = Vec::new();
    let mut overall_success = true;

    if !printer.is_json() {
        printer.header(&format!(
            "Uninstalling {} skill(s) from {}",
            slugs.len(),
            target.display()
        ));
    }

    for slug in slugs {
        let dest_dir = skills_dir.join(slug);
        if !dest_dir.exists() {
            let installed_slugs = get_installed_slugs(&skills_dir);
            let suggestions = find_suggestions(slug, &installed_slugs, 3);
            overall_success = false;
            let err_msg = format!("Skill \"{}\" is not installed.", slug);
            printer.error(&err_msg);
            if !suggestions.is_empty() && !printer.is_json() {
                printer.info(format!(
                    "  Installed suggestions: {}",
                    suggestions.join(", ")
                ));
            }
            results.push(json!({
                "slug": slug,
                "status": "not_installed",
                "success": false,
                "error": err_msg
            }));
            continue;
        }

        match fs::remove_dir_all(&dest_dir) {
            Ok(_) => {
                let _ = lock_mgr.record_uninstall(slug);
                printer.success(format!("Successfully uninstalled \"{}\"", slug));
                results.push(json!({
                    "slug": slug,
                    "status": "uninstalled",
                    "success": true
                }));
            }
            Err(e) => {
                overall_success = false;
                let err_msg = e.to_string();
                printer.error(format!("Failed to remove \"{}\": {}", slug, err_msg));
                results.push(json!({
                    "slug": slug,
                    "status": "failed",
                    "success": false,
                    "error": err_msg
                }));
            }
        }
    }

    if printer.is_json() {
        let out = json!({
            "target": target.to_string_lossy(),
            "success": overall_success,
            "results": results
        });
        printer.print_json(&out);
    } else {
        println!();
    }

    if !overall_success {
        std::process::exit(1);
    }

    Ok(())
}

fn get_installed_slugs(skills_dir: &Path) -> Vec<String> {
    let mut slugs = Vec::new();
    if let Ok(entries) = fs::read_dir(skills_dir) {
        for entry in entries.flatten() {
            if let Ok(ft) = entry.file_type() {
                if ft.is_dir() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if !name.starts_with('.') {
                        slugs.push(name);
                    }
                }
            }
        }
    }
    slugs
}
