use std::fmt;
use std::path::PathBuf;

#[derive(Debug)]
pub enum SkillsError {
    SkillNotFound {
        slug: String,
        suggestions: Vec<String>,
    },
    InvalidTarget {
        path: PathBuf,
        reason: String,
    },
    IoError {
        operation: String,
        path: PathBuf,
        message: String,
    },
    AlreadyInstalled {
        slug: String,
        version: String,
    },
    NotInstalled {
        slug: String,
    },
    MissingFile {
        slug: String,
        file: String,
    },
    VersionMismatch {
        slug: String,
        meta_version: String,
        manifest_version: String,
    },
    LockfileCorrupted {
        path: PathBuf,
        message: String,
    },
    NoSubcommand,
    UnknownSubcommand(String),
    MissingArgument {
        flag: String,
        subcommand: String,
    },
    General(String),
}

impl fmt::Display for SkillsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SkillsError::SkillNotFound { slug, suggestions } => {
                write!(f, "Skill \"{}\" not found in registry.", slug)?;
                if !suggestions.is_empty() {
                    write!(f, "\n  Did you mean:")?;
                    for s in suggestions {
                        write!(f, "\n    * {}", s)?;
                    }
                }
                Ok(())
            }
            SkillsError::InvalidTarget { path, reason } => {
                write!(
                    f,
                    "Invalid target directory \"{}\": {}",
                    path.display(),
                    reason
                )
            }
            SkillsError::IoError {
                operation,
                path,
                message,
            } => {
                write!(
                    f,
                    "Failed to {} at \"{}\": {}",
                    operation,
                    path.display(),
                    message
                )
            }
            SkillsError::AlreadyInstalled { slug, version } => {
                write!(
                    f,
                    "Skill \"{}\" (v{}) is already installed at current version.",
                    slug, version
                )
            }
            SkillsError::NotInstalled { slug } => {
                write!(
                    f,
                    "Skill \"{}\" is not installed in the target workspace.",
                    slug
                )
            }
            SkillsError::MissingFile { slug, file } => {
                write!(
                    f,
                    "Skill \"{}\" is missing required anatomy file \"{}\".",
                    slug, file
                )
            }
            SkillsError::VersionMismatch {
                slug,
                meta_version,
                manifest_version,
            } => {
                write!(
                    f,
                    "Skill \"{}\" version mismatch (meta.json: v{}, skill-manifest.json: v{}).",
                    slug, meta_version, manifest_version
                )
            }
            SkillsError::LockfileCorrupted { path, message } => {
                write!(
                    f,
                    "Lockfile at \"{}\" is corrupted or invalid: {}",
                    path.display(),
                    message
                )
            }
            SkillsError::NoSubcommand => {
                write!(
                    f,
                    "No skills subcommand provided. Run \"code-scaffold skills --help\" for usage."
                )
            }
            SkillsError::UnknownSubcommand(cmd) => {
                write!(
                    f,
                    "Unknown skills subcommand \"{}\". Run \"code-scaffold skills --help\" for usage.",
                    cmd
                )
            }
            SkillsError::MissingArgument { flag, subcommand } => {
                write!(
                    f,
                    "Missing required argument \"{}\" for command \"skills {}\".",
                    flag, subcommand
                )
            }
            SkillsError::General(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for SkillsError {}

/// Calculates string similarity suggestions based on Levenshtein distance and substring containment
pub fn find_suggestions(query: &str, candidates: &[String], max_suggestions: usize) -> Vec<String> {
    let q = query.to_lowercase();
    let mut scored: Vec<(usize, String)> = candidates
        .iter()
        .map(|c| {
            let cl = c.to_lowercase();
            let dist = if cl.contains(&q) || q.contains(&cl) {
                0
            } else {
                levenshtein(&q, &cl)
            };
            (dist, c.clone())
        })
        .collect();

    scored.sort_by_key(|k| k.0);
    scored
        .into_iter()
        .filter(|(dist, c)| *dist <= 4 || c.to_lowercase().contains(&q))
        .take(max_suggestions)
        .map(|(_, c)| c)
        .collect()
}

fn levenshtein(a: &str, b: &str) -> usize {
    let a_len = a.chars().count();
    let b_len = b.chars().count();
    if a_len == 0 {
        return b_len;
    }
    if b_len == 0 {
        return a_len;
    }

    let mut prev_row: Vec<usize> = (0..=b_len).collect();
    let mut curr_row: Vec<usize> = vec![0; b_len + 1];

    for (i, ca) in a.chars().enumerate() {
        curr_row[0] = i + 1;
        for (j, cb) in b.chars().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            curr_row[j + 1] = std::cmp::min(
                std::cmp::min(curr_row[j] + 1, prev_row[j + 1] + 1),
                prev_row[j] + cost,
            );
        }
        prev_row.copy_from_slice(&curr_row);
    }

    curr_row[b_len]
}
