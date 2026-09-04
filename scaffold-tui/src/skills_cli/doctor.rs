use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::lockfile::LockfileManager;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, serde::Serialize)]
pub struct SkillDiagnostic {
    pub slug: String,
    pub healthy: bool,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn run_doctor(index: &SkillIndex, printer: &Printer, target: &Path) -> Result<()> {
    let skills_dir = target.join(".skills");
    if !skills_dir.exists() {
        if printer.is_json() {
            printer.print_json(&json!({
                "target": target.to_string_lossy(),
                "status": "empty",
                "message": "No .skills directory found."
            }));
        } else {
            printer.warning(format!(
                "No .skills directory found in {}",
                target.display()
            ));
        }
        return Ok(());
    }

    let lock_mgr = LockfileManager::new(target);
    let lockfile = lock_mgr.read();

    let mut diagnostics = Vec::new();
    let mut total_healthy = 0;
    let mut total_warnings = 0;
    let mut total_errors = 0;

    let entries = match fs::read_dir(&skills_dir) {
        Ok(e) => e,
        Err(e) => {
            printer.error(format!("Failed to read .skills directory: {}", e));
            return Ok(());
        }
    };

    let mut installed_slugs = Vec::new();

    for entry in entries.flatten() {
        if let Ok(ft) = entry.file_type() {
            if ft.is_dir() {
                let slug = entry.file_name().to_string_lossy().to_string();
                if slug.starts_with('.') {
                    continue;
                }
                installed_slugs.push(slug);
            }
        }
    }

    installed_slugs.sort();

    for slug in &installed_slugs {
        let skill_dir = skills_dir.join(slug);
        let mut issues = Vec::new();
        let mut warnings = Vec::new();

        // 1. Check 5-File Anatomy
        let req_files = [
            ("SKILL.md", true),
            ("meta.json", true),
            ("skill-manifest.json", true),
            ("readme.md", true),
            ("sandbox/index.html", false), // warning if missing sandbox
        ];

        for (file_rel, required) in req_files {
            let fpath = skill_dir.join(file_rel);
            if !fpath.exists() {
                if required {
                    issues.push(format!("Missing required anatomy file: {}", file_rel));
                } else {
                    warnings.push(format!("Missing recommended demo: {}", file_rel));
                }
            }
        }

        // 2. Check meta.json and skill-manifest.json schemas & version sync
        let meta_path = skill_dir.join("meta.json");
        let manifest_path = skill_dir.join("skill-manifest.json");

        let mut meta_v = None;
        let mut manifest_v = None;

        if meta_path.exists() {
            match fs::read_to_string(&meta_path) {
                Ok(c) => match serde_json::from_str::<serde_json::Value>(&c) {
                    Ok(j) => {
                        meta_v = j
                            .get("version")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        if j.get("label").is_none() {
                            issues.push("meta.json missing 'label'".to_string());
                        }
                    }
                    Err(e) => issues.push(format!("meta.json is invalid JSON: {}", e)),
                },
                Err(e) => issues.push(format!("Failed to read meta.json: {}", e)),
            }
        }

        if manifest_path.exists() {
            match fs::read_to_string(&manifest_path) {
                Ok(c) => match serde_json::from_str::<serde_json::Value>(&c) {
                    Ok(j) => {
                        manifest_v = j
                            .get("version")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        if j.get("category").is_none() {
                            issues.push("skill-manifest.json missing 'category'".to_string());
                        }
                        if j.get("keywords").is_none() {
                            issues.push("skill-manifest.json missing 'keywords'".to_string());
                        }
                    }
                    Err(e) => issues.push(format!("skill-manifest.json is invalid JSON: {}", e)),
                },
                Err(e) => issues.push(format!("Failed to read skill-manifest.json: {}", e)),
            }
        }

        if let (Some(mv), Some(man_v)) = (&meta_v, &manifest_v) {
            if mv != man_v {
                issues.push(format!(
                    "Version mismatch: meta.json v{} vs skill-manifest.json v{}",
                    mv, man_v
                ));
            }
        }

        // 3. Check typography in readme.md (forbidden em/en dashes)
        let readme_path = skill_dir.join("readme.md");
        if readme_path.exists() {
            if let Ok(c) = fs::read_to_string(&readme_path) {
                if c.contains('—') {
                    issues.push("readme.md contains em dash ('—') violation".to_string());
                }
                if c.contains('–') {
                    issues.push("readme.md contains en dash ('–') violation".to_string());
                }
            }
        }

        // 4. Lockfile tracking check
        let in_lockfile = lockfile
            .skills
            .iter()
            .any(|s| s.slug.eq_ignore_ascii_case(slug));
        if !in_lockfile {
            warnings.push("Skill directory is unrecorded in .lockfile.json (orphan)".to_string());
        }

        let is_healthy = issues.is_empty();
        if is_healthy && warnings.is_empty() {
            total_healthy += 1;
        } else if is_healthy {
            total_warnings += 1;
        } else {
            total_errors += 1;
        }

        diagnostics.push(SkillDiagnostic {
            slug: slug.clone(),
            healthy: is_healthy,
            issues,
            warnings,
        });
    }

    if printer.is_json() {
        let out = json!({
            "target": target.to_string_lossy(),
            "healthy_count": total_healthy,
            "warning_count": total_warnings,
            "error_count": total_errors,
            "diagnostics": diagnostics
        });
        printer.print_json(&out);
        return Ok(());
    }

    printer.header(&format!("Skill Health Report for {}", target.display()));

    for d in &diagnostics {
        if d.healthy && d.warnings.is_empty() {
            printer.success(format!("{:<26} Healthy", d.slug));
        } else if d.healthy {
            printer.warning(format!("{:<26} Warnings:", d.slug));
            for w in &d.warnings {
                printer.info(format!("    * {}", w));
            }
        } else {
            printer.error(format!("{:<26} Issues detected:", d.slug));
            for i in &d.issues {
                printer.info(format!("    * {}", i));
            }
            for w in &d.warnings {
                printer.info(format!("    * [Warn] {}", w));
            }
        }
    }

    printer.info(format!(
        "\nSummary: {} healthy, {} with warnings, {} with errors.\n",
        total_healthy, total_warnings, total_errors
    ));

    Ok(())
}
