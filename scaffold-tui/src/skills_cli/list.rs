use crate::skills_cli::index::SkillIndex;
use crate::skills_cli::output::Printer;
use anyhow::Result;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn run_list(
    index: &SkillIndex,
    printer: &Printer,
    category_filter: Option<&str>,
    target_opt: Option<&Path>,
    installed_only: bool,
) -> Result<()> {
    if printer.is_json() {
        let mut categories_json = Vec::new();

        for (cat_name, indices) in index.categories() {
            if let Some(cf) = category_filter {
                if !cat_name.eq_ignore_ascii_case(cf) {
                    continue;
                }
            }

            let mut skills_arr = Vec::new();
            for idx in indices {
                let rec = &index.records()[*idx];
                if installed_only {
                    if let Some(target) = target_opt {
                        if !target.join(".skills").join(&rec.slug).exists() {
                            continue;
                        }
                    }
                }
                skills_arr.push(json!({
                    "slug": rec.slug,
                    "label": rec.label,
                    "version": rec.version,
                    "description": rec.description,
                    "category": rec.category,
                    "keywords": rec.keywords,
                    "permissions": rec.permissions,
                    "engines": rec.engines,
                    "entryPoint": rec.entry_point
                }));
            }

            if !skills_arr.is_empty() || !installed_only {
                categories_json.push(json!({
                    "name": cat_name,
                    "count": skills_arr.len(),
                    "skills": skills_arr
                }));
            }
        }

        let out = json!({
            "total": index.total(),
            "categories": categories_json
        });
        printer.print_json(&out);
        return Ok(());
    }

    printer.header(&format!(
        "Code Scaffold Skill Registry ({} skills across {} categories)",
        index.total(),
        index.categories().len()
    ));

    let mut displayed_count = 0;

    for (cat_name, indices) in index.categories() {
        if let Some(cf) = category_filter {
            if !cat_name.eq_ignore_ascii_case(cf) {
                continue;
            }
        }

        let mut matching_skills = Vec::new();
        for idx in indices {
            let rec = &index.records()[*idx];
            if installed_only {
                if let Some(target) = target_opt {
                    if !target.join(".skills").join(&rec.slug).exists() {
                        continue;
                    }
                }
            }
            matching_skills.push(rec);
        }

        if matching_skills.is_empty() && installed_only {
            continue;
        }

        printer.category_header(cat_name, matching_skills.len());
        for rec in matching_skills {
            let installed_suffix = if let Some(target) = target_opt {
                let installed_meta = target.join(".skills").join(&rec.slug).join("meta.json");
                if installed_meta.exists() {
                    let mut v_str = "installed".to_string();
                    if let Ok(c) = fs::read_to_string(&installed_meta) {
                        if let Ok(j) = serde_json::from_str::<serde_json::Value>(&c) {
                            if let Some(v) = j.get("version").and_then(|v| v.as_str()) {
                                if v != rec.version {
                                    v_str = format!("installed v{} -> upgrade v{}", v, rec.version);
                                } else {
                                    v_str = format!("installed v{}", v);
                                }
                            }
                        }
                    }
                    format!(" [{}]", v_str)
                } else {
                    String::new()
                }
            } else {
                String::new()
            };

            let desc = format!("{}{}", rec.description, installed_suffix);
            printer.skill_row(&rec.slug, &rec.version, &desc);
            displayed_count += 1;
        }
    }

    printer.info(format!("\nTotal skills shown: {}\n", displayed_count));
    Ok(())
}

pub fn run_categories(index: &SkillIndex, printer: &Printer) -> Result<()> {
    if printer.is_json() {
        let cats: Vec<_> = index
            .categories()
            .iter()
            .map(|(cat, ids)| {
                json!({
                    "name": cat,
                    "count": ids.len()
                })
            })
            .collect();
        let out = json!({
            "total_categories": index.categories().len(),
            "total_skills": index.total(),
            "categories": cats
        });
        printer.print_json(&out);
        return Ok(());
    }

    printer.header(&format!(
        "Skill Categories ({} categories, {} skills)",
        index.categories().len(),
        index.total()
    ));

    for (cat_name, indices) in index.categories() {
        printer.info(format!("  {:<36} {} skills", cat_name, indices.len()));
    }
    println!();
    Ok(())
}
