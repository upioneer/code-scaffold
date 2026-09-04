use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Deserialized from `.skills/<name>/skill-manifest.json`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillManifest {
    pub name: String,
    pub version: String,
    pub description: String,
    #[serde(rename = "entryPoint", default = "default_entry_point")]
    pub entry_point: String,
    #[serde(default)]
    pub engines: HashMap<String, String>,
    #[serde(rename = "requiredPermissions", default)]
    pub required_permissions: Vec<String>,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub keywords: Vec<String>,
}

fn default_entry_point() -> String {
    "./SKILL.md".to_string()
}

/// Deserialized from `.skills/<name>/meta.json`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMeta {
    pub label: String,
    pub description: String,
    pub version: String,
    pub target: String,
    #[serde(default)]
    pub logo: Vec<String>,
}

/// Unified skill record combining manifest and meta data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillRecord {
    /// Directory name (e.g. "playwright", "tasty")
    pub slug: String,
    /// Human-readable display label from meta.json (e.g. "Playwright")
    pub label: String,
    /// Description (prefer manifest description, fallback to meta)
    pub description: String,
    /// Whole-number version string (e.g. "4")
    pub version: String,
    /// Functional category (e.g. "Web Automation & Scraping")
    pub category: String,
    /// SEO and discovery search keywords
    pub keywords: Vec<String>,
    /// Required agent permissions
    pub permissions: Vec<String>,
    /// Engine constraints
    pub engines: HashMap<String, String>,
    /// Entry point path
    pub entry_point: String,
    /// Installation target relative path
    pub target: String,
    /// Absolute path to source directory in payload cache
    pub source_path: PathBuf,
    /// Multi-line ASCII block text logo
    pub logo: Vec<String>,
}

/// Installation status of a skill in a target project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledSkillStatus {
    pub slug: String,
    pub installed_version: String,
    pub available_version: String,
    pub is_outdated: bool,
    pub installed_path: PathBuf,
    pub file_count: usize,
    pub total_size: u64,
}

/// Lockfile entry for version pinning and integrity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLockEntry {
    pub slug: String,
    pub version: String,
    #[serde(rename = "installedAt")]
    pub installed_at: String,
    #[serde(rename = "sourceHash")]
    pub source_hash: String,
    #[serde(rename = "fileCount")]
    pub file_count: usize,
}

/// Lockfile schema stored at `<target>/.skills/.lockfile.json`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLockfile {
    #[serde(rename = "lockfileVersion")]
    pub lockfile_version: u32,
    #[serde(rename = "generatedAt")]
    pub generated_at: String,
    #[serde(rename = "scaffoldVersion")]
    pub scaffold_version: String,
    pub skills: Vec<SkillLockEntry>,
}

impl Default for SkillLockfile {
    fn default() -> Self {
        Self {
            lockfile_version: 1,
            generated_at: chrono_now(),
            scaffold_version: env!("CARGO_PKG_VERSION").to_string(),
            skills: Vec::new(),
        }
    }
}

pub fn chrono_now() -> String {
    // Simple UTC ISO8601 timestamp generator without extra chrono crate
    let now = std::time::SystemTime::now();
    let duration = now
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // Days since unix epoch
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let minutes = (time_secs % 3600) / 60;
    let seconds = time_secs % 60;

    // Convert days to year/month/day
    let (year, month, day) = days_to_date(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn days_to_date(days: u64) -> (i64, u32, u32) {
    let mut z = days as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1024 + doe / 1461 - doe / 14245) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
