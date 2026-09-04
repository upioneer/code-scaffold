use crate::skills_cli::errors::{find_suggestions, SkillsError};
use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, serde::Serialize)]
pub struct DiffSummary {
    pub slug: String,
    pub installed_version: String,
    pub available_version: String,
    pub added: Vec<String>,
    pub removed: Vec<String>,
    pub modified: Vec<String>,
}

pub fn run_diff(index: &SkillIndex, printer: &Printer, slug: &str, target: &Path) -> Result<()> {
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

    let installed_dir = target.join(".skills").join(&rec.slug);
    if !installed_dir.exists() {
        return Err(SkillsError::NotInstalled {
            slug: slug.to_string(),
        }
        .into());
    }

    let mut installed_ver = "unknown".to_string();
    let meta_path = installed_dir.join("meta.json");
    if let Ok(c) = fs::read_to_string(&meta_path) {
        if let Ok(j) = serde_json::from_str::<serde_json::Value>(&c) {
            if let Some(v) = j.get("version").and_then(|v| v.as_str()) {
                installed_ver = v.to_string();
            }
        }
    }

    let mut inst_files = HashMap::new();
    collect_files_with_content(&installed_dir, &installed_dir, &mut inst_files)?;

    let mut latest_files = HashMap::new();
    collect_files_with_content(&rec.source_path, &rec.source_path, &mut latest_files)?;

    let mut added = Vec::new();
    let mut removed = Vec::new();
    let mut modified = Vec::new();

    for (path, latest_bytes) in &latest_files {
        match inst_files.get(path) {
            None => added.push(path.clone()),
            Some(inst_bytes) => {
                if inst_bytes != latest_bytes {
                    modified.push(path.clone());
                }
            }
        }
    }

    for path in inst_files.keys() {
        if !latest_files.contains_key(path) {
            removed.push(path.clone());
        }
    }

    added.sort();
    removed.sort();
    modified.sort();

    let diff = DiffSummary {
        slug: slug.to_string(),
        installed_version: installed_ver.clone(),
        available_version: rec.version.clone(),
        added,
        removed,
        modified,
    };

    if printer.is_json() {
        printer.print_json(&diff);
        return Ok(());
    }

    printer.header(&format!(
        "Diff: {} (installed v{} -> available v{})",
        rec.slug, installed_ver, rec.version
    ));

    if diff.added.is_empty() && diff.removed.is_empty() && diff.modified.is_empty() {
        printer.success("Installed skill is byte-for-byte identical to the latest version.");
        println!();
        return Ok(());
    }

    if !diff.added.is_empty() {
        printer.info("\n  Added in latest:");
        for a in &diff.added {
            printer.info(format!("    + {}", a));
        }
    }

    if !diff.modified.is_empty() {
        printer.info("\n  Modified:");
        for m in &diff.modified {
            printer.info(format!("    ~ {}", m));
        }
    }

    if !diff.removed.is_empty() {
        printer.info("\n  Removed in latest:");
        for r in &diff.removed {
            printer.info(format!("    - {}", r));
        }
    }

    printer.info(format!(
        "\nSummary: {} added, {} modified, {} removed.\n",
        diff.added.len(),
        diff.modified.len(),
        diff.removed.len()
    ));

    Ok(())
}

fn collect_files_with_content(
    root: &Path,
    current: &Path,
    out: &mut HashMap<String, Vec<u8>>,
) -> Result<()> {
    if !current.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(current)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let p = entry.path();
        if ft.is_dir() {
            collect_files_with_content(root, &p, out)?;
        } else if ft.is_file() {
            let rel = p
                .strip_prefix(root)
                .unwrap_or(&p)
                .to_string_lossy()
                .replace('\\', "/");
            if let Ok(bytes) = fs::read(&p) {
                out.insert(rel, bytes);
            }
        }
    }
    Ok(())
}
