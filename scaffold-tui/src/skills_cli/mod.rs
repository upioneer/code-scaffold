pub mod diff;
pub mod doctor;
pub mod errors;
pub mod export;
pub mod index;
pub mod info;
pub mod install;
pub mod list;
pub mod lockfile;
pub mod output;
pub mod search;
pub mod uninstall;
pub mod update;

use anyhow::Result;
use errors::SkillsError;
use index::SkillIndex;
use install::InstallOptions;
use output::{OutputConfig, Printer};
use std::path::{Path, PathBuf};

pub async fn run(payload_dir: PathBuf, args: Vec<String>) -> Result<()> {
    // args[0] is executable path, args[1] is "skills"
    let skill_args: Vec<String> = if args.len() > 2 {
        args[2..].to_vec()
    } else {
        Vec::new()
    };

    let mut config = OutputConfig::default();
    let mut target_dir_opt: Option<PathBuf> = None;
    let mut category_filter: Option<String> = None;
    let mut search_limit: usize = 20;
    let mut force = false;
    let mut dry_run = false;
    let mut no_lock = false;
    let mut all = false;
    let mut output_path_opt: Option<PathBuf> = None;
    let mut installed_only = false;
    let mut show_help = false;

    let mut positional = Vec::new();
    let mut i = 0;

    while i < skill_args.len() {
        let arg = &skill_args[i];
        match arg.as_str() {
            "--json" => config.json = true,
            "--no-color" => config.no_color = true,
            "--verbose" => config.verbose = true,
            "--quiet" => config.quiet = true,
            "--force" => force = true,
            "--dry-run" => dry_run = true,
            "--no-lock" => no_lock = true,
            "--all" => all = true,
            "--installed" => installed_only = true,
            "-h" | "--help" | "/help" | "/h" => show_help = true,
            "--target" => {
                if i + 1 < skill_args.len() {
                    target_dir_opt = Some(PathBuf::from(&skill_args[i + 1]));
                    i += 1;
                }
            }
            "--category" => {
                if i + 1 < skill_args.len() {
                    category_filter = Some(skill_args[i + 1].clone());
                    i += 1;
                }
            }
            "--limit" => {
                if i + 1 < skill_args.len() {
                    if let Ok(l) = skill_args[i + 1].parse::<usize>() {
                        search_limit = l;
                    }
                    i += 1;
                }
            }
            "--output" => {
                if i + 1 < skill_args.len() {
                    output_path_opt = Some(PathBuf::from(&skill_args[i + 1]));
                    i += 1;
                }
            }
            _ => {
                if !arg.starts_with('-') {
                    positional.push(arg.clone());
                }
            }
        }
        i += 1;
    }

    let printer = Printer::new(config);

    if positional.is_empty() {
        print_skills_help(&printer);
        return Ok(());
    }

    let subcommand = positional[0].to_lowercase();

    if show_help {
        print_subcommand_help(&printer, &subcommand);
        return Ok(());
    }

    let index = SkillIndex::build(&payload_dir)?;
    let default_target = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let target = target_dir_opt.as_deref().unwrap_or(&default_target);

    match subcommand.as_str() {
        "list" => {
            list::run_list(
                &index,
                &printer,
                category_filter.as_deref(),
                target_dir_opt.as_deref(),
                installed_only,
            )?;
        }
        "categories" => {
            list::run_categories(&index, &printer)?;
        }
        "search" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<query>".to_string(),
                    subcommand: "search".to_string(),
                }
                .into());
            }
            let query = positional[1..].join(" ");
            let results = search::search(&index, &query, category_filter.as_deref(), search_limit);

            if printer.is_json() {
                printer.print_json(&results);
            } else {
                printer.header(&format!(
                    "Search Results for \"{}\" ({} matches)",
                    query,
                    results.len()
                ));
                if results.is_empty() {
                    printer.info("  No matching skills found. Try searching for a broader term.");
                } else {
                    for (rank, r) in results.iter().enumerate() {
                        printer.info(format!(
                            "  #{:<2} {:<24} v{:<4} [Score: {:.1}]",
                            rank + 1,
                            r.slug,
                            r.version,
                            r.score
                        ));
                        printer.info(format!("      {}", r.description));
                        printer.info(format!("      Category: {}", r.category));
                        if !r.keywords.is_empty() {
                            printer.info(format!("      Keywords: {}", r.keywords.join(", ")));
                        }
                        println!();
                    }
                }
            }
        }
        "info" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<skill-name>".to_string(),
                    subcommand: "info".to_string(),
                }
                .into());
            }
            let slug = &positional[1];
            info::run_info(&index, &printer, slug, target_dir_opt.as_deref())?;
        }
        "install" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<skills...>".to_string(),
                    subcommand: "install".to_string(),
                }
                .into());
            }
            let slugs = &positional[1..];
            let options = InstallOptions {
                target: target.to_path_buf(),
                force,
                dry_run,
                no_lock,
            };
            install::run_install(&index, &printer, slugs, &options)?;
        }
        "uninstall" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<skills...>".to_string(),
                    subcommand: "uninstall".to_string(),
                }
                .into());
            }
            let slugs = &positional[1..];
            uninstall::run_uninstall(&index, &printer, slugs, target, force)?;
        }
        "update" => {
            let slugs = if positional.len() > 1 {
                &positional[1..]
            } else {
                &[]
            };
            update::run_update(&index, &printer, slugs, target, all, force, dry_run)?;
        }
        "outdated" => {
            update::run_outdated(&index, &printer, target)?;
        }
        "doctor" => {
            doctor::run_doctor(&index, &printer, target)?;
        }
        "diff" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<skill-name>".to_string(),
                    subcommand: "diff".to_string(),
                }
                .into());
            }
            let slug = &positional[1];
            diff::run_diff(&index, &printer, slug, target)?;
        }
        "export" => {
            if positional.len() < 2 {
                return Err(SkillsError::MissingArgument {
                    flag: "<skills...>".to_string(),
                    subcommand: "export".to_string(),
                }
                .into());
            }
            let slugs = &positional[1..];
            export::run_export(&index, &printer, slugs, output_path_opt.as_deref())?;
        }
        _ => {
            return Err(SkillsError::UnknownSubcommand(subcommand).into());
        }
    }

    Ok(())
}

fn print_skills_help(printer: &Printer) {
    if printer.is_json() {
        let help_json = serde_json::json!({
            "command": "code-scaffold skills",
            "description": "Discover, install, and manage AI agent skills ad-hoc for any project.",
            "subcommands": [
                { "name": "list", "description": "List all available skills grouped by category" },
                { "name": "categories", "description": "List all skill categories with counts" },
                { "name": "search", "description": "Search skills by name, keyword, or description" },
                { "name": "info", "description": "Display detailed information about a skill" },
                { "name": "install", "description": "Install skills into a target project" },
                { "name": "uninstall", "description": "Remove installed skills from a project" },
                { "name": "update", "description": "Update installed skills to latest versions" },
                { "name": "outdated", "description": "Show skills with available upgrades" },
                { "name": "doctor", "description": "Run health and integrity checks on installed skills" },
                { "name": "diff", "description": "Compare installed vs latest skill version" },
                { "name": "export", "description": "Package skills into a portable archive" }
            ],
            "options": [
                { "flag": "--target <dir>", "description": "Target project directory (default: .)" },
                { "flag": "--json", "description": "Output machine-readable JSON" },
                { "flag": "--no-color", "description": "Disable colored output" },
                { "flag": "--force", "description": "Overwrite existing files without prompting" },
                { "flag": "--dry-run", "description": "Preview actions without writing files" }
            ]
        });
        printer.print_json(&help_json);
        return;
    }

    println!(
        r#"
Code Scaffold Skill Package Manager

Discover, install, and manage AI agent skills ad-hoc for any project.

USAGE:
    code-scaffold skills <SUBCOMMAND> [OPTIONS]

SUBCOMMANDS:
    list              List all available skills grouped by category
    categories        List all skill categories with counts
    search <query>    Search skills by name, keyword, or description
    info <name>       Display detailed information about a skill
    install <names>   Install skills into a target project
    uninstall <names> Remove installed skills from a project
    update [names]    Update installed skills to latest versions
    outdated          Show skills with available upgrades
    doctor            Run health checks on installed skills
    diff <name>       Compare installed vs latest skill version
    export <names>    Package skills into a portable archive

GLOBAL OPTIONS:
    --target <dir>    Target project directory (default: .)
    --category <cat>  Filter list/search to a specific category
    --limit <n>       Maximum number of search results (default: 20)
    --installed       Filter to skills already installed in target
    --force           Overwrite existing installations without prompting
    --dry-run         Preview actions without making filesystem changes
    --no-lock         Skip updating .skills/.lockfile.json
    --json            Output in machine-readable JSON
    --no-color        Disable ANSI color styling
    --quiet           Suppress non-essential output
    --help, -h        Show help documentation

EXAMPLES:
    code-scaffold skills list
    code-scaffold skills search "browser automation"
    code-scaffold skills info playwright --target ./my-app
    code-scaffold skills install playwright tasty --target ./my-app
    code-scaffold skills outdated --target ./my-app
    code-scaffold skills update --target ./my-app
    code-scaffold skills doctor --target ./my-app
"#
    );
}

fn print_subcommand_help(printer: &Printer, subcommand: &str) {
    match subcommand {
        "list" => println!(
            r#"
Usage: code-scaffold skills list [OPTIONS]

Options:
    --category <name>   Filter by category name
    --installed         Show only installed skills (requires --target)
    --target <dir>      Project directory to check for installed skills
    --json              Output in JSON format
"#
        ),
        "search" => println!(
            r#"
Usage: code-scaffold skills search <query> [OPTIONS]

Options:
    --category <name>   Limit search to a category
    --limit <n>         Maximum results to return (default: 20)
    --json              Output in JSON format
"#
        ),
        "info" => println!(
            r#"
Usage: code-scaffold skills info <skill-name> [OPTIONS]

Options:
    --target <dir>      Check installation status in target directory
    --json              Output in JSON format
"#
        ),
        "install" => println!(
            r#"
Usage: code-scaffold skills install <skill-1> [skill-2] [...] [OPTIONS]

Options:
    --target <dir>      Destination project directory (default: .)
    --force             Overwrite existing files
    --dry-run           Preview files without installing
    --no-lock           Do not update .skills/.lockfile.json
    --json              Output in JSON format
"#
        ),
        "uninstall" => println!(
            r#"
Usage: code-scaffold skills uninstall <skill-1> [skill-2] [...] [OPTIONS]

Options:
    --target <dir>      Destination project directory (default: .)
    --force             Skip confirmation prompt
    --json              Output in JSON format
"#
        ),
        "update" => println!(
            r#"
Usage: code-scaffold skills update [skill-1] [...] [OPTIONS]

Options:
    --all               Update all outdated skills (default if none specified)
    --target <dir>      Project directory (default: .)
    --dry-run           Preview update actions
    --force             Force update
    --json              Output in JSON format
"#
        ),
        "doctor" => println!(
            r#"
Usage: code-scaffold skills doctor [OPTIONS]

Options:
    --target <dir>      Project directory to audit (default: .)
    --json              Output in JSON format
"#
        ),
        "diff" => println!(
            r#"
Usage: code-scaffold skills diff <skill-name> [OPTIONS]

Options:
    --target <dir>      Project directory containing installed skill
    --json              Output in JSON format
"#
        ),
        "export" => println!(
            r#"
Usage: code-scaffold skills export <skill-1> [skill-2] [...] [OPTIONS]

Options:
    --output <file>     Destination archive path (default: code-scaffold-skills-export.zip)
    --json              Output in JSON format
"#
        ),
        _ => print_skills_help(printer),
    }
}
