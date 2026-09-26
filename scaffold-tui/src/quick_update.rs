use anyhow::{bail, Result};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UpdateTarget {
    Skills,
    License,
    Binary,
}

impl UpdateTarget {
    fn parse(token: &str) -> Option<Vec<UpdateTarget>> {
        let lowered = token.to_lowercase();
        match lowered.as_str() {
            "skills" | "skill" => Some(vec![UpdateTarget::Skills]),
            "license" | "licenses" => Some(vec![UpdateTarget::License]),
            "binary" | "self" => Some(vec![UpdateTarget::Binary]),
            "all" => Some(vec![
                UpdateTarget::Skills,
                UpdateTarget::License,
                UpdateTarget::Binary,
            ]),
            _ => None,
        }
    }

    pub fn usage_targets() -> &'static str {
        "skills | license | binary | all"
    }
}

#[derive(Debug, Default)]
pub struct UpdateRequest {
    pub targets: Vec<UpdateTarget>,
    pub license: Option<String>,
    pub target_dir: Option<PathBuf>,
    pub dry_run: bool,
}

pub fn update_usage() -> String {
    format!(
        "Usage: code-scaffold --update <target>... [--license <label>] [--target <DIR>] [--dry-run]\n\
         Targets: {} (repeatable, or \"all\" for every stream)\n\
         Examples:\n  \
         code-scaffold --update skills\n  \
         code-scaffold --update license --license \"MIT License\"\n  \
         code-scaffold --update license --target \"C:\\my_project\"\n  \
         code-scaffold --update binary\n  \
         code-scaffold --update all --dry-run",
        UpdateTarget::usage_targets()
    )
}

pub fn parse_update_args(args: &[String]) -> Result<UpdateRequest> {
    let pos = args.iter().position(|a| a == "--update");
    let start = match pos {
        Some(i) => i + 1,
        None => bail!("--update flag not found"),
    };

    let mut request = UpdateRequest::default();
    let mut i = start;
    while i < args.len() {
        match args[i].as_str() {
            "--license" => {
                if i + 1 < args.len() {
                    request.license = Some(args[i + 1].trim().to_string());
                    i += 1;
                }
            }
            "--target" => {
                if i + 1 < args.len() {
                    request.target_dir = Some(PathBuf::from(&args[i + 1]));
                    i += 1;
                }
            }
            "--dry-run" => {
                request.dry_run = true;
            }
            other => {
                if other.starts_with('-') {
                    break;
                }
                match UpdateTarget::parse(other) {
                    Some(expanded) => {
                        for t in expanded {
                            if !request.targets.contains(&t) {
                                request.targets.push(t);
                            }
                        }
                    }
                    None => bail!("Unknown --update target \"{}\". {}", other, update_usage()),
                }
            }
        }
        i += 1;
    }

    if request.targets.is_empty() {
        bail!("No --update target given. {}", update_usage());
    }

    Ok(request)
}

pub fn list_licenses(payload_dir: &Path) -> Vec<String> {
    let mut names = vec!["None".to_string()];
    let dir = payload_dir.join(".licenses");
    if let Ok(entries) = std::fs::read_dir(&dir) {
        let mut found: Vec<String> = entries
            .flatten()
            .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
            .map(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.strip_suffix(".md").unwrap_or(&name).to_string()
            })
            .collect();
        found.sort();
        names.append(&mut found);
    }
    names
}

pub fn resolve_license(catalog: &[String], wanted: &str) -> Option<String> {
    catalog
        .iter()
        .find(|name| name.eq_ignore_ascii_case(wanted.trim()))
        .cloned()
}

pub fn prompt_license_choice(catalog: &[String]) -> Result<String> {
    println!("Select a license payload:");
    for (idx, name) in catalog.iter().enumerate() {
        println!("  [{}] {}", idx + 1, name);
    }
    print!("Choice (number or name): ");
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    let input = input.trim();
    if input.is_empty() {
        bail!("No license selected.");
    }
    if let Ok(n) = input.parse::<usize>() {
        if n >= 1 && n <= catalog.len() {
            return Ok(catalog[n - 1].clone());
        }
        bail!("Choice {} is out of range (1-{}).", n, catalog.len());
    }
    match resolve_license(catalog, input) {
        Some(name) => Ok(name),
        None => bail!(
            "Unknown license \"{}\". Valid: {}.",
            input,
            catalog.join(", ")
        ),
    }
}

pub fn write_license_file(
    payload_dir: &Path,
    target_dir: &Path,
    label: &str,
    dry_run: bool,
) -> Result<Option<PathBuf>> {
    if label.eq_ignore_ascii_case("none") {
        println!("License \"None\": no file written (all default copyright laws apply).");
        return Ok(None);
    }
    let source = payload_dir.join(".licenses").join(format!("{}.md", label));
    if !source.exists() {
        bail!("License payload not found: {}", source.display());
    }
    let dest = target_dir.join("LICENSE.md");
    if dry_run {
        println!(
            "Dry run: would copy {} -> {}",
            source.display(),
            dest.display()
        );
        return Ok(Some(dest));
    }
    std::fs::copy(&source, &dest)?;
    println!("Wrote {} from payload \"{}\".", dest.display(), label);
    Ok(Some(dest))
}

pub async fn run(payload_dir: PathBuf, args: &[String]) -> Result<()> {
    let request = match parse_update_args(args) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    };

    let default_target = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let target = request.target_dir.as_deref().unwrap_or(&default_target);

    for update_target in &request.targets {
        match update_target {
            UpdateTarget::Skills => {
                use crate::skills_cli::index::SkillIndex;
                use crate::skills_cli::output::{OutputConfig, Printer};
                let index = SkillIndex::build(&payload_dir)?;
                let printer = Printer::new(OutputConfig::default());
                crate::skills_cli::update::run_update(
                    &index,
                    &printer,
                    &[],
                    target,
                    true,
                    false,
                    request.dry_run,
                )?;
            }
            UpdateTarget::License => {
                let catalog = list_licenses(&payload_dir);
                let label = match &request.license {
                    Some(wanted) => match resolve_license(&catalog, wanted) {
                        Some(name) => name,
                        None => bail!(
                            "Unknown license \"{}\". Valid: {}.",
                            wanted,
                            catalog.join(", ")
                        ),
                    },
                    None => prompt_license_choice(&catalog)?,
                };
                write_license_file(&payload_dir, target, &label, request.dry_run)?;
            }
            UpdateTarget::Binary => {
                if request.dry_run {
                    println!("Dry run: would check for and apply a binary self-update.");
                } else {
                    crate::updater::perform_update()?;
                    println!("Binary self-update check complete.");
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn argvec(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    fn unique_dir(prefix: &str) -> PathBuf {
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!(
            "quick-update-{}-{}-{}",
            prefix,
            std::process::id(),
            n
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn parses_single_target() {
        let req = parse_update_args(&argvec(&["code-scaffold", "--update", "skills"])).unwrap();
        assert_eq!(req.targets, vec![UpdateTarget::Skills]);
        assert!(req.license.is_none());
        assert!(!req.dry_run);
    }

    #[test]
    fn parses_combined_targets_in_order() {
        let req = parse_update_args(&argvec(&[
            "code-scaffold",
            "--update",
            "license",
            "skills",
            "binary",
        ]))
        .unwrap();
        assert_eq!(
            req.targets,
            vec![
                UpdateTarget::License,
                UpdateTarget::Skills,
                UpdateTarget::Binary
            ]
        );
    }

    #[test]
    fn all_expands_to_every_stream_once() {
        let req =
            parse_update_args(&argvec(&["code-scaffold", "--update", "all", "skills"])).unwrap();
        assert_eq!(
            req.targets,
            vec![
                UpdateTarget::Skills,
                UpdateTarget::License,
                UpdateTarget::Binary
            ]
        );
    }

    #[test]
    fn target_matching_is_case_insensitive() {
        let req = parse_update_args(&argvec(&["code-scaffold", "--update", "Skills"])).unwrap();
        assert_eq!(req.targets, vec![UpdateTarget::Skills]);
    }

    #[test]
    fn parses_license_target_and_options() {
        let req = parse_update_args(&argvec(&[
            "code-scaffold",
            "--update",
            "license",
            "--license",
            "MIT License",
            "--target",
            "C:\\proj",
            "--dry-run",
        ]))
        .unwrap();
        assert_eq!(req.targets, vec![UpdateTarget::License]);
        assert_eq!(req.license.as_deref(), Some("MIT License"));
        assert_eq!(req.target_dir, Some(PathBuf::from("C:\\proj")));
        assert!(req.dry_run);
    }

    #[test]
    fn stops_collecting_targets_at_next_flag() {
        let req = parse_update_args(&argvec(&[
            "code-scaffold",
            "--update",
            "skills",
            "--dry-run",
        ]))
        .unwrap();
        assert_eq!(req.targets, vec![UpdateTarget::Skills]);
        assert!(req.dry_run);
    }

    #[test]
    fn rejects_unknown_target() {
        assert!(parse_update_args(&argvec(&["code-scaffold", "--update", "themes"])).is_err());
    }

    #[test]
    fn rejects_bare_update_flag() {
        assert!(parse_update_args(&argvec(&["code-scaffold", "--update"])).is_err());
    }

    #[test]
    fn catalog_lists_payload_licenses_plus_none() {
        let payload = unique_dir("payload");
        std::fs::create_dir_all(payload.join(".licenses")).unwrap();
        std::fs::write(payload.join(".licenses").join("MIT License.md"), "mit").unwrap();
        std::fs::write(payload.join(".licenses").join("Apache 2.0.md"), "apache").unwrap();

        let catalog = list_licenses(&payload);
        assert_eq!(catalog, vec!["None", "Apache 2.0", "MIT License"]);

        std::fs::remove_dir_all(&payload).unwrap();
    }

    #[test]
    fn resolve_matches_case_insensitively() {
        let catalog = vec!["None".to_string(), "MIT License".to_string()];
        assert_eq!(
            resolve_license(&catalog, "mit license").as_deref(),
            Some("MIT License")
        );
        assert!(resolve_license(&catalog, "GPL v9").is_none());
    }

    #[test]
    fn write_copies_payload_to_license_md() {
        let payload = unique_dir("payload");
        let target = unique_dir("target");
        std::fs::create_dir_all(payload.join(".licenses")).unwrap();
        std::fs::write(payload.join(".licenses").join("MIT License.md"), "mit-body").unwrap();

        let dest = write_license_file(&payload, &target, "MIT License", false)
            .unwrap()
            .unwrap();
        assert_eq!(dest, target.join("LICENSE.md"));
        assert_eq!(std::fs::read_to_string(&dest).unwrap(), "mit-body");

        std::fs::remove_dir_all(&payload).unwrap();
        std::fs::remove_dir_all(&target).unwrap();
    }

    #[test]
    fn write_none_selection_writes_no_file() {
        let payload = unique_dir("payload");
        let target = unique_dir("target");

        let dest = write_license_file(&payload, &target, "None", false).unwrap();
        assert!(dest.is_none());
        assert!(!target.join("LICENSE.md").exists());

        std::fs::remove_dir_all(&payload).unwrap();
        std::fs::remove_dir_all(&target).unwrap();
    }

    #[test]
    fn write_dry_run_writes_no_file() {
        let payload = unique_dir("payload");
        let target = unique_dir("target");
        std::fs::create_dir_all(payload.join(".licenses")).unwrap();
        std::fs::write(payload.join(".licenses").join("MIT License.md"), "mit-body").unwrap();

        let dest = write_license_file(&payload, &target, "MIT License", true)
            .unwrap()
            .unwrap();
        assert_eq!(dest, target.join("LICENSE.md"));
        assert!(!dest.exists());

        std::fs::remove_dir_all(&payload).unwrap();
        std::fs::remove_dir_all(&target).unwrap();
    }

    #[test]
    fn write_missing_payload_errors() {
        let payload = unique_dir("payload");
        let target = unique_dir("target");

        assert!(write_license_file(&payload, &target, "MIT License", false).is_err());

        std::fs::remove_dir_all(&payload).unwrap();
        std::fs::remove_dir_all(&target).unwrap();
    }
}
