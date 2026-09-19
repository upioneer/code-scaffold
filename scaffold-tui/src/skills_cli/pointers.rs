use anyhow::Result;
use std::fs;
use std::path::Path;

pub const SKILLS_DIRECTIVE: &str = "\n# Code Scaffold Skills\nWhen using skills, actively read and adhere to the instructions inside the `.skills/` directory.\n";

pub struct PointerSpec {
    pub name: &'static str,
    pub relative_path: &'static str,
    pub is_json: bool,
}

pub const ALL_POINTERS: &[PointerSpec] = &[
    PointerSpec {
        name: "Google Antigravity",
        relative_path: ".agents/skills.json",
        is_json: true,
    },
    PointerSpec {
        name: "Devin CLI & Desktop",
        relative_path: ".devin/rules/skills.md",
        is_json: false,
    },
    PointerSpec {
        name: "Cursor",
        relative_path: ".cursor/rules/skills.mdc",
        is_json: false,
    },
    PointerSpec {
        name: "Claude Code",
        relative_path: "CLAUDE.md",
        is_json: false,
    },
    PointerSpec {
        name: "OpenCode",
        relative_path: ".opencode.md",
        is_json: false,
    },
    PointerSpec {
        name: "OpenAI Codex & ChatGPT",
        relative_path: "CODEX.md",
        is_json: false,
    },
    PointerSpec {
        name: "Meta Muse",
        relative_path: "MUSE.md",
        is_json: false,
    },
    PointerSpec {
        name: "Kimi Code",
        relative_path: "KIMI.md",
        is_json: false,
    },
    PointerSpec {
        name: "Qwen Code",
        relative_path: "QWEN.md",
        is_json: false,
    },
    PointerSpec {
        name: "GitHub Copilot",
        relative_path: ".github/copilot-instructions.md",
        is_json: false,
    },
    PointerSpec {
        name: "Windsurf",
        relative_path: ".windsurfrules",
        is_json: false,
    },
    PointerSpec {
        name: "Cline & Roo Code",
        relative_path: ".clinerules",
        is_json: false,
    },
];

pub fn sync_universal_agent_pointers(target_dir: &Path) -> Result<Vec<String>> {
    let mut updated = Vec::new();

    for spec in ALL_POINTERS {
        let dest = target_dir.join(spec.relative_path);
        if let Some(parent) = dest.parent() {
            let _ = fs::create_dir_all(parent);
        }

        if spec.is_json {
            let json_content = serde_json::json!({
                "entries": [
                    {
                        "path": "../.skills"
                    }
                ]
            });
            let content_str = serde_json::to_string_pretty(&json_content)? + "\n";
            let need_write = match fs::read_to_string(&dest) {
                Ok(existing) => !existing.contains(".skills"),
                Err(_) => true,
            };
            if need_write {
                fs::write(&dest, content_str)?;
                updated.push(spec.name.to_string());
            }
        } else {
            let need_write = match fs::read_to_string(&dest) {
                Ok(existing) => {
                    if !existing.contains(".skills/") {
                        let mut new_content = existing;
                        if !new_content.ends_with('\n') {
                            new_content.push('\n');
                        }
                        new_content.push_str(SKILLS_DIRECTIVE.trim_start());
                        Some(new_content)
                    } else {
                        None
                    }
                }
                Err(_) => Some(SKILLS_DIRECTIVE.trim_start().to_string()),
            };

            if let Some(content) = need_write {
                fs::write(&dest, content)?;
                updated.push(spec.name.to_string());
            }
        }
    }

    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_universal_agent_pointers() {
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let test_dir = std::env::temp_dir().join(format!("test_pointers_{}", nonce));
        let _ = fs::create_dir_all(&test_dir);

        let updated = sync_universal_agent_pointers(&test_dir).unwrap();
        assert_eq!(
            updated.len(),
            12,
            "Should sync all 12 agent pointers initially"
        );

        // Verify all 12 files exist and contain reference to .skills
        for spec in ALL_POINTERS {
            let path = test_dir.join(spec.relative_path);
            assert!(
                path.exists(),
                "Pointer file must exist: {}",
                spec.relative_path
            );
            let content = fs::read_to_string(&path).unwrap();
            assert!(
                content.contains(".skills"),
                "Content must reference .skills in {}",
                spec.relative_path
            );
        }

        // Second run must be idempotent
        let updated_again = sync_universal_agent_pointers(&test_dir).unwrap();
        assert_eq!(updated_again.len(), 0, "Second sync must be idempotent");

        // Clean up test dir
        let _ = fs::remove_dir_all(&test_dir);
    }
}
