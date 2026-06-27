use directories::ProjectDirs;
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

pub fn load_theme_idx() -> usize {
    if let Some(path) = get_prefs_path() {
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(idx) = json.get("theme_idx").and_then(|v| v.as_u64()) {
                    return idx as usize;
                }
            }
        }
    }
    1 // Default to index 1 (default_theme)
}

pub fn save_theme_idx(idx: usize) {
    if let Some(path) = get_prefs_path() {
        let json = serde_json::json!({
            "theme_idx": idx
        });
        let _ = fs::write(
            path,
            serde_json::to_string_pretty(&json).unwrap_or_default(),
        );
    }
}
