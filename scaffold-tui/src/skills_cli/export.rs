use crate::skills_cli::errors::{find_suggestions, SkillsError};
use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::write::FileOptions;
use zip::ZipWriter;

pub fn run_export(
    index: &SkillIndex,
    printer: &Printer,
    slugs: &[String],
    output_path_opt: Option<&Path>,
) -> Result<()> {
    if slugs.is_empty() {
        return Err(SkillsError::MissingArgument {
            flag: "<skills...>".to_string(),
            subcommand: "export".to_string(),
        }
        .into());
    }

    let out_file_path = match output_path_opt {
        Some(p) => p.to_path_buf(),
        None => PathBuf::from("code-scaffold-skills-export.zip"),
    };

    let mut resolved = Vec::new();
    for slug in slugs {
        match index.get_by_slug(slug) {
            Some(rec) => resolved.push(rec),
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

    let file = File::create(&out_file_path).map_err(|e| SkillsError::IoError {
        operation: "create_file".to_string(),
        path: out_file_path.clone(),
        message: e.to_string(),
    })?;

    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let mut total_files = 0;
    let mut manifest_skills = Vec::new();

    for rec in &resolved {
        manifest_skills.push(json!({
            "slug": rec.slug,
            "version": rec.version,
            "category": rec.category
        }));

        let mut skill_files = Vec::new();
        collect_all_files(&rec.source_path, &rec.source_path, &mut skill_files)?;

        for (rel, abs) in skill_files {
            let zip_entry_name = format!(".skills/{}/{}", rec.slug, rel);
            zip.start_file(zip_entry_name, options)?;
            let mut f = File::open(abs)?;
            let mut buf = Vec::new();
            f.read_to_end(&mut buf)?;
            zip.write_all(&buf)?;
            total_files += 1;
        }
    }

    // Add export-manifest.json to root of archive
    let export_manifest = json!({
        "exportFormat": "code-scaffold-skills-v1",
        "exportedAt": crate::models::skill::chrono_now(),
        "scaffoldVersion": env!("CARGO_PKG_VERSION"),
        "totalSkills": resolved.len(),
        "totalFiles": total_files,
        "skills": manifest_skills
    });

    zip.start_file("export-manifest.json", options)?;
    zip.write_all(serde_json::to_string_pretty(&export_manifest)?.as_bytes())?;
    zip.finish()?;

    let file_size = std::fs::metadata(&out_file_path)
        .map(|m| m.len())
        .unwrap_or(0);

    if printer.is_json() {
        let out = json!({
            "archive": out_file_path.to_string_lossy(),
            "skillsCount": resolved.len(),
            "filesCount": total_files,
            "sizeBytes": file_size
        });
        printer.print_json(&out);
        return Ok(());
    }

    printer.header("Skill Export Complete");
    printer.success(format!(
        "Packaged {} skills ({} files) into \"{}\" ({:.1} KB)",
        resolved.len(),
        total_files,
        out_file_path.display(),
        (file_size as f64) / 1024.0
    ));
    println!();

    Ok(())
}

fn collect_all_files(root: &Path, current: &Path, out: &mut Vec<(String, PathBuf)>) -> Result<()> {
    if !current.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(current)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let p = entry.path();
        if ft.is_dir() {
            collect_all_files(root, &p, out)?;
        } else if ft.is_file() {
            let rel = p
                .strip_prefix(root)
                .unwrap_or(&p)
                .to_string_lossy()
                .replace('\\', "/");
            out.push((rel, p));
        }
    }
    Ok(())
}
