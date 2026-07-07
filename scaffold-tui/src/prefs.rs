use crate::theme::Theme;
use directories::ProjectDirs;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

fn get_prefs_path() -> Option<PathBuf> {
    #[cfg(debug_assertions)]
    let app_name = "code-scaffold-dev";
    #[cfg(not(debug_assertions))]
    let app_name = "code-scaffold";

    if let Some(proj_dirs) = ProjectDirs::from("com", "upioneer", app_name) {
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

pub fn remove_custom_skill(url: &str) {
    let mut prefs = load_prefs();
    let mut skills = load_custom_skills();
    if let Some(pos) = skills.iter().position(|x| x == url) {
        skills.remove(pos);
        prefs["custom_skills"] = json!(skills);
        save_prefs(&prefs);
    }
}
pub fn has_seen_welcome() -> bool {
    let prefs = load_prefs();
    let current_version = env!("CARGO_PKG_VERSION");
    let seen_version = prefs
        .get("last_seen_version")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    seen_version == current_version
}

pub fn set_has_seen_welcome(_val: bool) {
    let mut prefs = load_prefs();
    prefs["last_seen_version"] = json!(env!("CARGO_PKG_VERSION"));
    save_prefs(&prefs);
}

pub fn load_custom_themes() -> Vec<Theme> {
    let prefs = load_prefs();
    let mut themes = Vec::new();
    if let Some(arr) = prefs.get("custom_themes").and_then(|v| v.as_array()) {
        for v in arr {
            if let (
                Some(name),
                Some(bg),
                Some(text),
                Some(primary),
                Some(secondary),
                Some(accent),
            ) = (
                v.get("name").and_then(|s| s.as_str()),
                v.get("bg").and_then(|s| s.as_str()),
                v.get("text").and_then(|s| s.as_str()),
                v.get("primary").and_then(|s| s.as_str()),
                v.get("secondary").and_then(|s| s.as_str()),
                v.get("accent").and_then(|s| s.as_str()),
            ) {
                if let (Some(c_bg), Some(c_text), Some(c_prim), Some(c_sec), Some(c_acc)) = (
                    Theme::hex_to_color(bg),
                    Theme::hex_to_color(text),
                    Theme::hex_to_color(primary),
                    Theme::hex_to_color(secondary),
                    Theme::hex_to_color(accent),
                ) {
                    themes.push(Theme {
                        name: name.to_string(),
                        bg: c_bg,
                        text: c_text,
                        primary: c_prim,
                        secondary: c_sec,
                        accent: c_acc,
                    });
                }
            }
        }
    }
    themes
}

pub fn add_custom_theme(theme: &Theme) {
    let mut prefs = load_prefs();
    let mut arr = prefs
        .get("custom_themes")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_else(Vec::new);

    arr.push(json!({
        "name": theme.name,
        "bg": Theme::color_to_hex(&theme.bg),
        "text": Theme::color_to_hex(&theme.text),
        "primary": Theme::color_to_hex(&theme.primary),
        "secondary": Theme::color_to_hex(&theme.secondary),
        "accent": Theme::color_to_hex(&theme.accent),
    }));

    prefs["custom_themes"] = Value::Array(arr);
    save_prefs(&prefs);
}
