use crate::skills_cli::errors::{find_suggestions, SkillsError};
use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::lockfile::LockfileManager;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};

pub struct InstallOptions {
    pub target: PathBuf,
    pub force: bool,
    pub dry_run: bool,
    pub no_lock: bool,
}

#[derive(Debug, serde::Serialize)]
pub struct InstallItemResult {
    pub slug: String,
    pub version: String,
    pub status: String,
    pub files: usize,
    pub error: Option<String>,
}

pub fn run_install(
    index: &SkillIndex,
    printer: &Printer,
    slugs: &[String],
    options: &InstallOptions,
) -> Result<()> {
    if slugs.is_empty() {
        return Err(SkillsError::MissingArgument {
            flag: "<skills...>".to_string(),
            subcommand: "install".to_string(),
        }
        .into());
    }

    // 1. Validate target directory
    if !options.target.exists() {
        if options.dry_run {
            printer.info(format!(
                "[Dry-run] Would create target directory: {}",
                options.target.display()
            ));
        } else {
            fs::create_dir_all(&options.target).map_err(|e| SkillsError::InvalidTarget {
                path: options.target.clone(),
                reason: e.to_string(),
            })?;
        }
    }

    let skills_dest_dir = options.target.join(".skills");
    if !options.dry_run && !skills_dest_dir.exists() {
        fs::create_dir_all(&skills_dest_dir).map_err(|e| SkillsError::IoError {
            operation: "create_dir_all".to_string(),
            path: skills_dest_dir.clone(),
            message: e.to_string(),
        })?;
    }

    let lock_mgr = LockfileManager::new(&options.target);

    // 2. Validate all skill slugs first
    let mut resolved_skills = Vec::new();
    for slug in slugs {
        match index.get_by_slug(slug) {
            Some(rec) => resolved_skills.push(rec),
            None => {
                let suggestions = find_suggestions(slug, &index.all_slugs(), 3);
                return Err(SkillsError::SkillNotFound {
                    slug: slug.clone(),
                    suggestions,
                }
                .into());
            }
        }
    }

    // 3. Dry-run output or plan header
    if !printer.is_json() {
        printer.header(&format!(
            "Installing {} skill(s) into {}",
            resolved_skills.len(),
            options.target.display()
        ));
    }

    let mut results = Vec::new();
    let mut overall_success = true;

    for rec in resolved_skills {
        let dest_skill_dir = skills_dest_dir.join(&rec.slug);
        let exists = dest_skill_dir.exists();

        // Check if already installed at same version
        let mut installed_ver = None;
        if exists {
            let meta_path = dest_skill_dir.join("meta.json");
            if let Ok(c) = fs::read_to_string(&meta_path) {
                if let Ok(j) = serde_json::from_str::<serde_json::Value>(&c) {
                    if let Some(v) = j.get("version").and_then(|v| v.as_str()) {
                        installed_ver = Some(v.to_string());
                    }
                }
            }
        }

        let is_upgrade = match &installed_ver {
            Some(v) => v != &rec.version,
            None => false,
        };

        if exists && !is_upgrade && !options.force {
            if printer.is_json() {
                results.push(InstallItemResult {
                    slug: rec.slug.clone(),
                    version: rec.version.clone(),
                    status: "already_installed".to_string(),
                    files: 0,
                    error: None,
                });
            } else {
                printer.info(format!(
                    "Skill \"{}\" (v{}) is already installed (use --force to overwrite).",
                    rec.slug, rec.version
                ));
            }
            continue;
        }

        if options.dry_run {
            let action_desc = if is_upgrade {
                format!(
                    "Would upgrade v{} -> v{}",
                    installed_ver.unwrap_or_default(),
                    rec.version
                )
            } else if exists {
                format!("Would reinstall v{} (--force)", rec.version)
            } else {
                format!("Would install v{}", rec.version)
            };

            if printer.is_json() {
                results.push(InstallItemResult {
                    slug: rec.slug.clone(),
                    version: rec.version.clone(),
                    status: "dry_run".to_string(),
                    files: 0,
                    error: None,
                });
            } else {
                printer.info(format!("  * {:<24} {}", rec.slug, action_desc));
            }
            continue;
        }

        // Execute atomic installation: Stage -> Commit -> Record
        match install_atomic(&rec.source_path, &dest_skill_dir) {
            Ok(file_count) => {
                if !options.no_lock {
                    let _ = lock_mgr.record_install(&rec.slug, &rec.version, &dest_skill_dir);
                }
                let status_label = if is_upgrade { "upgraded" } else { "installed" };
                printer.success(format!(
                    "Successfully {} \"{}\" (v{}, {} files)",
                    status_label, rec.slug, rec.version, file_count
                ));
                results.push(InstallItemResult {
                    slug: rec.slug.clone(),
                    version: rec.version.clone(),
                    status: status_label.to_string(),
                    files: file_count,
                    error: None,
                });
            }
            Err(e) => {
                overall_success = false;
                printer.error(format!("Failed to install \"{}\": {}", rec.slug, e));
                results.push(InstallItemResult {
                    slug: rec.slug.clone(),
                    version: rec.version.clone(),
                    status: "failed".to_string(),
                    files: 0,
                    error: Some(e.to_string()),
                });
            }
        }
    }

    if printer.is_json() {
        let out = json!({
            "target": options.target.to_string_lossy(),
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

fn install_atomic(source_dir: &Path, dest_dir: &Path) -> Result<usize> {
    let parent = dest_dir.parent().unwrap_or_else(|| Path::new("."));
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    let tmp_dir = parent.join(format!(
        ".tmp-{}-{}",
        dest_dir.file_name().unwrap_or_default().to_string_lossy(),
        nonce
    ));
    let backup_dir = parent.join(format!(
        ".bak-{}-{}",
        dest_dir.file_name().unwrap_or_default().to_string_lossy(),
        nonce
    ));

    // 1. Stage in tmp directory
    copy_dir_recursive(source_dir, &tmp_dir)?;

    // 2. Count files in staged copy
    let mut file_count = 0;
    count_files_recursive(&tmp_dir, &mut file_count);

    // 3. If destination exists, move to backup
    if dest_dir.exists() {
        if let Err(e) = fs::rename(dest_dir, &backup_dir) {
            let _ = fs::remove_dir_all(&tmp_dir);
            return Err(anyhow::anyhow!(
                "Failed to stage existing skill backup: {}",
                e
            ));
        }
    }

    // 4. Commit: Move tmp to destination
    if let Err(e) = fs::rename(&tmp_dir, dest_dir) {
        // Rollback backup if it existed
        if backup_dir.exists() {
            let _ = fs::rename(&backup_dir, dest_dir);
        }
        let _ = fs::remove_dir_all(&tmp_dir);
        return Err(anyhow::anyhow!("Failed to commit new skill files: {}", e));
    }

    // 5. Clean up backup
    if backup_dir.exists() {
        let _ = fs::remove_dir_all(&backup_dir);
    }

    Ok(file_count)
}

pub fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let sp = entry.path();
        let dp = dst.join(entry.file_name());
        if ft.is_dir() {
            copy_dir_recursive(&sp, &dp)?;
        } else if ft.is_file() {
            fs::copy(&sp, &dp)?;
        }
    }
    Ok(())
}

fn count_files_recursive(dir: &Path, count: &mut usize) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(ft) = entry.file_type() {
                if ft.is_file() {
                    *count += 1;
                } else if ft.is_dir() {
                    count_files_recursive(&entry.path(), count);
                }
            }
        }
    }
}
