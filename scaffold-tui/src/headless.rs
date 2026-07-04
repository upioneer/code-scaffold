use crate::components::nav_tree::Category;
use crate::components::workspace::Workspace;
use serde_json::json;

pub fn print_headless_help(payload_dir: std::path::PathBuf) {
    let mut workspace = Workspace::new(payload_dir);

    let mut personas = vec![];
    let mut artifacts = vec![];
    let mut skills = vec![];
    let mut licenses = vec![];

    for item in &workspace.items {
        let entry = json!({
            "label": item.label,
            "description": item.description.as_deref().unwrap_or(""),
            "version": item.version.as_deref().unwrap_or("")
        });
        match item.category {
            Category::AgentPersona => personas.push(entry),
            Category::Artifacts => artifacts.push(entry),
            Category::AgentSkills => skills.push(entry),
            Category::License => licenses.push(entry),
            _ => {}
        }
    }

    let output = json!({
        "usage": "code-scaffold.exe --headless --target <DIR> [OPTIONS]",
        "description": "Headless CLI for automated AI deployment of project scaffoldings.",
        "arguments": {
            "--target": "REQUIRED. Absolute path to the deployment directory.",
            "--personas": "OPTIONAL. Comma-separated labels of Agent Personas.",
            "--artifacts": "OPTIONAL. Comma-separated labels of Core Artifacts.",
            "--skills": "OPTIONAL. Comma-separated labels of Agent Skills.",
            "--license": "OPTIONAL. License label (e.g. 'MIT')."
        },
        "available_personas": personas,
        "available_artifacts": artifacts,
        "available_skills": skills,
        "available_licenses": licenses,
        "example_deployment_script": "code-scaffold.exe --headless --target \"C:\\my_project\" --personas \"Web Dev,AI Systems Engineer\" --artifacts \"readme.md,.gitignore\" --skills \"github,typescript\" --license \"MIT\""
    });

    println!("{}", serde_json::to_string_pretty(&output).unwrap());
}

pub async fn run_headless(payload_dir: std::path::PathBuf, args: Vec<String>) -> anyhow::Result<()> {
    let mut target = String::new();
    let mut arg_personas = Vec::new();
    let mut arg_artifacts = Vec::new();
    let mut arg_skills = Vec::new();
    let mut arg_license = String::new();

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--target" => {
                if i + 1 < args.len() {
                    target = args[i + 1].clone();
                    i += 1;
                }
            }
            "--personas" => {
                if i + 1 < args.len() {
                    arg_personas = args[i + 1].split(',').map(|s| s.trim().to_string()).collect();
                    i += 1;
                }
            }
            "--artifacts" => {
                if i + 1 < args.len() {
                    arg_artifacts = args[i + 1].split(',').map(|s| s.trim().to_string()).collect();
                    i += 1;
                }
            }
            "--skills" => {
                if i + 1 < args.len() {
                    arg_skills = args[i + 1].split(',').map(|s| s.trim().to_string()).collect();
                    i += 1;
                }
            }
            "--license" => {
                if i + 1 < args.len() {
                    arg_license = args[i + 1].trim().to_string();
                    i += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }

    if target.is_empty() {
        eprintln!("Error: --target is required in --headless mode.");
        std::process::exit(1);
    }

    println!("Initializing headless deployment to {}...", target);

    let mut manifest = crate::models::manifest::Manifest {
        metadata: crate::models::manifest::ManifestMetadata {
            version: env!("CARGO_PKG_VERSION").into(),
            last_updated: "now".into(),
        },
        env: std::collections::HashMap::new(),
        apps: Vec::new(),
        artifacts: Vec::new(),
        skills: Vec::new(),
    };

    let required_dirs = [
        "project_details",
        "project_details/assets",
        "project_details/history",
    ];
    for d in required_dirs {
        let target_path = std::path::PathBuf::from(&target).join(d);
        manifest.apps.push(crate::models::manifest::AppEntry {
            id: d.to_string(),
            label: d.to_string(),
            target: target_path.to_string_lossy().to_string(),
            method: "mkdir".into(),
        });
    }

    let workspace = Workspace::new(payload_dir.clone());
    
    // Convert args to lower-case for robust matching
    let arg_artifacts: Vec<String> = arg_artifacts.into_iter().map(|s| s.to_lowercase()).collect();
    let arg_personas: Vec<String> = arg_personas.into_iter().map(|s| s.to_lowercase()).collect();
    let arg_skills: Vec<String> = arg_skills.into_iter().map(|s| s.to_lowercase()).collect();
    let arg_license = arg_license.to_lowercase();

    for item in workspace.items {
        let label_lower = item.label.to_lowercase();
        match item.category {
            Category::Artifacts => {
                if arg_artifacts.contains(&label_lower) {
                    let source = payload_dir.join(".templates").join(&item.label);
                    let target_dir = if label_lower == "readme.md"
                        || label_lower == ".env"
                        || label_lower == "license.md"
                        || label_lower == ".gitignore"
                        || label_lower == "apps/"
                        || label_lower == "packages/"
                    {
                        std::path::PathBuf::from(&target)
                    } else {
                        std::path::PathBuf::from(&target).join("project_details")
                    };
                    manifest.artifacts.push(crate::models::manifest::ArtifactEntry {
                        id: item.label.clone(),
                        label: item.label.clone(),
                        source: Some(source.to_string_lossy().to_string()),
                        target: target_dir.join(&item.label).to_string_lossy().to_string(),
                        method: "copy".into(),
                        content: None,
                    });
                }
            }
            Category::AgentSkills => {
                if arg_skills.contains(&label_lower) {
                    let source = payload_dir.join(".skills").join(&item.label);
                    manifest.skills.push(crate::models::manifest::SkillEntry {
                        id: item.label.clone(),
                        label: item.label.clone(),
                        source: Some(source.to_string_lossy().to_string()),
                        target: std::path::PathBuf::from(&target)
                            .join(".skills")
                            .join(&item.label)
                            .to_string_lossy()
                            .to_string(),
                        method: "copy".into(),
                    });
                }
            }
            Category::AgentPersona => {
                if arg_personas.contains(&label_lower) {
                    let target_dir = std::path::PathBuf::from(&target).join(".agents");
                    
                    if !manifest.artifacts.iter().any(|a| a.method == "inject_persona") {
                        manifest.artifacts.push(crate::models::manifest::ArtifactEntry {
                            id: "AGENTS.md".into(),
                            label: "AGENTS.md".into(),
                            source: None,
                            target: target_dir.join("AGENTS.md").to_string_lossy().to_string(),
                            method: "inject_persona".into(),
                            content: Some(item.label.clone()),
                        });
                    } else {
                        if let Some(existing) = manifest.artifacts.iter_mut().find(|a| a.method == "inject_persona") {
                            let mut current = existing.content.clone().unwrap_or_default();
                            current.push_str(", ");
                            current.push_str(&item.label);
                            existing.content = Some(current);
                        }
                    }
                }
            }
            Category::License => {
                if label_lower == arg_license && label_lower != "none" {
                    let source = payload_dir.join(".licenses").join(format!("{}.md", item.label));
                    manifest.artifacts.push(crate::models::manifest::ArtifactEntry {
                        id: "license.md".into(),
                        label: "license.md".into(),
                        source: Some(source.to_string_lossy().to_string()),
                        target: std::path::PathBuf::from(&target).join("license.md").to_string_lossy().to_string(),
                        method: "copy".into(),
                        content: None,
                    });
                }
            }
            _ => {}
        }
    }

    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
    
    // Output listener loop
    let rx_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("{}", msg);
        }
    });

    if let Err(e) = crate::manifest_engine::execute(
        &manifest,
        tx.clone(),
        &payload_dir,
        &target,
    ).await {
        eprintln!("Deployment failed: {}", e);
        std::process::exit(1);
    }
    
    // Drop tx so the receiver loop closes
    drop(tx);
    let _ = rx_task.await;
    
    println!("Headless deployment completed successfully!");
    Ok(())
}
