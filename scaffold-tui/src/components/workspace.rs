use crate::action::Action;
use crate::components::nav_tree::Category;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::Rect;
use ratatui::style::Style;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState};

pub struct WorkspaceItem {
    pub label: String,
    pub selected: bool,
    pub category: Category,
    pub description: Option<String>,
    pub version: Option<String>,
    pub exists_in_target: bool,
    pub target_version: Option<String>,
    pub logo: Option<Vec<String>>,
}

pub struct Workspace {
    pub items: Vec<WorkspaceItem>,
    pub selected_idx: usize,
    pub current_category: Category,
    pub state: ListState,
}

impl Workspace {
    pub fn new(payload_dir: std::path::PathBuf) -> Self {
        let mut items = vec![];

        items.push(WorkspaceItem {
            label: "Open Directory Browser (Press Enter or F)".into(),
            selected: false,
            category: Category::DeploymentTarget,
            description: Some("Press Enter to launch the target directory browser. The selected directory will become the root folder where all project assets are initialized.".into()),
            version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
        });

        items.extend(vec![
            WorkspaceItem {
                label: "Generic".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("A versatile, unopinionated agent ready for general-purpose programming, debugging, and software architecture tasks without specific domain constraints.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "AI Systems Engineer".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in LLMs (hosted/local), multimodal generation (ComfyUI), and AI APIs (Claude, Gemini, Grok). Expert in AI CLI tools, OpenRouter, and advanced RAG/Agentic frameworks (LangGraph, PixelRAG, Dify).".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Cloud & DevOps Architect".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in infrastructure-as-code (Terraform, CloudFormation), CI/CD pipeline automation (GitHub Actions), and provisioning robust cloud environments on AWS, Azure, or GCP.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Containerization (Docker/K8s)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focused strictly on container ecosystems. Excels at writing Dockerfiles, optimizing multi-stage image builds, orchestrating docker-compose, and building Kubernetes manifests.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Data Scientist / ML".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in the Python data ecosystem (Pandas, PyTorch, TensorFlow). Highly effective at data wrangling, model training, Jupyter notebooks, and statistical analysis.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "DBA".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Database Administrator focused on SQL/NoSQL schema design, query optimization, indexing strategies, and database migration safety.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Embedded / IoT".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focused on strict memory management and hardware interactions (C, C++, bare-metal Rust). Specialized in microcontrollers, RTOS, and highly constrained computational environments.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Game Developer".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Tuned for physics engines, 3D rendering pipelines, game loops, and state machines within environments like Unity (C#) or Unreal Engine (C++).".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Mobile (iOS/And)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Expert in mobile app development, including iOS (Swift) and Android (Kotlin) as well as cross-platform frameworks like React Native and Flutter.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Security Analyst".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("An auditor-style agent focused on network security, cryptographic protocols, vulnerability scanning, and hardening systems against modern exploit techniques.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Systems Scripting".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Aimed at low-level OS tasks, bash/powershell scripting, automation, system performance tuning, and CLI tool development.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
            WorkspaceItem {
                label: "Web Dev".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in modern web technologies (React, Vue, Node.js, HTML/CSS) focusing on responsive design, SEO best practices, and dynamic web application aesthetics. MUST strictly enforce security best practices: implement appropriate rate limiting, securely hash passwords, and protect against common attacks.".into()),
                version: None,
                    exists_in_target: false,
                    target_version: None, logo: None,
            },
        ]);

        let templates_dir = payload_dir.join(".templates");
        if templates_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&templates_dir) {
                let mut tmpl_names: Vec<(String, bool)> = entries
                    .flatten()
                    .filter(|e| {
                        if let Ok(ft) = e.file_type() {
                            ft.is_file() || ft.is_dir()
                        } else {
                            false
                        }
                    })
                    .map(|e| {
                        let is_dir = e.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                        let mut name = e.file_name().to_string_lossy().to_string();
                        if is_dir {
                            name.push('/');
                        }
                        (name, is_dir)
                    })
                    .collect();
                tmpl_names.sort_by(|a, b| a.0.cmp(&b.0));

                for (name, _) in tmpl_names {
                    if name.to_lowercase() == "license.md" {
                        continue;
                    }

                    let description = match name.as_str() {
                        "apps/" => Some("Core full-stack application scaffolding structure including nested directories for api, desktop, mobile (iOS/Android), web, cli, and docker environments.".to_string()),
                        "packages/" => Some("Monorepo shared library directory for storing internal dependencies, shared UI components, TS types, and core backend crates.".to_string()),
                        "agent.md" => Some("System rules and behavioral instructions governing AI agent operations in the workspace.".to_string()),
                        "brand.md" => Some("Design system document encompassing typography, color palettes, and UI component standards.".to_string()),
                        "contributing.md" => Some("Community contribution guidelines, PR policies, and codebase governance rules.".to_string()),
                        "deploy.yml" => Some("GitHub Actions CI/CD workflow configuration for automated testing and deployment.".to_string()),
                        "design.md" => Some("Architectural blueprints, database schemas, and frontend UI mockups.".to_string()),
                        "env.example" => Some("Environment variable template demonstrating required configuration keys without exposing secrets.".to_string()),
                        "firebase.md" => Some("Firebase configuration, security rules, and SDK initialization references.".to_string()),
                        "github.md" => Some("GitHub workflow documentation and git integration rules.".to_string()),
                        "layout.tsx" => Some("Next.js root layout component template establishing the core application shell.".to_string()),
                        "middleware.ts" => Some("Next.js Edge Middleware for handling authentication routing and request manipulation.".to_string()),
                        "plan.md" => Some("Strategic project roadmap, milestone tracking, and task decomposition.".to_string()),
                        "ratelimit.ts" => Some("Upstash Redis-based rate limiting logic to protect API endpoints.".to_string()),
                        "readme.md" => Some("Project entry-point document pre-populated with Code Scaffold branding, tech stack table, setup instructions, project structure map, and script reference. Deployed to the project root as README.md.".to_string()),
                        "redis.ts" => Some("Upstash Redis client initialization and connection handling.".to_string()),
                        "skills.md" => Some("Registry of custom AI agent skills and their associated capabilities.".to_string()),
                        "testing.md" => Some("Quality assurance guidelines, test coverage requirements, and Playwright automation steps.".to_string()),
                        "todo.md" => Some("Immediate, actionable checklist for granular feature implementation and bug fixes.".to_string()),
                        "vercel.json" => Some("Vercel deployment configuration, serverless function settings, and routing rules.".to_string()),
                        ".gitignore" => Some("Standard exclusions for build artifacts, node_modules, and environment files.".to_string()),
                        _ => None,
                    };

                    items.push(WorkspaceItem {
                        label: name.clone(),
                        selected: name.to_lowercase() == "agent.md"
                            || name.to_lowercase() == "readme.md",
                        category: Category::Artifacts,
                        description,
                        version: None,
                        exists_in_target: false,
                        target_version: None,
                        logo: None,
                    });
                }
            }
        } else {
            items.push(WorkspaceItem {
                label: "Failed to load .templates directory".into(),
                selected: false,
                category: Category::Artifacts,
                description: None,
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            });
        }

        let licenses_dir = payload_dir.join(".licenses");
        if licenses_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&licenses_dir) {
                let mut lic_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
                    .map(|e| {
                        let name = e.file_name().to_string_lossy().to_string();
                        name.strip_suffix(".md").unwrap_or(&name).to_string()
                    })
                    .collect();
                lic_names.sort();

                items.push(WorkspaceItem {
                    label: "None".into(),
                    selected: false,
                    category: Category::License,
                    description: Some("No license file will be written to the project. All default copyright laws apply — the code is implicitly \"All Rights Reserved\" until a license is chosen.\n\nTypical Use Cases:\n* Early-stage private projects not yet ready for public licensing\n* Internal tooling never intended for distribution\n* Projects pending legal review before going public".into()),
                    version: None,
                    exists_in_target: false,
                    target_version: None,
                    logo: None,
                });
                for name in lic_names {
                    let description = match name.as_str() {
                        "All Rights Reserved" => Some(
                            "Full copyright protection with NO permissions granted. The copyright holder retains all exclusive rights — redistribution, modification, sublicensing, and commercial use are all prohibited without express written consent.\n\nTypical Use Cases:\n* Commercial SaaS products or proprietary desktop software\n* Paid plugins, themes, or tools with restricted distribution\n* Internal enterprise codebases not intended for external sharing\n* Pre-launch projects protecting IP before a public release strategy is decided".to_string()
                        ),
                        "MIT License" => Some(
                            "A short, permissive license with minimal restrictions. Anyone can use, copy, modify, merge, publish, distribute, sublicense, and/or sell the software — provided the copyright notice is retained.\n\nTypical Use Cases:\n* Open-source libraries and frameworks intended for maximum adoption\n* Developer tools, CLIs, and utilities where contribution is encouraged\n* Academic and research projects intended to be widely built upon\n* Any project where your goal is maximum permissiveness and simplicity".to_string()
                        ),
                        "Apache 2.0" => Some(
                            "Permissive like MIT but adds explicit patent grants and protections. Contributors grant users a license to any patents they hold that cover their contributions, and the license protects downstream users from patent litigation.\n\nTypical Use Cases:\n* Enterprise-grade open-source projects where patent protection matters\n* SDKs, APIs, and libraries used in corporate environments\n* Projects with contributors from large tech companies (e.g., Google, Apache Foundation)\n* Situations where you want permissiveness but also explicit legal patent clarity".to_string()
                        ),
                        "GPL v3" => Some(
                            "A strong \"copyleft\" license. Any software that incorporates GPL-licensed code must also be distributed under GPL v3 with full source code available. Prevents proprietary forks.\n\nTypical Use Cases:\n* Tools and utilities where you want all derivative works to remain open source\n* Community-driven projects opposing proprietary lock-in\n* Software where preserving freedom for all downstream users is a priority\n* Alternatives to commercial software (e.g., OS tools, editors, compilers)".to_string()
                        ),
                        "LGPL v3" => Some(
                            "A \"weak copyleft\" license designed for libraries. Applications that merely link to an LGPL library do NOT need to be open-sourced. Only modifications to the LGPL library itself must remain open.\n\nTypical Use Cases:\n* Open-source libraries intended for use in both open and proprietary applications\n* Shared utility packages where you want adoption without forcing copyleft on consumers\n* GUI toolkits, database drivers, or parsing libraries used across ecosystems\n* Middleware or SDKs that bridge open-source and commercial worlds".to_string()
                        ),
                        "AGPL v3" => Some(
                            "The strongest copyleft license — extends GPL v3 to cover network use. If you run AGPL software as a web service, you MUST provide the modified source code to all users who interact with it over a network.\n\nTypical Use Cases:\n* Server-side web applications and SaaS platforms you want to keep open\n* Databases, analytics engines, or collaboration tools (e.g., Nextcloud-style apps)\n* Projects explicitly countering the \"SaaS loophole\" in GPL\n* Situations where you want any hosted fork to be publicly open-sourced".to_string()
                        ),
                        "BSD 2-Clause" => Some(
                            "A minimal permissive license requiring only copyright notice and source redistribution disclaimer. Similar to MIT but slightly more explicit about source vs. binary redistribution.\n\nTypical Use Cases:\n* Academic and university research software\n* Low-overhead open-source utilities and system tools\n* Projects where MIT-level permissiveness is wanted with BSD's explicit binary clause\n* Legacy compatibility with BSD-lineage ecosystems (FreeBSD, OpenBSD)".to_string()
                        ),
                        "BSD 3-Clause" => Some(
                            "Extends BSD 2-Clause with a non-endorsement clause — no one may use the project's name or contributors' names to promote derived works without permission.\n\nTypical Use Cases:\n* Projects where preventing unauthorized brand endorsements is important\n* Software distributed by organizations that want to protect their reputation\n* Academic institutions, research labs, and standards bodies\n* A step above BSD 2-Clause when name/brand protection matters".to_string()
                        ),
                        "Mozilla Public License 2.0" => Some(
                            "A file-level copyleft license. Individual files under MPL must remain open-source, but they can be combined with proprietary code in larger projects. A pragmatic middle ground between MIT and GPL.\n\nTypical Use Cases:\n* Projects that want copyleft on their core files but allow proprietary integration\n* Browser extensions, plugins, or components used in larger commercial applications\n* Situations where you want to encourage open contributions to specific modules\n* Teams that need compatibility with both GPL and proprietary code in one codebase".to_string()
                        ),
                        "The Unlicense" => Some(
                            "Releases the software into the public domain with no restrictions whatsoever. No attribution required. Anyone can use it for any purpose, modify it freely, and relicense it under any terms.\n\nTypical Use Cases:\n* Code snippets, boilerplates, and templates you truly want to be unrestricted\n* Public domain contributions to knowledge commons or educational resources\n* Trivial utilities where any licensing overhead feels unnecessary\n* Situations where maximum freedom — including the right to relicense — is the goal".to_string()
                        ),
                        _ => None,
                    };
                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::License,
                        description,
                        version: None,
                        exists_in_target: false,
                        target_version: None,
                        logo: None,
                    });
                }
            }
        }

        let contributions_dir = payload_dir.join(".contributions");
        if contributions_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&contributions_dir) {
                let mut cont_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
                    .map(|e| {
                        let name = e.file_name().to_string_lossy().to_string();
                        name.strip_suffix(".md").unwrap_or(&name).to_string()
                    })
                    .collect();
                cont_names.sort();

                for name in cont_names {
                    let description = match name.as_str() {
                        "open-source" => Some("Standard open-source contribution guidelines permitting PRs and community development.".to_string()),
                        "strict-ownership" => Some("Soft-closed PR policy enforcing issues/discussions only to maintain strict architectural integrity.".to_string()),
                        _ => None,
                    };

                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::ContributingTemplate,
                        description,
                        version: None,
                        exists_in_target: false,
                        target_version: None,
                        logo: None,
                    });
                }
            }
        }

        let skills_dir = payload_dir.join(".skills");

        items.push(WorkspaceItem {
            label: "[+] Bring Your Own Skill (BYOS)".into(),
            selected: false,
            category: Category::AgentSkills,
            description: Some("Approved Platforms:\n- agentskill.sh\n- agentskills.io\n- github.com\n- mcpservers.org\n- microsoft.github.io/skills\n- skills.sh\n- skillsmp.com".into()),
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });

        for custom_skill_url in crate::prefs::load_custom_skills() {
            let name = custom_skill_url
                .split('/')
                .last()
                .unwrap_or("custom-skill")
                .trim()
                .replace(".git", "");
            let parsed_name = if name.is_empty() {
                "custom-skill".to_string()
            } else {
                name.replace("skills-", "")
            };
            items.push(WorkspaceItem {
                label: format!("(BYOS) {}", parsed_name),
                selected: false,
                category: Category::AgentSkills,
                description: Some(custom_skill_url),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            });
        }

        if skills_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&skills_dir) {
                let mut skill_names: Vec<String> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect();
                skill_names.sort_by(|a, b| {
                    if a == "generic" {
                        std::cmp::Ordering::Less
                    } else if b == "generic" {
                        std::cmp::Ordering::Greater
                    } else {
                        a.to_lowercase().cmp(&b.to_lowercase())
                    }
                });
                for name in skill_names {
                    let mut desc = None;
                    let mut vers = None;
                    let mut logo = None;
                    let meta_path = skills_dir.join(&name).join("meta.json");
                    if let Ok(content) = std::fs::read_to_string(&meta_path) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(desc_str) = json.get("description").and_then(|v| v.as_str())
                            {
                                desc = Some(desc_str.to_string());
                            }
                            if let Some(vers_str) = json.get("version").and_then(|v| v.as_str()) {
                                vers = Some(vers_str.to_string());
                            }
                            if let Some(logo_arr) = json.get("logo").and_then(|v| v.as_array()) {
                                let mut lines = Vec::new();
                                for l in logo_arr {
                                    if let Some(l_str) = l.as_str() {
                                        lines.push(l_str.to_string());
                                    }
                                }
                                if !lines.is_empty() {
                                    logo = Some(lines);
                                }
                            }
                        }
                    }
                    items.push(WorkspaceItem {
                        label: name,
                        selected: false,
                        category: Category::AgentSkills,
                        description: desc,
                        version: vers,
                        exists_in_target: false,
                        target_version: None,
                        logo,
                    });
                }
            } else {
                items.push(WorkspaceItem {
                    label: "Failed to read skills directory".into(),
                    selected: false,
                    category: Category::AgentSkills,
                    description: None,
                    version: None,
                    exists_in_target: false,
                    target_version: None,
                    logo: None,
                });
            }
        } else {
            items.push(WorkspaceItem {
                label: "Could not find .skills directory".into(),
                selected: false,
                category: Category::AgentSkills,
                description: None,
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            });
        }

        Self {
            items,
            selected_idx: 0,
            current_category: Category::DeploymentTarget,
            state: ListState::default(),
        }
    }

    pub fn set_category(&mut self, cat: Category) {
        if self.current_category != cat {
            self.current_category = cat;
            self.selected_idx = 0;
            self.state.select(Some(0));
        }
    }

    pub fn visible_indices(&self) -> Vec<usize> {
        self.items
            .iter()
            .enumerate()
            .filter(|(_, item)| item.category == self.current_category)
            .map(|(i, _)| i)
            .collect()
    }

    pub fn selected_label(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        Some(&self.items[*actual_idx].label)
    }

    pub fn selected_description(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        self.items[*actual_idx].description.as_deref()
    }

    pub fn selected_version(&self) -> Option<&str> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        self.items[*actual_idx].version.as_deref()
    }

    pub fn selected_logo(&self) -> Option<&Vec<String>> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return None;
        }
        let actual_idx = visible.get(self.selected_idx)?;
        self.items[*actual_idx].logo.as_ref()
    }

    pub fn detect_installed(&mut self, target_folder: &str) {
        let target = std::path::PathBuf::from(target_folder);
        if !target.exists() || !target.is_dir() {
            return;
        }

        // 1. Reset
        for item in &mut self.items {
            item.exists_in_target = false;
            item.target_version = None;
        }

        let manifest_path = target.join("manifest.json");

        if let Ok(content) = std::fs::read_to_string(&manifest_path) {
            if let Ok(manifest) =
                serde_json::from_str::<crate::models::manifest::Manifest>(&content)
            {
                for artifact in manifest.artifacts {
                    if let Some(item) = self.items.iter_mut().find(|i| i.label == artifact.label) {
                        item.exists_in_target = true;
                        item.selected = true;
                    }
                }
                for skill in manifest.skills {
                    if let Some(item) = self.items.iter_mut().find(|i| i.label == skill.label) {
                        item.exists_in_target = true;
                        item.selected = true;
                    }
                }
            }
        }

        for item in &mut self.items {
            if item.category == Category::Artifacts {
                let p2 = if item.label.eq_ignore_ascii_case("apps/")
                    || item.label.eq_ignore_ascii_case("packages/")
                {
                    target.join(&item.label)
                } else {
                    target.join("project_details").join(&item.label)
                };
                if p2.exists() {
                    item.exists_in_target = true;
                    item.selected = true;
                }
            } else if item.category == Category::AgentSkills {
                let skill_meta = target.join(".skills").join(&item.label).join("meta.json");
                if skill_meta.exists() {
                    item.exists_in_target = true;
                    item.selected = true;
                    if let Ok(content) = std::fs::read_to_string(&skill_meta) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(v) = json.get("version").and_then(|v| v.as_str()) {
                                item.target_version = Some(v.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
}

impl Component for Workspace {
    fn update(&mut self, action: Action) -> Result<Option<Action>> {
        let visible = self.visible_indices();
        if visible.is_empty() {
            return Ok(None);
        }

        match action {
            Action::Up => {
                self.selected_idx = self.selected_idx.saturating_sub(1);
                self.state.select(Some(self.selected_idx));
            }
            Action::Down => {
                self.selected_idx = (self.selected_idx + 1).min(visible.len().saturating_sub(1));
                self.state.select(Some(self.selected_idx));
            }
            Action::Char(' ') => {
                let actual_idx = visible[self.selected_idx];
                let new_state = !self.items[actual_idx].selected;
                let category = self.items[actual_idx].category.clone();
                let label = self.items[actual_idx].label.clone();

                if category == Category::License || category == Category::ContributingTemplate {
                    for item in &mut self.items {
                        if item.category == category {
                            item.selected = false;
                        }
                    }
                }

                self.items[actual_idx].selected = new_state;

                // Enforce companions
                if category == Category::AgentPersona {
                    if (label == "Web Dev" || label == "Mobile (iOS/And)") && new_state {
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "privacy-policy" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                    }
                    if label == "Web Dev" && new_state {
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "seo-geo-aeo-auditor" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "website-deploy-linux" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "playwright" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                    }
                    if label == "Security Analyst" && new_state {
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "cybersecurity-toolkit"
                                && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                    }
                    if label == "Cloud & DevOps Architect" && new_state {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "ansible" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "terraform" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                    if label == "AI Systems Engineer" && new_state {
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "mcp-generator" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "trackio" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                }

                if category == Category::AgentSkills {
                    if label == "firebase" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "firebase.md" && i.category == Category::Artifacts)
                        {
                            companion.selected = new_state;
                        }
                    } else if label == "github" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "github.md" && i.category == Category::Artifacts)
                        {
                            companion.selected = new_state;
                        }
                    }
                } else if category == Category::Artifacts {
                    if label == "firebase.md" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "firebase" && i.category == Category::AgentSkills)
                        {
                            companion.selected = new_state;
                        }
                    } else if label == "github.md" {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "github" && i.category == Category::AgentSkills)
                        {
                            companion.selected = new_state;
                        }
                    }
                }
            }
            Action::Enter => {
                return Ok(Some(Action::Enter));
            }
            _ => {}
        }
        Ok(None)
    }

    fn draw(
        &mut self,
        f: &mut ratatui::Frame<'_>,
        area: Rect,
        active: bool,
        theme: &Theme,
    ) -> Result<()> {
        let border_color = if active {
            theme.primary
        } else {
            theme.secondary
        };
        let border_style = Style::default().fg(border_color).bg(theme.bg);

        let visible = self.visible_indices();
        let mut list_items = Vec::new();

        for (i, actual_idx) in visible.iter().enumerate() {
            let item = &self.items[*actual_idx];
            let checkbox = if item.selected { "[X]" } else { "[ ]" };
            let display = if item.exists_in_target {
                if let (Some(tv), Some(v)) = (&item.target_version, &item.version) {
                    if tv != v {
                        format!("{} {} [upgrade to v{}]", checkbox, item.label, v)
                    } else {
                        format!("{} {} [Current version installed]", checkbox, item.label)
                    }
                } else {
                    format!("{} {} [Exists]", checkbox, item.label)
                }
            } else {
                format!("{} {}", checkbox, item.label)
            };

            let style = Style::default().fg(theme.text).bg(theme.bg);

            list_items.push(ListItem::new(display).style(style));
        }

        let list = List::new(list_items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Deployment Configuration ")
                .border_style(border_style)
                .style(Style::default().bg(theme.bg)),
        );

        let list = if active {
            list.highlight_style(Style::default().bg(theme.primary).fg(theme.bg))
                .highlight_symbol(">> ")
        } else {
            list.highlight_style(Style::default().fg(theme.primary))
                .highlight_symbol("   ")
        };

        self.state.select(Some(self.selected_idx));
        f.render_stateful_widget(list, area, &mut self.state);
        Ok(())
    }
}
