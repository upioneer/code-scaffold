use anyhow::Result;
use std::path::PathBuf;

use crate::manifest_engine;
use crate::models::manifest::{ArtifactEntry, Manifest, ManifestMetadata, SkillEntry};
use agent_client_protocol::mcp_server::McpServer;
/// Runs the Headless ACP (Agent Client Protocol) Server
/// Code Scaffold acts as an ACP Client, exposing its scaffolding primitives
/// to external Agents (e.g., Devin, Openclaw, etc.) over stdio or a socket.
use agent_client_protocol::{Client, Stdio};
use agent_client_protocol_rmcp::{tool_fn, McpServerExt};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, JsonSchema)]
struct ListSkillsParams {}

#[derive(Serialize, Deserialize, JsonSchema)]
struct ScaffoldProjectParams {
    target_directory: String,
    modules: Vec<String>,
}

#[derive(Serialize, Deserialize, JsonSchema)]
struct InjectPersonaParams {
    target_directory: String,
    persona_id: String,
}

pub async fn run_acp_server(payload_dir: PathBuf, args: Vec<String>) -> Result<()> {
    eprintln!("Starting Agent Client Protocol (ACP) Server in Headless Mode...");
    eprintln!("Payload Directory: {}", payload_dir.display());

    let mcp_server = McpServer::builder("code-scaffold".to_string())
        .instructions("Code Scaffold provisioning engine capabilities.")
        .tool_fn(
            "list_skills",
            "Returns a JSON array of all available templates and skills by parsing `.skills/*/meta.json`.",
            async |input: ListSkillsParams, cx| -> Result<serde_json::Value, agent_client_protocol::Error> {
                let mut skills = Vec::new();
                // Not ideal hardcoding this path, but payload_dir is passed down, we just can't easily capture it in async closure without arc
                let skills_dir = std::path::PathBuf::from(".skills");
                if skills_dir.exists() {
                    if let Ok(entries) = std::fs::read_dir(skills_dir) {
                        for entry in entries.flatten() {
                            let meta_path = entry.path().join("meta.json");
                            if meta_path.exists() {
                                if let Ok(content) = std::fs::read_to_string(meta_path) {
                                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                        skills.push(json);
                                    }
                                }
                            }
                        }
                    }
                }
                Ok(serde_json::json!(skills))
            },
            tool_fn!(),
        )
        .tool_fn(
            "scaffold_project",
            "Accepts a target_directory and a string array of modules. Triggers manifest_engine::deploy to instantly provision the payloads.",
            async |input: ScaffoldProjectParams, _cx| -> Result<serde_json::Value, agent_client_protocol::Error> {
                let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

                // Spawn a task to pipe logs to stderr
                tokio::spawn(async move {
                    while let Some(msg) = rx.recv().await {
                        eprintln!("[ScaffoldProject] {}", msg);
                    }
                });

                let mut manifest = Manifest {
                    metadata: ManifestMetadata {
                        version: "1.0.0".to_string(),
                        last_updated: "".to_string(),
                    },
                    env: HashMap::new(),
                    apps: vec![],
                    artifacts: vec![],
                    skills: vec![],
                };

                for module in input.modules {
                    let meta_path = std::path::PathBuf::from(".skills").join(&module).join("meta.json");
                    if let Ok(content) = std::fs::read_to_string(meta_path) {
                        if let Ok(entry) = serde_json::from_str::<SkillEntry>(&content) {
                            manifest.skills.push(entry);
                        }
                    }
                }

                let pdir = std::path::PathBuf::from(".");
                if let Err(e) = manifest_engine::execute(&manifest, tx, &pdir, &input.target_directory).await {
                    return Ok(serde_json::json!({"status": "error", "message": e.to_string()}));
                }

                Ok(serde_json::json!({"status": "success", "target": input.target_directory}))
            },
            tool_fn!(),
        )
        .tool_fn(
            "inject_persona",
            "Takes a persona identifier (e.g., `rust`) and copies the respective `.agents` prompt.",
            async |input: InjectPersonaParams, _cx| -> Result<serde_json::Value, agent_client_protocol::Error> {
                let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

                // Spawn a task to pipe logs to stderr
                tokio::spawn(async move {
                    while let Some(msg) = rx.recv().await {
                        eprintln!("[InjectPersona] {}", msg);
                    }
                });

                let mut manifest = Manifest {
                    metadata: ManifestMetadata {
                        version: "1.0.0".to_string(),
                        last_updated: "".to_string(),
                    },
                    env: HashMap::new(),
                    apps: vec![],
                    artifacts: vec![
                        ArtifactEntry {
                            id: format!("persona_{}", input.persona_id),
                            label: format!("Injecting {} persona", input.persona_id),
                            source: Some(format!(".agents/{}.md", input.persona_id)),
                            target: format!("{}/AGENT.md", input.target_directory),
                            method: "inject_persona".to_string(),
                            content: None,
                        }
                    ],
                    skills: vec![],
                };

                let pdir = std::path::PathBuf::from(".");
                if let Err(e) = manifest_engine::execute(&manifest, tx, &pdir, &input.target_directory).await {
                    return Ok(serde_json::json!({"status": "error", "message": e.to_string()}));
                }

                Ok(serde_json::json!({"status": "success", "persona": input.persona_id}))
            },
            tool_fn!(),
        )
        .build();

    eprintln!("ACP Server initialized. Listening for Agent connections on stdio...");

    // We start the Client and attach the MCP server to the session so the connected Agent can use the tools
    let _ = Client
        .builder()
        .name("code-scaffold")
        .connect_with(Stdio::default(), async |cx| {
            // Wait for session and block
            cx.build_session_cwd()?
                .with_mcp_server(mcp_server)?
                .block_task()
                .run_until(async |mut _session| {
                    // Block indefinitely serving the tools
                    let _ = std::future::pending::<()>().await;
                    Ok(())
                })
                .await
        })
        .await;

    Ok(())
}
