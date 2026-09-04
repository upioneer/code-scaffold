use crate::skills_cli::errors::{find_suggestions, SkillsError};
use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::lockfile::calculate_dir_stats;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn run_info(
    index: &SkillIndex,
    printer: &Printer,
    slug: &str,
    target_opt: Option<&Path>,
) -> Result<()> {
    let rec = match index.get_by_slug(slug) {
        Some(r) => r,
        None => {
            let suggestions = find_suggestions(slug, &index.all_slugs(), 3);
            return Err(SkillsError::SkillNotFound {
                slug: slug.to_string(),
                suggestions,
            }
            .into());
        }
    };

    let mut installed_status = "Not Installed".to_string();
    let mut installed_version_opt = None;
    let mut is_installed = false;
    let mut file_count = 0;
    let mut byte_size = 0;

    if let Some(target) = target_opt {
        let skill_dir = target.join(".skills").join(&rec.slug);
        if skill_dir.exists() {
            is_installed = true;
            let meta_path = skill_dir.join("meta.json");
            if let Ok(c) = fs::read_to_string(&meta_path) {
                if let Ok(j) = serde_json::from_str::<serde_json::Value>(&c) {
                    if let Some(v) = j.get("version").and_then(|v| v.as_str()) {
                        installed_version_opt = Some(v.to_string());
                        if v == rec.version {
                            installed_status = format!("Installed (v{})", v);
                        } else {
                            installed_status = format!(
                                "Outdated (installed v{} -> available v{})",
                                v, rec.version
                            );
                        }
                    }
                }
            }
            if let Ok((fc, _)) = calculate_dir_stats(&skill_dir) {
                file_count = fc;
            }
            byte_size = get_dir_size(&skill_dir);
        }
    }

    if printer.is_json() {
        let out = json!({
            "slug": rec.slug,
            "label": rec.label,
            "version": rec.version,
            "category": rec.category,
            "description": rec.description,
            "keywords": rec.keywords,
            "permissions": rec.permissions,
            "engines": rec.engines,
            "entryPoint": rec.entry_point,
            "target": rec.target,
            "logo": rec.logo,
            "installed": is_installed,
            "installedVersion": installed_version_opt,
            "installedStatus": installed_status,
            "fileCount": file_count,
            "sizeBytes": byte_size
        });
        printer.print_json(&out);
        return Ok(());
    }

    printer.header(&format!("Skill Card: {} (v{})", rec.label, rec.version));

    // Print ASCII Logo if available
    if !rec.logo.is_empty() {
        println!();
        for line in &rec.logo {
            println!("{}", line);
        }
        println!();
    }

    printer.info(format!("  Slug:         {}", rec.slug));
    printer.info(format!("  Display Name: {}", rec.label));
    printer.info(format!("  Version:      v{}", rec.version));
    printer.info(format!("  Category:     {}", rec.category));
    printer.info(format!("  Description:  {}", rec.description));
    printer.info(format!("  Keywords:     {}", rec.keywords.join(", ")));
    printer.info(format!("  Entry Point:  {}", rec.entry_point));
    printer.info(format!("  Target Path:  {}", rec.target));

    if !rec.engines.is_empty() {
        let mut engs = Vec::new();
        for (k, v) in &rec.engines {
            engs.push(format!("{} {}", k, v));
        }
        printer.info(format!("  Engines:      {}", engs.join(", ")));
    }

    if !rec.permissions.is_empty() {
        printer.info("\n  Required Permissions:");
        for p in &rec.permissions {
            printer.info(format!("    * {}", p));
        }
    }

    if let Some(target) = target_opt {
        printer.info(format!("\n  Workspace:    {}", target.display()));
        printer.info(format!("  Status:       {}", installed_status));
        if is_installed {
            printer.info(format!(
                "  Files:        {} files ({:.1} KB)",
                file_count,
                (byte_size as f64) / 1024.0
            ));
        }
    } else {
        printer.info(
            "\n  Tip: pass --target <dir> to check installation status in a specific project.",
        );
    }
    println!();

    Ok(())
}

fn get_dir_size(dir: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(ft) = entry.file_type() {
                if ft.is_file() {
                    if let Ok(m) = entry.metadata() {
                        total += m.len();
                    }
                } else if ft.is_dir() {
                    total += get_dir_size(&entry.path());
                }
            }
        }
    }
    total
}
