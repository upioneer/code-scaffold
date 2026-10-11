use crate::models::manifest::Manifest;
use anyhow::Result;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tokio::sync::mpsc::UnboundedSender;

/// Structured outcome of a scaffolding run, rendered as the deployment
/// report card and persisted to prefs as the previous deploy.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DeploymentReport {
    pub dirs_created: usize,
    #[serde(default)]
    pub dirs_retained: usize,
    pub artifacts_provisioned: usize,
    #[serde(default)]
    pub artifacts_retained: usize,
    pub skills_provisioned: usize,
    #[serde(default)]
    pub skills_retained: usize,
    #[serde(default)]
    pub skills_total: usize,
    pub env_keys_written: usize,
    #[serde(default)]
    pub env_keys_preserved: usize,
    #[serde(default)]
    pub env_keys_total: usize,
    pub agents_bound: usize,
    pub files_measured: usize,
    pub bytes_measured: u64,
    pub chars_measured: u64,
    pub lines_measured: u64,
    pub elapsed_secs: f64,
    pub finished_unix: u64,
}

/// Standard typing math: 60 words per minute at 5 characters per word.
pub fn keystroke_equivalent_minutes(chars: u64) -> f64 {
    chars as f64 / 300.0
}

pub fn format_keystroke_equivalent(chars: u64) -> String {
    let total_minutes = keystroke_equivalent_minutes(chars).round() as u64;
    if total_minutes < 1 {
        return "under a minute of typing at 60 wpm".to_string();
    }
    if total_minutes < 60 {
        return format!("~{} min of typing at 60 wpm", total_minutes);
    }
    format!(
        "~{}h {:02}m of typing at 60 wpm",
        total_minutes / 60,
        total_minutes % 60
    )
}

pub fn format_elapsed(secs: f64) -> String {
    if secs < 60.0 {
        format!("{:.1}s", secs)
    } else {
        let total = secs.round() as u64;
        format!("{}m {:02}s", total / 60, total % 60)
    }
}

pub fn format_bytes(bytes: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut value = bytes as f64;
    let mut unit = 0;
    while value >= 1024.0 && unit < UNITS.len() - 1 {
        value /= 1024.0;
        unit += 1;
    }
    if unit == 0 {
        format!("{} {}", bytes, UNITS[unit])
    } else {
        format!("{:.1} {}", value, UNITS[unit])
    }
}

/// Best-effort recursive measurement of a freshly scaffolded target.
/// Skips dependency and VCS trees; caps file count to bound runtime.
fn measure_target(root: &str) -> (usize, u64, u64, u64) {
    const SKIP: [&str; 3] = ["node_modules", ".git", "target"];
    const MAX_FILES: usize = 100_000;
    const MAX_TEXT_BYTES: u64 = 1_000_000;

    let mut files = 0usize;
    let mut bytes = 0u64;
    let mut chars = 0u64;
    let mut lines = 0u64;
    let mut stack = vec![PathBuf::from(root)];

    while let Some(dir) = stack.pop() {
        let entries = match fs::read_dir(&dir) {
            Ok(entries) => entries,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            if files >= MAX_FILES {
                return (files, bytes, chars, lines);
            }
            let path = entry.path();
            let file_type = match entry.file_type() {
                Ok(file_type) => file_type,
                Err(_) => continue,
            };
            if file_type.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if SKIP.contains(&name) {
                        continue;
                    }
                }
                stack.push(path);
            } else if file_type.is_file() {
                if let Ok(metadata) = entry.metadata() {
                    bytes += metadata.len();
                    if metadata.len() <= MAX_TEXT_BYTES {
                        if let Ok(content) = fs::read_to_string(&path) {
                            chars += content.chars().count() as u64;
                            lines += content.lines().count() as u64;
                        }
                    }
                }
                files += 1;
            }
        }
    }
    (files, bytes, chars, lines)
}

impl DeploymentReport {
    /// Render the report card body. `previous` is the last persisted deploy.
    pub fn card_lines(&self, previous: Option<&DeploymentReport>) -> Vec<String> {
        let dirs_display = if self.dirs_retained > 0 {
            format!(
                "Directories created: {} ({} existing)",
                self.dirs_created, self.dirs_retained
            )
        } else {
            format!("Directories created: {}", self.dirs_created)
        };

        let artifacts_display = if self.artifacts_retained > 0 {
            format!(
                "Artifacts provisioned: {} ({} existing)",
                self.artifacts_provisioned, self.artifacts_retained
            )
        } else {
            format!("Artifacts provisioned: {}", self.artifacts_provisioned)
        };

        let skills_display = if self.skills_retained > 0 {
            format!(
                "Skills provisioned: {} ({} retained, {} total)",
                self.skills_provisioned, self.skills_retained, self.skills_total
            )
        } else {
            format!("Skills provisioned: {}", self.skills_provisioned)
        };

        let env_display = if self.env_keys_preserved > 0 {
            format!(
                ".env keys written: {} ({} preserved, {} total)",
                self.env_keys_written, self.env_keys_preserved, self.env_keys_total
            )
        } else {
            format!(".env keys written: {}", self.env_keys_written)
        };

        let mut lines = vec![
            "*** DEPLOYMENT REPORT ***".to_string(),
            "".to_string(),
            dirs_display,
            artifacts_display,
            skills_display,
            format!("Agent contexts bound: {}", self.agents_bound),
            env_display,
            format!(
                "Files in target: {} ({}, {} lines)",
                self.files_measured,
                format_bytes(self.bytes_measured),
                self.lines_measured
            ),
            format!(
                "Keystroke equivalent: {}",
                format_keystroke_equivalent(self.chars_measured)
            ),
            format!("Elapsed: {}", format_elapsed(self.elapsed_secs)),
        ];
        if let Some(prev) = previous {
            let age_secs = self.finished_unix.saturating_sub(prev.finished_unix).max(1);
            lines.push("".to_string());
            lines.push(format!(
                "Previous deploy: {} files in {} ({} ago)",
                prev.files_measured,
                format_elapsed(prev.elapsed_secs),
                format_age(age_secs)
            ));
        }
        lines.push("".to_string());
        lines.push("Press [Esc] to exit.".to_string());
        lines
    }
}

fn format_age(secs: u64) -> String {
    if secs < 60 {
        format!("{}s", secs)
    } else if secs < 3600 {
        format!("{}m", secs / 60)
    } else if secs < 86400 {
        format!("{}h", secs / 3600)
    } else {
        format!("{}d", secs / 86400)
    }
}

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

/// Placeholder `.env` defaults seeded when a platform skill is selected.
/// Keys and placeholder values mirror `.templates/env.example`; the
/// corresponding skill self-heals real values with the user at deploy time.
/// Existing entries are never overwritten.
fn platform_env_defaults(skill_id: &str) -> &'static [(&'static str, &'static str)] {
    match skill_id.to_lowercase().as_str() {
        "github" => &[
            ("GITHUB_USER", "your_github_username"),
            ("GITHUB_EMAIL", "your_github_email@example.com"),
            (
                "GITHUB_REMOTE_URL",
                "https://github.com/username/repository.git",
            ),
            ("GITHUB_VISIBILITY", "public"),
            ("GITHUB_BRANCH", "main"),
        ],
        "vercel" => &[
            ("VERCEL_ORG_ID", "org_placeholder"),
            ("VERCEL_PROJECT_ID", "prj_placeholder"),
            ("VERCEL_TOKEN", ""),
        ],
        "firebase" => &[
            ("FIREBASE_PROJECT_ID", "placeholder_project_id"),
            ("FIREBASE_SITE_ID", "placeholder_site_id"),
            ("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSy_placeholder"),
            (
                "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
                "placeholder.firebaseapp.com",
            ),
            ("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "placeholder_project_id"),
            (
                "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
                "placeholder.appspot.com",
            ),
            ("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "000000000000"),
            (
                "NEXT_PUBLIC_FIREBASE_APP_ID",
                "1:000000000000:web:placeholder",
            ),
            ("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-PLACEHOLDER"),
        ],
        _ => &[],
    }
}

/// Extracts all environment variable keys from an existing `.env` file content.
/// Skips comment lines (starting with '#') and blank lines.
pub fn parse_env_keys(content: &str) -> std::collections::HashSet<String> {
    let mut keys = std::collections::HashSet::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if let Some((k, _)) = trimmed.split_once('=') {
            let key = k.trim().to_string();
            if !key.is_empty() {
                keys.insert(key);
            }
        }
    }
    keys
}

pub fn apply_skill_env_defaults(
    env: &mut std::collections::HashMap<String, String>,
    skills: &[crate::models::manifest::SkillEntry],
) {
    for skill in skills {
        for (k, v) in platform_env_defaults(&skill.id)
            .iter()
            .chain(platform_env_defaults(&skill.label).iter())
        {
            env.entry(k.to_string()).or_insert_with(|| v.to_string());
        }
    }
}

pub async fn execute(
    manifest: &Manifest,
    tx: UnboundedSender<String>,
    payload_dir: &std::path::PathBuf,
    target_folder: &str,
) -> Result<DeploymentReport> {
    let started = Instant::now();
    let mut report = DeploymentReport::default();
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
                    report.dirs_created += 1;
                    let _ = tx.send(format!(" -> Created target directory: {}", app.target));
                }
            } else {
                report.dirs_retained += 1;
                let _ = tx.send(format!(" -> Directory exists (retained): {}", app.target));
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
                    report.artifacts_provisioned += 1;
                    let _ = tx.send(format!(" -> Initialized artifact: {}", artifact.target));
                }
            } else {
                report.artifacts_retained += 1;
                let _ = tx.send(format!(
                    " -> Artifact exists (retained): {}",
                    artifact.target
                ));
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
                                report.artifacts_provisioned += 1;
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
                    report.artifacts_retained += 1;
                    let _ = tx.send(format!(
                        " -> Artifact exists (retained): {}",
                        artifact.target
                    ));
                } else if let Err(e) = fs::write(&path, content) {
                    let _ = tx.send(format!(
                        " -> (Error) Failed to write artifact {}: {}",
                        artifact.target, e
                    ));
                } else {
                    report.artifacts_provisioned += 1;
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
                            report.artifacts_retained += 1;
                            let _ = tx.send(format!(
                                " -> Artifact exists (retained): {}",
                                artifact.target
                            ));
                        }
                        Ok(true) => {
                            report.artifacts_provisioned += 1;
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
            let already_installed = target_path.exists();
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
                    } else if already_installed {
                        report.skills_retained += 1;
                        let _ = tx.send(format!(" -> Retained existing module: {}", skill.label));
                    } else {
                        report.skills_provisioned += 1;
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
    let total_on_disk =
        if let Ok(entries) = fs::read_dir(PathBuf::from(target_folder).join(".skills")) {
            entries
                .flatten()
                .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
                .count()
        } else {
            report.skills_provisioned + report.skills_retained
        };
    report.skills_total = total_on_disk.max(report.skills_provisioned + report.skills_retained);

    if !manifest.skills.is_empty() {
        let _ = tx.send(" -> Synchronizing Universal Agent Pointers (12 Agents)...".to_string());
        if let Ok(updated) = crate::skills_cli::pointers::sync_universal_agent_pointers(
            std::path::Path::new(target_folder),
        ) {
            report.agents_bound = updated.len();
            if !updated.is_empty() {
                let _ = tx.send(format!(
                    " -> Bound skill context for {} agents: {}",
                    updated.len(),
                    updated.join(", ")
                ));
            } else {
                let _ = tx.send(" -> Agent pointer bindings up to date".to_string());
            }
        }
    }
    tokio::time::sleep(Duration::from_millis(500)).await; // UX execution padding

    // 5. Environmental Variable Export
    let _ = tx.send("".to_string());
    let _ = tx.send("Synchronizing .env definitions...".to_string());
    // Seed platform placeholder keys for every selected platform skill so
    // the generated `.env` is created prepopulated and the owning skill can
    // self-heal real values with the user afterwards.
    let mut env = manifest.env.clone();
    apply_skill_env_defaults(&mut env, &manifest.skills);

    let env_path = PathBuf::from(target_folder).join(".env");
    if env_path.exists() {
        let existing_raw = fs::read_to_string(&env_path).unwrap_or_default();
        let existing_keys = parse_env_keys(&existing_raw);
        report.env_keys_preserved = existing_keys.len();

        let mut to_append = Vec::new();
        let mut sorted_env: Vec<_> = env.into_iter().collect();
        sorted_env.sort_by(|a, b| a.0.cmp(&b.0));

        for (k, v) in sorted_env {
            if !existing_keys.contains(&k) {
                to_append.push(format!("{}={}", k, v));
            }
        }

        report.env_keys_written = to_append.len();
        report.env_keys_total = report.env_keys_preserved + report.env_keys_written;

        if !to_append.is_empty() {
            let mut updated_content = existing_raw;
            if !updated_content.is_empty() && !updated_content.ends_with('\n') {
                updated_content.push('\n');
            }
            for line in &to_append {
                updated_content.push_str(line);
                updated_content.push('\n');
            }
            if let Err(e) = fs::write(&env_path, updated_content) {
                let _ = tx.send(format!(
                    " -> (Error) Failed to append new keys to .env at {:?}: {}",
                    env_path, e
                ));
            } else {
                let _ = tx.send(format!(
                    " -> Appended {} new .env keys ({} preserved, {} total)",
                    report.env_keys_written, report.env_keys_preserved, report.env_keys_total
                ));
            }
        } else {
            let _ = tx.send(format!(
                " -> All {} .env keys already present and preserved",
                report.env_keys_preserved
            ));
        }
    } else {
        let mut sorted_env: Vec<_> = env.into_iter().collect();
        sorted_env.sort_by(|a, b| a.0.cmp(&b.0));
        let mut env_block = String::new();
        for (k, v) in &sorted_env {
            env_block.push_str(&format!("{}={}\n", k, v));
        }
        if let Err(e) = fs::write(&env_path, env_block) {
            let _ = tx.send(format!(
                " -> (Error) Failed to write .env at {:?}: {}",
                env_path, e
            ));
        } else {
            report.env_keys_written = sorted_env.len();
            report.env_keys_preserved = 0;
            report.env_keys_total = sorted_env.len();
            let _ = tx.send(format!(
                " -> Written localized .env definitions ({} keys)",
                report.env_keys_written
            ));
        }
    }

    let _ = tx.send("".to_string());
    let _ = tx.send("Execution Cycle Completed Successfully!".to_string());
    let _ = tx.send("=========================================".to_string());

    let (files, bytes, chars, lines) = measure_target(target_folder);
    report.files_measured = files;
    report.bytes_measured = bytes;
    report.chars_measured = chars;
    report.lines_measured = lines;
    report.elapsed_secs = started.elapsed().as_secs_f64();
    report.finished_unix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn skill(id: &str) -> crate::models::manifest::SkillEntry {
        crate::models::manifest::SkillEntry {
            id: id.to_string(),
            label: id.to_string(),
            source: None,
            target: id.to_string(),
            method: "copy".into(),
        }
    }

    #[test]
    fn test_github_skill_seeds_github_env_defaults() {
        let mut env = HashMap::new();
        apply_skill_env_defaults(&mut env, &[skill("github")]);
        for key in [
            "GITHUB_USER",
            "GITHUB_EMAIL",
            "GITHUB_REMOTE_URL",
            "GITHUB_VISIBILITY",
            "GITHUB_BRANCH",
        ] {
            assert!(env.contains_key(key), "missing {}", key);
        }
    }

    #[test]
    fn test_firebase_and_vercel_skills_seed_their_own_keys_only() {
        let mut env = HashMap::new();
        apply_skill_env_defaults(&mut env, &[skill("firebase"), skill("vercel")]);
        assert!(env.contains_key("FIREBASE_PROJECT_ID"));
        assert!(env.contains_key("NEXT_PUBLIC_FIREBASE_PROJECT_ID"));
        assert!(env.contains_key("NEXT_PUBLIC_FIREBASE_APP_ID"));
        assert!(env.contains_key("VERCEL_ORG_ID"));
        assert!(env.contains_key("VERCEL_PROJECT_ID"));
        assert!(
            !env.contains_key("GITHUB_USER"),
            "unselected platform must not seed keys"
        );
    }

    #[test]
    fn test_existing_env_values_are_never_overwritten() {
        let mut env = HashMap::new();
        env.insert("GITHUB_BRANCH".to_string(), "staging".to_string());
        apply_skill_env_defaults(&mut env, &[skill("github")]);
        assert_eq!(env.get("GITHUB_BRANCH").unwrap(), "staging");
    }

    #[test]
    fn test_unknown_skill_seeds_nothing() {
        let mut env = HashMap::new();
        apply_skill_env_defaults(&mut env, &[skill("braille-animations")]);
        assert!(env.is_empty());
    }

    #[test]
    fn test_keystroke_equivalent_math() {
        assert_eq!(keystroke_equivalent_minutes(0), 0.0);
        assert_eq!(keystroke_equivalent_minutes(12_000), 40.0);
        assert_eq!(keystroke_equivalent_minutes(300), 1.0);
    }

    #[test]
    fn test_keystroke_equivalent_formatting() {
        assert!(format_keystroke_equivalent(50).contains("under a minute"));
        assert_eq!(
            format_keystroke_equivalent(9_000),
            "~30 min of typing at 60 wpm"
        );
        assert_eq!(
            format_keystroke_equivalent(48_000),
            "~2h 40m of typing at 60 wpm"
        );
    }

    #[test]
    fn test_elapsed_and_byte_formatting() {
        assert_eq!(format_elapsed(7.76), "7.8s");
        assert_eq!(format_elapsed(125.0), "2m 05s");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(2048), "2.0 KB");
    }

    #[test]
    fn test_card_reports_counts_and_previous() {
        let current = DeploymentReport {
            dirs_created: 8,
            artifacts_provisioned: 14,
            skills_provisioned: 6,
            env_keys_written: 24,
            agents_bound: 12,
            files_measured: 312,
            bytes_measured: 1_200_000,
            chars_measured: 240_000,
            lines_measured: 48_210,
            elapsed_secs: 7.8,
            finished_unix: 1_000_100,
            ..Default::default()
        };
        let previous = DeploymentReport {
            files_measured: 300,
            elapsed_secs: 6.9,
            finished_unix: 1_000_000,
            ..Default::default()
        };
        let card = current.card_lines(Some(&previous)).join("\n");
        assert!(card.contains("Directories created: 8"));
        assert!(card.contains("Agent contexts bound: 12"));
        assert!(card.contains(".env keys written: 24"));
        assert!(card.contains("Keystroke equivalent: ~13h 20m of typing at 60 wpm"));
        assert!(card.contains("Previous deploy: 300 files in 6.9s (1m ago)"));
        assert!(card.contains("Press [Esc] to exit."));
    }

    #[test]
    fn test_card_reports_retained_deltas_formatting() {
        let report = DeploymentReport {
            dirs_created: 1,
            dirs_retained: 7,
            artifacts_provisioned: 2,
            artifacts_retained: 12,
            skills_provisioned: 1,
            skills_retained: 10,
            skills_total: 11,
            env_keys_written: 0,
            env_keys_preserved: 17,
            env_keys_total: 17,
            agents_bound: 12,
            files_measured: 350,
            bytes_measured: 1_500_000,
            chars_measured: 250_000,
            lines_measured: 50_000,
            elapsed_secs: 5.5,
            finished_unix: 1_000_200,
        };
        let card = report.card_lines(None).join("\n");
        assert!(card.contains("Directories created: 1 (7 existing)"));
        assert!(card.contains("Artifacts provisioned: 2 (12 existing)"));
        assert!(card.contains("Skills provisioned: 1 (10 retained, 11 total)"));
        assert!(card.contains(".env keys written: 0 (17 preserved, 17 total)"));
        assert!(card.contains("Agent contexts bound: 12"));
    }

    #[test]
    fn test_parse_env_keys_basic_and_comments() {
        let sample = r#"
# Project secrets
GITHUB_USER=octocat
GITHUB_REMOTE_URL=https://github.com/example/repo.git

# Next.js Public
NEXT_PUBLIC_API_URL=https://api.example.com
EMPTY_KEY=
"#;
        let keys = parse_env_keys(sample);
        assert!(keys.contains("GITHUB_USER"));
        assert!(keys.contains("GITHUB_REMOTE_URL"));
        assert!(keys.contains("NEXT_PUBLIC_API_URL"));
        assert!(keys.contains("EMPTY_KEY"));
        assert!(!keys.contains("# Project secrets"));
        assert_eq!(keys.len(), 4);
    }

    #[test]
    fn test_measure_target_counts_files_and_text() {
        let root = std::env::temp_dir().join(format!("cs-measure-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("sub")).unwrap();
        std::fs::write(root.join("a.txt"), "hello\nworld\n").unwrap();
        std::fs::write(root.join("sub").join("b.txt"), "x").unwrap();
        std::fs::write(root.join("bin.dat"), [0u8, 159, 146, 150]).unwrap();

        let (files, bytes, chars, lines) = measure_target(&root.to_string_lossy());
        assert_eq!(files, 3);
        assert!(bytes >= 17);
        assert_eq!(chars, 13);
        assert_eq!(lines, 3);

        let _ = std::fs::remove_dir_all(&root);
    }
}
