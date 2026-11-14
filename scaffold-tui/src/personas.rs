//! Loader for the `personas/` role pack library.
//!
//! Each pack lives in `personas/<slug>/PERSONA.md`: YAML frontmatter for
//! routing plus a markdown body for behavior. Sync delivers the directory to
//! field caches; the workspace picker appends one row per pack after the
//! built in rows. The frontmatter shape is small and fixed, so this module
//! hand parses it instead of adding a YAML dependency.

use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Persona {
    pub name: String,
    pub slug: String,
    pub version: String,
    pub description: String,
    pub auto_skills: Vec<String>,
}

fn unquote(value: &str) -> String {
    let v = value.trim();
    if v.len() >= 2 && v.starts_with('"') && v.ends_with('"') {
        v[1..v.len() - 1].to_string()
    } else {
        v.to_string()
    }
}

/// Parse one PERSONA.md file. Returns None when the file is unreadable,
/// the frontmatter fences are missing, or name/description is absent.
pub fn parse_persona_file(path: &Path) -> Option<Persona> {
    let text = std::fs::read_to_string(path).ok()?;
    let mut lines = text.lines();
    if lines.next()? != "---" {
        return None;
    }
    let mut frontmatter = Vec::new();
    let mut closed = false;
    for line in lines.by_ref() {
        if line.trim() == "---" {
            closed = true;
            break;
        }
        frontmatter.push(line);
    }
    if !closed {
        return None;
    }

    let mut name = String::new();
    let mut slug = String::new();
    let mut version = String::new();
    let mut description = String::new();
    let mut auto_skills = Vec::new();
    let mut current_scalar: Option<&str> = None;
    let mut in_auto_skills = false;

    for line in frontmatter {
        if line.starts_with(char::is_whitespace) {
            let trimmed = line.trim();
            if in_auto_skills {
                if let Some((key, _)) = trimmed.split_once(':') {
                    let key = key.trim();
                    if !key.is_empty() {
                        auto_skills.push(key.to_string());
                    }
                }
            } else if trimmed.starts_with("- ") {
                // List item (skill_gaps): not consumed by the picker.
            } else if !trimmed.is_empty() {
                // Folded continuation of the current scalar value.
                let target = match current_scalar {
                    Some("name") => &mut name,
                    Some("description") => &mut description,
                    Some("slug") => &mut slug,
                    Some("version") => &mut version,
                    _ => continue,
                };
                target.push(' ');
                target.push_str(trimmed);
            }
            continue;
        }
        in_auto_skills = false;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let Some((key, value)) = trimmed.split_once(':') else {
            continue;
        };
        let key = key.trim();
        let value = unquote(value);
        match key {
            "auto_skills" => {
                in_auto_skills = true;
                current_scalar = None;
            }
            "skill_gaps" => {
                current_scalar = None;
            }
            "name" => {
                name = value;
                current_scalar = Some("name");
            }
            "description" => {
                description = value;
                current_scalar = Some("description");
            }
            "slug" => {
                slug = value;
                current_scalar = Some("slug");
            }
            "version" => {
                version = value;
                current_scalar = Some("version");
            }
            _ => {
                current_scalar = None;
            }
        }
    }

    if name.is_empty() || description.is_empty() {
        return None;
    }
    Some(Persona {
        name,
        slug,
        version,
        description,
        auto_skills,
    })
}

/// Load every `personas/*/PERSONA.md` under `payload_dir`, sorted by name.
/// A missing directory yields an empty vec so caches without the library
/// keep working with built in rows only.
pub fn load_library(payload_dir: &Path) -> Vec<Persona> {
    let dir: PathBuf = payload_dir.join("personas");
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let file = entry.path().join("PERSONA.md");
        if let Some(persona) = parse_persona_file(&file) {
            out.push(persona);
        }
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn repo_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")
    }

    fn write_temp_fixture(name: &str, body: &str) -> PathBuf {
        let path =
            std::env::temp_dir().join(format!("persona_test_{}_{}.md", name, std::process::id()));
        std::fs::write(&path, body).expect("write fixture");
        path
    }

    #[test]
    fn parses_full_frontmatter_with_auto_skills() {
        let path = write_temp_fixture(
            "full",
            "---\nname: Music Producer\nslug: music-producer\nversion: \"2\"\n\
             description: Studio persona for beats.\nauto_skills:\n  manim: Animated theory.\n  quarto: Reports.\n\
             skill_gaps:\n  - \"Something missing\"\n---\n\n## Role\nBody.\n",
        );
        let persona = parse_persona_file(&path).expect("should parse");
        assert_eq!(persona.name, "Music Producer");
        assert_eq!(persona.slug, "music-producer");
        assert_eq!(persona.version, "2");
        assert_eq!(persona.description, "Studio persona for beats.");
        assert_eq!(persona.auto_skills, vec!["manim", "quarto"]);
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn parses_minimal_pack_without_auto_skills() {
        let path = write_temp_fixture(
            "minimal",
            "---\nname: Bare\nslug: bare\nversion: \"1\"\n\
             description: Just a role.\nauto_skills: {}\nskill_gaps: []\n---\n\n## Role\nBody.\n",
        );
        let persona = parse_persona_file(&path).expect("should parse");
        assert_eq!(persona.name, "Bare");
        assert!(persona.auto_skills.is_empty());
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn folds_continuation_lines_into_description() {
        let path = write_temp_fixture(
            "fold",
            "---\nname: Fold\nslug: fold\nversion: \"1\"\n\
             description: First line\n  second line here.\nauto_skills: {}\n---\n\n## Role\nBody.\n",
        );
        let persona = parse_persona_file(&path).expect("should parse");
        assert_eq!(persona.description, "First line second line here.");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn rejects_missing_file_and_malformed_frontmatter() {
        assert!(parse_persona_file(Path::new("nonexistent-dir-xyz/PERSONA.md")).is_none());
        let no_fence = write_temp_fixture("nofence", "## Role\nNo frontmatter.\n");
        assert!(parse_persona_file(&no_fence).is_none());
        let _ = std::fs::remove_file(&no_fence);
        let unclosed = write_temp_fixture("unclosed", "---\nname: Oops\nslug: oops\n");
        assert!(parse_persona_file(&unclosed).is_none());
        let _ = std::fs::remove_file(&unclosed);
        let no_name = write_temp_fixture(
            "noname",
            "---\nslug: noname\nversion: \"1\"\n\
             description: Missing a name.\n---\n\n## Role\nBody.\n",
        );
        assert!(parse_persona_file(&no_name).is_none());
        let _ = std::fs::remove_file(&no_name);
    }

    #[test]
    fn loads_real_library_including_music_producer() {
        let library = load_library(&repo_root());
        assert!(
            library.len() >= 16,
            "expected the full persona library, got {}",
            library.len()
        );
        let music = library
            .iter()
            .find(|p| p.name == "Music Producer")
            .expect("Music Producer pack missing");
        assert_eq!(music.slug, "music-producer");
        assert_eq!(music.version, "2");
        assert_eq!(
            music.auto_skills,
            vec!["manim", "mermaid", "officecli", "quarto"]
        );
        for persona in &library {
            assert!(!persona.name.is_empty());
            assert!(!persona.description.is_empty());
        }
    }

    #[test]
    fn missing_personas_dir_yields_empty_library() {
        let empty = load_library(Path::new("nonexistent-payload-dir-xyz"));
        assert!(empty.is_empty());
    }
}
