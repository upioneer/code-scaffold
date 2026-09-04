use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::install::{run_install, InstallOptions};
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, serde::Serialize)]
pub struct OutdatedSkill {
    pub slug: String,
    pub installed_version: String,
    pub available_version: String,
}

pub fn run_outdated(
    index: &SkillIndex,
    printer: &Printer,
    target: &Path,
) -> Result<Vec<OutdatedSkill>> {
    let skills_dir = target.join(".skills");
    let mut outdated = Vec::new();

    if skills_dir.exists() {
        if let Ok(entries) = fs::read_dir(&skills_dir) {
            for entry in entries.flatten() {
                if let Ok(ft) = entry.file_type() {
                    if ft.is_dir() {
                        let slug = entry.file_name().to_string_lossy().to_string();
                        if slug.starts_with('.') {
                            continue;
                        }

                        if let Some(rec) = index.get_by_slug(&slug) {
                            let meta_path = entry.path().join("meta.json");
                            if let Ok(c) = fs::read_to_string(&meta_path) {
                                if let Ok(j) = serde_json::from_str::<serde_json::Value>(&c) {
                                    if let Some(inst_v) = j.get("version").and_then(|v| v.as_str())
                                    {
                                        if inst_v != rec.version {
                                            outdated.push(OutdatedSkill {
                                                slug: slug.clone(),
                                                installed_version: inst_v.to_string(),
                                                available_version: rec.version.clone(),
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    outdated.sort_by(|a, b| a.slug.cmp(&b.slug));

    if printer.is_json() {
        let out = json!({
            "target": target.to_string_lossy(),
            "outdated_count": outdated.len(),
            "skills": outdated
        });
        printer.print_json(&out);
        return Ok(outdated);
    }

    if outdated.is_empty() {
        printer.success(format!(
            "All skills in {} are up-to-date!",
            target.display()
        ));
        return Ok(outdated);
    }

    printer.header(&format!(
        "Outdated Skills in {} ({} available updates)",
        target.display(),
        outdated.len()
    ));

    for s in &outdated {
        printer.info(format!(
            "  * {:<26} v{:<4} -> v{:<4}",
            s.slug, s.installed_version, s.available_version
        ));
    }

    printer.info(format!(
        "\nRun: code-scaffold skills update --target \"{}\" to upgrade all.",
        target.display()
    ));
    println!();

    Ok(outdated)
}

pub fn run_update(
    index: &SkillIndex,
    printer: &Printer,
    slugs: &[String],
    target: &Path,
    all: bool,
    force: bool,
    dry_run: bool,
) -> Result<()> {
    let target_slugs = if all || slugs.is_empty() {
        let outdated = run_outdated(index, printer, target)?;
        if outdated.is_empty() {
            return Ok(());
        }
        outdated.into_iter().map(|s| s.slug).collect()
    } else {
        slugs.to_vec()
    };

    let options = InstallOptions {
        target: target.to_path_buf(),
        force: true, // force overwrite during update
        dry_run,
        no_lock: false,
    };

    run_install(index, printer, &target_slugs, &options)
}
