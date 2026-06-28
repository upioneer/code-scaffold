use directories::ProjectDirs;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

fn get_prefs_path() -> Option<PathBuf> {
    if let Some(proj_dirs) = ProjectDirs::from("com", "upioneer", "code-scaffold") {
        let config_dir = proj_dirs.config_dir();
        if !config_dir.exists() {
            let _ = fs::create_dir_all(config_dir);
        }
        Some(config_dir.join("prefs.json"))
    } else {
        None
    }
}

fn load_prefs() -> Value {
    if let Some(path) = get_prefs_path() {
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(json) = serde_json::from_str::<Value>(&content) {
                return json;
            }
        }
    }
    json!({})
}

fn save_prefs(prefs: &Value) {
    if let Some(path) = get_prefs_path() {
        let _ = fs::write(
            path,
            serde_json::to_string_pretty(prefs).unwrap_or_default(),
        );
    }
}

pub fn load_theme_idx() -> usize {
    let prefs = load_prefs();
    prefs
        .get("theme_idx")
        .and_then(|v| v.as_u64())
        .map(|v| v as usize)
        .unwrap_or(1)
}

pub fn save_theme_idx(idx: usize) {
    let mut prefs = load_prefs();
    prefs["theme_idx"] = json!(idx);
    save_prefs(&prefs);
}

pub fn load_custom_skills() -> Vec<String> {
    let prefs = load_prefs();
    prefs
        .get("custom_skills")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

pub fn add_custom_skill(url: &str) {
    let mut prefs = load_prefs();
    let mut skills = load_custom_skills();
    if !skills.contains(&url.to_string()) {
        skills.push(url.to_string());
        prefs["custom_skills"] = json!(skills);
        save_prefs(&prefs);
    }
}
