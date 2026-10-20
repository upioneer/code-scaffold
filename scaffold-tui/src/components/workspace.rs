use crate::action::Action;
use crate::components::nav_tree::Category;
use crate::components::Component;
use crate::theme::Theme;
use anyhow::Result;
use ratatui::prelude::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, ListState, Paragraph};

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

impl WorkspaceItem {
    pub fn is_recommended(&self) -> bool {
        match self.category {
            Category::Artifacts => {
                let l = self.label.to_ascii_lowercase();
                l == ".gitignore" || l == "readme.md" || l == "agent.md"
            }
            Category::AgentSkills => {
                let l = self.label.to_ascii_lowercase();
                l == "github" || l == "changelog-plus"
            }
            _ => false,
        }
    }
}

pub struct Workspace {
    pub items: Vec<WorkspaceItem>,
    pub selected_idx: usize,
    pub current_category: Category,
    pub state: ListState,
    pub target_folder: String,
}

impl Workspace {
    pub fn new(payload_dir: std::path::PathBuf) -> Self {
        // Step 1 (DeploymentTarget) carries no selectable rows: the pane
        // renders a static target confirmation and all actions run through
        // hotkeys ([Enter] continue, [F] browse, [R] reset, [W] welcome).
        let mut items = vec![];

        items.extend(vec![
            WorkspaceItem {
                label: "Generic".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("A versatile, unopinionated agent ready for general-purpose programming, debugging, and software architecture tasks without specific domain constraints.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Academic / Research".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Enforce strict citation integrity (BibTeX/LaTeX), hypothesis tracking, reproducible research methodology, PRISMA review standards, and document compilation via Quarto and Pandoc.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "AEC / BIM & Parametric".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Automate building information modeling (BIM), IFC data extraction (IfcOpenShell), structural load scripts, spatial daylight/thermal analysis, and parametric geometry.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "AI Systems Engineer".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in LLMs (hosted/local), multimodal generation (ComfyUI), and AI APIs (Claude, Gemini, Grok). Expert in AI CLI tools, OpenRouter, and advanced RAG/Agentic frameworks (LangGraph, PixelRAG, Dify).".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "CAD & Mech Engineering".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Emphasize parametric 3D CAD modeling (OpenSCAD, CadQuery, FreeCAD), GD&T, tolerance stack-up analysis, bill of materials (BOM) generation, and design for manufacturing (DFM).".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Cloud & DevOps Architect".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in infrastructure-as-code (Terraform, CloudFormation), CI/CD pipeline automation (GitHub Actions), and provisioning robust cloud environments on AWS, Azure, or GCP.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Computational Science".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focus on numerical stability, floating-point precision, SI unit consistency, differential equations, and scientific modeling with NumPy/SciPy, SymPy, Julia, and R.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Containerization (Docker/K8s)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focused strictly on container ecosystems. Excels at writing Dockerfiles, optimizing multi-stage image builds, orchestrating docker-compose, and building Kubernetes manifests.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Data Scientist / ML".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in the Python data ecosystem (Pandas, PyTorch, TensorFlow). Highly effective at data wrangling, model training, Jupyter notebooks, and statistical analysis.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "DBA".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Database Administrator focused on SQL/NoSQL schema design, query optimization, indexing strategies, and database migration safety.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "EDA & Hardware (HDL)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focus on digital/analog circuit design, HDL synthesis and verification (Verilog, VHDL), KiCad PCB layout scripting, SPICE simulation, and register-transfer level (RTL) timing closure.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Embedded / IoT".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Focused on strict memory management and hardware interactions (C, C++, bare-metal Rust). Specialized in microcontrollers, RTOS, and highly constrained computational environments.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Game Developer".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Tuned for physics engines, 3D rendering pipelines, game loops, and state machines within environments like Unity (C#) or Unreal Engine (C++).".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "GIS & Spatial Systems".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Handle coordinate reference systems (CRS), geospatial data pipelines (GDAL, PostGIS, GeoJSON, Shapely), LiDAR point clouds, and spatial indexing.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Mobile (iOS/And)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Expert in mobile app development, including iOS (Swift) and Android (Kotlin) as well as cross-platform frameworks like React Native and Flutter.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Quant & Econometrics".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Prioritize financial risk modeling, time-series analysis, algorithmic backtesting rigor, look-ahead bias prevention, and Monte Carlo simulation with quantitative libraries.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Robotics & Controls".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Enforce real-time loop constraints, kinematics/dynamics, sensor fusion (Kalman filters), URDF modeling, Gazebo simulation, and robot operating systems (ROS2).".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Security Analyst".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("An auditor-style agent focused on network security, cryptographic protocols, vulnerability scanning, and hardening systems against modern exploit techniques.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Simulation (FEA/CFD)".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Manage finite element analysis (FEA) and computational fluid dynamics (CFD) workflows, mesh generation (Gmsh), boundary condition setup, convergence verification, and stress/flow post-processing.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Systems Scripting".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Aimed at low-level OS tasks, bash/powershell scripting, automation, system performance tuning, and CLI tool development.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
            },
            WorkspaceItem {
                label: "Web Dev".into(),
                selected: false,
                category: Category::AgentPersona,
                description: Some("Specialized in modern full-stack web technologies (React, Next.js, Vue, Node.js, HTML/CSS). MUST strictly enforce zero pre-consent tracking: ensure no tracking pixels, analytics SDKs (e.g., Google Analytics, PostHog, Mixpanel), marketing tags, or third-party scripts load or execute until the user explicitly clicks 'Accept' on the cookie consent banner; provide a categorized consent model (strictly essential vs analytics/marketing), persistent state storage with revocation controls, and automated verification tests asserting zero pre-consent network requests. MUST strictly enforce mobile-first responsive design (320px+ viewports, fluid typography, >=48px touch targets, zero horizontal overflow) and automated SEO/GEO/AEO lifecycle maintenance (dynamic metadata, canonical URLs, JSON-LD structured schemas, sitemap.xml, robots.txt, semantic HTML hierarchies). MUST strictly enforce security best practices: rate limiting, secure password hashing, and OWASP protection.".into()),
                version: None,
                exists_in_target: false,
                target_version: None,
                logo: None,
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
                    // Platform configuration files are owned by their respective
                    // skills (github, firebase, vercel) and provisioned through
                    // skill selection plus .env defaults, so they are not
                    // offered as standalone selectable artifacts.
                    match name.to_lowercase().as_str() {
                        "deploy.yml" | "vercel.json" | "firebase.md" | "github.md" => continue,
                        _ => {}
                    }

                    let description = match name.as_str() {
                        "apps/" => Some("Core full-stack application scaffolding structure including nested directories for api, desktop, mobile (iOS/Android), web, cli, and docker environments.".to_string()),
                        "packages/" => Some("Monorepo shared library directory for storing internal dependencies, shared UI components, TS types, and core backend crates.".to_string()),
                        "agent.md" => Some("System rules and behavioral instructions governing AI agent operations in the workspace. Deployed to .agents/AGENTS.md with your selected personas injected.".to_string()),
                        "brand.md" => Some("Design system document encompassing typography, color palettes, and UI component standards.".to_string()),
                        "bump_version.ps1" => Some("Universal, adaptable semantic version bumping script that synchronizes project package manifests (Node package.json, Rust Cargo.toml, Python pyproject.toml), enforces semver rules, triggers changelog generation, and automates media capture.".to_string()),
                        "contributing.md" => Some("Community contribution guidelines, PR policies, and codebase governance rules. Configured via the Contributing wizard and deployed to project root as CONTRIBUTING.md.".to_string()),
                        "design.md" => Some("Architectural blueprints, database schemas, and frontend UI mockups.".to_string()),
                        "env.example" => Some("Environment variable template demonstrating required configuration keys without exposing secrets.".to_string()),
                        "layout.tsx" => Some("Next.js root layout component template establishing the core application shell.".to_string()),
                        "middleware.ts" => Some("Next.js Edge Middleware for handling authentication routing and request manipulation.".to_string()),
                        "plan.md" => Some("Strategic project roadmap, milestone tracking, and task decomposition.".to_string()),
                        "ratelimit.ts" => Some("Upstash Redis-based rate limiting logic to protect API endpoints.".to_string()),
                        "readme.md" => Some("Project entry-point document pre-populated with Code Scaffold branding, tech stack table, setup instructions, project structure map, and script reference. Deployed to the project root as README.md.".to_string()),
                        "redis.ts" => Some("Upstash Redis client initialization and connection handling.".to_string()),
                        "skills.md" => Some("Registry of custom AI agent skills and their associated capabilities.".to_string()),
                        "testing.md" => Some("Quality assurance guidelines, test coverage requirements, and Playwright automation steps.".to_string()),
                        "todo.md" => Some("Immediate, actionable checklist for granular feature implementation and bug fixes.".to_string()),
                        ".gitignore" => Some("Standard exclusions for build artifacts, node_modules, and environment files.".to_string()),
                        _ => None,
                    };

                    let is_default_selected = name.eq_ignore_ascii_case("agent.md")
                        || name.eq_ignore_ascii_case("readme.md")
                        || name.eq_ignore_ascii_case(".gitignore");

                    items.push(WorkspaceItem {
                        label: name.clone(),
                        selected: is_default_selected,
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
                    description: Some("No license file will be written to the project. All default copyright laws apply: the code is implicitly \"All Rights Reserved\" until a license is chosen.\n\nTypical Use Cases:\n* Early-stage private projects not yet ready for public licensing\n* Internal tooling never intended for distribution\n* Projects pending legal review before going public".into()),
                    version: None,
                    exists_in_target: false,
                    target_version: None,
                    logo: None,
                });
                for name in lic_names {
                    let description = match name.as_str() {
                        "All Rights Reserved" => Some(
                            "Proprietary license granting permitted personal, non-commercial self-hosting and private source review while strictly prohibiting redistribution, public forks, commercial exploitation, and SaaS hosting without prior written consent.\n\nTypical Use Cases:\n* Personal home automation or self-hosted developer tools\n* Commercial SaaS and proprietary products guarding against unauthorized forks\n* Source-available software protecting IP while allowing user self-hosting\n* Projects with reserved commercial rights and enterprise licensing models".to_string()
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
        let mut cont_items: Vec<(String, Option<String>)> = Vec::new();

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
                    cont_items.push((name, description));
                }
            }
        }

        if cont_items.is_empty() {
            cont_items.push((
                "open-source".to_string(),
                Some("Standard open-source contribution guidelines permitting PRs and community development.".to_string()),
            ));
            cont_items.push((
                "strict-ownership".to_string(),
                Some("Soft-closed PR policy enforcing issues/discussions only to maintain strict architectural integrity.".to_string()),
            ));
        }

        for (name, description) in cont_items {
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
                            vers = extract_json_version(&json);
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
                    if vers.is_none() {
                        let manifest_path = skills_dir.join(&name).join("skill-manifest.json");
                        if let Ok(content) = std::fs::read_to_string(&manifest_path) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                vers = extract_json_version(&json);
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
            target_folder: String::new(),
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
}

// ---------------------------------------------------------------------------
// Target Codebase Detection Engine Helpers
// ---------------------------------------------------------------------------

fn path_exists_case_insensitive(dir: &std::path::Path, filename: &str) -> bool {
    if !dir.is_dir() {
        return false;
    }
    if dir.join(filename).exists() {
        return true;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry
                .file_name()
                .to_string_lossy()
                .eq_ignore_ascii_case(filename)
            {
                return true;
            }
        }
    }
    false
}

fn extract_json_version(json: &serde_json::Value) -> Option<String> {
    if let Some(v) = json.get("version") {
        if let Some(s) = v.as_str() {
            return Some(s.to_string());
        }
        if let Some(n) = v.as_u64() {
            return Some(n.to_string());
        }
        if let Some(n) = v.as_i64() {
            return Some(n.to_string());
        }
    }
    None
}

fn find_dir_case_insensitive(
    parent: &std::path::Path,
    dirname: &str,
) -> Option<std::path::PathBuf> {
    let direct = parent.join(dirname);
    if direct.is_dir() {
        return Some(direct);
    }
    if let Ok(entries) = std::fs::read_dir(parent) {
        for entry in entries.flatten() {
            if entry
                .file_name()
                .to_string_lossy()
                .eq_ignore_ascii_case(dirname)
                && entry.path().is_dir()
            {
                return Some(entry.path());
            }
        }
    }
    None
}

fn read_file_case_insensitive(dir: &std::path::Path, filename: &str) -> Option<String> {
    if !dir.is_dir() {
        return None;
    }
    let direct = dir.join(filename);
    if direct.is_file() {
        if let Ok(c) = std::fs::read_to_string(&direct) {
            return Some(c);
        }
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry
                .file_name()
                .to_string_lossy()
                .eq_ignore_ascii_case(filename)
                && entry.path().is_file()
            {
                if let Ok(c) = std::fs::read_to_string(entry.path()) {
                    return Some(c);
                }
            }
        }
    }
    None
}

fn check_artifact_exists_on_disk(target: &std::path::Path, label: &str) -> bool {
    let lower = label.to_lowercase();
    match lower.as_str() {
        "readme.md" => {
            path_exists_case_insensitive(target, "README.md")
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, "README.md"))
                    .unwrap_or(false)
        }
        ".gitignore" => {
            path_exists_case_insensitive(target, ".gitignore")
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, ".gitignore"))
                    .unwrap_or(false)
        }
        "bump_version.ps1" => {
            path_exists_case_insensitive(target, "bump_version.ps1")
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| {
                        path_exists_case_insensitive(&d, "bump_version.ps1")
                            || find_dir_case_insensitive(&d, "playbooks")
                                .map(|p| path_exists_case_insensitive(&p, "bump_version.ps1"))
                                .unwrap_or(false)
                    })
                    .unwrap_or(false)
        }
        "env.example" => {
            path_exists_case_insensitive(target, ".env.example")
                || path_exists_case_insensitive(target, "env.example")
                || path_exists_case_insensitive(target, ".env")
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| {
                        path_exists_case_insensitive(&d, ".env.example")
                            || path_exists_case_insensitive(&d, "env.example")
                    })
                    .unwrap_or(false)
        }
        "agent.md" => {
            find_dir_case_insensitive(target, ".agents")
                .map(|d| {
                    path_exists_case_insensitive(&d, "AGENTS.md")
                        || path_exists_case_insensitive(&d, "agent.md")
                        || path_exists_case_insensitive(&d, "AGENTS")
                })
                .unwrap_or(false)
                || path_exists_case_insensitive(target, "AGENTS.md")
                || path_exists_case_insensitive(target, "AGENT.md")
                || path_exists_case_insensitive(target, "agent.md")
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| {
                        path_exists_case_insensitive(&d, "agent.md")
                            || path_exists_case_insensitive(&d, "AGENT.md")
                            || path_exists_case_insensitive(&d, "AGENTS.md")
                    })
                    .unwrap_or(false)
        }
        "contributing.md" => {
            let check_file = |p: &std::path::Path| {
                if p.is_file() {
                    if let Ok(c) = std::fs::read_to_string(p) {
                        return is_valid_contributing_text(&c);
                    }
                }
                false
            };
            check_file(&target.join("CONTRIBUTING.md"))
                || check_file(&target.join("contributing.md"))
                || find_dir_case_insensitive(target, ".github")
                    .map(|d| {
                        check_file(&d.join("CONTRIBUTING.md"))
                            || check_file(&d.join("contributing.md"))
                    })
                    .unwrap_or(false)
        }
        "apps/" => {
            let p = target.join("apps");
            p.exists() && p.is_dir()
        }
        "packages/" => {
            let p = target.join("packages");
            p.exists() && p.is_dir()
        }
        "layout.tsx" => {
            find_dir_case_insensitive(target, "app")
                .map(|d| path_exists_case_insensitive(&d, "layout.tsx"))
                .unwrap_or(false)
                || find_dir_case_insensitive(target, "src")
                    .and_then(|s| find_dir_case_insensitive(&s, "app"))
                    .map(|d| path_exists_case_insensitive(&d, "layout.tsx"))
                    .unwrap_or(false)
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, "layout.tsx"))
                    .unwrap_or(false)
                || path_exists_case_insensitive(target, "layout.tsx")
        }
        "middleware.ts" => {
            path_exists_case_insensitive(target, "middleware.ts")
                || find_dir_case_insensitive(target, "src")
                    .map(|d| path_exists_case_insensitive(&d, "middleware.ts"))
                    .unwrap_or(false)
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, "middleware.ts"))
                    .unwrap_or(false)
        }
        "ratelimit.ts" => {
            find_dir_case_insensitive(target, "lib")
                .map(|d| path_exists_case_insensitive(&d, "ratelimit.ts"))
                .unwrap_or(false)
                || find_dir_case_insensitive(target, "src")
                    .and_then(|s| find_dir_case_insensitive(&s, "lib"))
                    .map(|d| path_exists_case_insensitive(&d, "ratelimit.ts"))
                    .unwrap_or(false)
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, "ratelimit.ts"))
                    .unwrap_or(false)
                || path_exists_case_insensitive(target, "ratelimit.ts")
        }
        "redis.ts" => {
            find_dir_case_insensitive(target, "lib")
                .map(|d| path_exists_case_insensitive(&d, "redis.ts"))
                .unwrap_or(false)
                || find_dir_case_insensitive(target, "src")
                    .and_then(|s| find_dir_case_insensitive(&s, "lib"))
                    .map(|d| path_exists_case_insensitive(&d, "redis.ts"))
                    .unwrap_or(false)
                || find_dir_case_insensitive(target, "project_details")
                    .map(|d| path_exists_case_insensitive(&d, "redis.ts"))
                    .unwrap_or(false)
                || path_exists_case_insensitive(target, "redis.ts")
        }
        _ => {
            find_dir_case_insensitive(target, "project_details")
                .map(|d| path_exists_case_insensitive(&d, label))
                .unwrap_or(false)
                || path_exists_case_insensitive(target, label)
        }
    }
}

fn is_valid_contributing_text(text: &str) -> bool {
    let trimmed = text.trim();
    !trimmed.is_empty() && !trimmed.contains("<!-- Placeholder for contributing.md")
}

fn detect_contributing_template(
    target: &std::path::Path,
    manifest_content: Option<&str>,
) -> Option<&'static str> {
    let mut found_content: Option<String> = None;

    for name in &["CONTRIBUTING.md", "contributing.md"] {
        if let Some(c) = read_file_case_insensitive(target, name) {
            if is_valid_contributing_text(&c) {
                found_content = Some(c);
                break;
            }
        }
    }

    if found_content.is_none() {
        if let Some(gh_dir) = find_dir_case_insensitive(target, ".github") {
            for name in &["CONTRIBUTING.md", "contributing.md"] {
                if let Some(c) = read_file_case_insensitive(&gh_dir, name) {
                    if is_valid_contributing_text(&c) {
                        found_content = Some(c);
                        break;
                    }
                }
            }
        }
    }

    if found_content.is_none() {
        if let Some(details_dir) = find_dir_case_insensitive(target, "project_details") {
            for name in &["CONTRIBUTING.md", "contributing.md"] {
                if let Some(c) = read_file_case_insensitive(&details_dir, name) {
                    if is_valid_contributing_text(&c) {
                        found_content = Some(c);
                        break;
                    }
                }
            }
        }
    }

    let text_to_check = found_content.as_deref().or(manifest_content);
    if let Some(text) = text_to_check {
        if !is_valid_contributing_text(text) {
            return None;
        }
        let text_lower = text.to_lowercase();
        if text_lower.contains("strict-ownership")
            || text_lower.contains("we do not accept or merge external")
            || text_lower.contains("soft-closed")
            || text_lower.contains("strict ownership")
            || text_lower.contains("closed pr")
        {
            Some("strict-ownership")
        } else if text_lower.contains("open-source")
            || text_lower.contains("open source")
            || text_lower.contains("pull request")
            || text_lower.contains("contributing")
        {
            Some("open-source")
        } else {
            None
        }
    } else {
        None
    }
}

fn detect_personas(
    target: &std::path::Path,
    manifest_persona_content: Option<&str>,
) -> Vec<String> {
    let mut combined_text = String::new();
    if let Some(mp) = manifest_persona_content {
        combined_text.push_str(mp);
        combined_text.push('\n');
    }

    // 1. Check .agents directory (canonical modern location)
    if let Some(agents_dir) = find_dir_case_insensitive(target, ".agents") {
        for name in &["AGENTS.md", "agent.md", "AGENTS"] {
            if let Some(c) = read_file_case_insensitive(&agents_dir, name) {
                combined_text.push_str(&c);
                combined_text.push('\n');
            }
        }
    }

    // 2. Check root directory
    for name in &["AGENTS.md", "AGENT.md", "agent.md"] {
        if let Some(c) = read_file_case_insensitive(target, name) {
            combined_text.push_str(&c);
            combined_text.push('\n');
        }
    }

    // 3. Check project_details directory (for backwards compatibility)
    if let Some(details_dir) = find_dir_case_insensitive(target, "project_details") {
        for name in &["agent.md", "AGENT.md", "AGENTS.md"] {
            if let Some(c) = read_file_case_insensitive(&details_dir, name) {
                combined_text.push_str(&c);
                combined_text.push('\n');
            }
        }
    }

    if combined_text.trim().is_empty() {
        return Vec::new();
    }

    let text_lower = combined_text.to_lowercase();
    let mut detected = Vec::new();

    // 1. Generic
    if text_lower.contains("**generic**")
        || text_lower.contains("### generic")
        || text_lower.contains("versatile, unopinionated agent")
        || text_lower.contains("general-purpose programming")
    {
        detected.push("Generic".to_string());
    }

    // 2. Academic / Research
    if text_lower.contains("academic / research")
        || text_lower.contains("academic & research")
        || (text_lower.contains("bibtex") && text_lower.contains("latex"))
        || text_lower.contains("citation integrity")
        || text_lower.contains("prisma review")
        || (text_lower.contains("quarto") && text_lower.contains("pandoc"))
    {
        detected.push("Academic / Research".to_string());
    }

    // 3. AEC / BIM & Parametric
    if text_lower.contains("aec / bim & parametric")
        || text_lower.contains("aec / bim")
        || text_lower.contains("ifcopenshell")
        || text_lower.contains("building information modeling")
        || text_lower.contains("bim data extraction")
    {
        detected.push("AEC / BIM & Parametric".to_string());
    }

    // 4. AI Systems Engineer
    if text_lower.contains("ai systems engineer")
        || (text_lower.contains("llms") && text_lower.contains("comfyui"))
        || text_lower.contains("openrouter")
        || text_lower.contains("rag/agentic")
    {
        detected.push("AI Systems Engineer".to_string());
    }

    // 5. CAD & Mech Engineering
    if text_lower.contains("cad & mech engineering")
        || text_lower.contains("cad & mech")
        || text_lower.contains("parametric 3d cad")
        || text_lower.contains("cadquery")
        || text_lower.contains("openscad")
        || text_lower.contains("tolerance stack-up")
        || text_lower.contains("design for manufacturing")
    {
        detected.push("CAD & Mech Engineering".to_string());
    }

    // 6. Cloud & DevOps Architect
    if text_lower.contains("cloud & devops architect")
        || text_lower.contains("cloud & devops")
        || (text_lower.contains("terraform") && text_lower.contains("cloudformation"))
        || text_lower.contains("infrastructure-as-code")
    {
        detected.push("Cloud & DevOps Architect".to_string());
    }

    // 7. Computational Science
    if text_lower.contains("computational science")
        || (text_lower.contains("numerical stability")
            && text_lower.contains("floating-point precision"))
        || (text_lower.contains("scipy") && text_lower.contains("sympy"))
        || text_lower.contains("scientific modeling")
    {
        detected.push("Computational Science".to_string());
    }

    // 8. Containerization (Docker/K8s)
    if text_lower.contains("containerization (docker/k8s)")
        || text_lower.contains("containerization")
        || text_lower.contains("container ecosystems")
        || (text_lower.contains("dockerfiles")
            && text_lower.contains("docker-compose")
            && text_lower.contains("kubernetes"))
    {
        detected.push("Containerization (Docker/K8s)".to_string());
    }

    // 9. Data Scientist / ML
    if text_lower.contains("data scientist / ml")
        || text_lower.contains("data scientist")
        || (text_lower.contains("pandas") && text_lower.contains("pytorch"))
        || text_lower.contains("python data ecosystem")
    {
        detected.push("Data Scientist / ML".to_string());
    }

    // 10. DBA
    if text_lower.contains("**dba**")
        || text_lower.contains("### dba")
        || text_lower.contains("database administrator")
        || (text_lower.contains("sql/nosql schema design")
            && text_lower.contains("indexing strategies"))
        || text_lower.contains("database migration safety")
    {
        detected.push("DBA".to_string());
    }

    // 11. EDA & Hardware (HDL)
    if text_lower.contains("eda & hardware (hdl)")
        || text_lower.contains("eda & hardware")
        || text_lower.contains("verilog")
        || text_lower.contains("vhdl")
        || (text_lower.contains("circuit design") && text_lower.contains("timing closure"))
        || text_lower.contains("kicad pcb layout")
    {
        detected.push("EDA & Hardware (HDL)".to_string());
    }

    // 12. Embedded / IoT
    if text_lower.contains("embedded / iot")
        || text_lower.contains("embedded")
        || (text_lower.contains("bare-metal rust") && text_lower.contains("microcontrollers"))
        || text_lower.contains("microcontrollers, rtos")
    {
        detected.push("Embedded / IoT".to_string());
    }

    // 13. Game Developer
    if text_lower.contains("game developer")
        || (text_lower.contains("physics engines") && text_lower.contains("game loops"))
        || text_lower.contains("3d rendering pipelines")
    {
        detected.push("Game Developer".to_string());
    }

    // 14. GIS & Spatial Systems
    if text_lower.contains("gis & spatial systems")
        || text_lower.contains("gis & spatial")
        || text_lower.contains("coordinate reference systems")
        || text_lower.contains("geospatial data pipelines")
        || text_lower.contains("postgis")
        || text_lower.contains("shapely")
    {
        detected.push("GIS & Spatial Systems".to_string());
    }

    // 15. Mobile (iOS/And)
    if text_lower.contains("mobile (ios/and)")
        || text_lower.contains("mobile (ios/android)")
        || (text_lower.contains("ios (swift)") && text_lower.contains("android (kotlin)"))
        || text_lower.contains("mobile app development")
    {
        detected.push("Mobile (iOS/And)".to_string());
    }

    // 16. Quant & Econometrics
    if text_lower.contains("quant & econometrics")
        || text_lower.contains("financial risk modeling")
        || text_lower.contains("algorithmic backtesting")
        || text_lower.contains("look-ahead bias")
        || text_lower.contains("monte carlo simulation")
    {
        detected.push("Quant & Econometrics".to_string());
    }

    // 17. Robotics & Controls
    if text_lower.contains("robotics & controls")
        || text_lower.contains("real-time loop constraints")
        || text_lower.contains("ros2")
        || text_lower.contains("urdf")
        || (text_lower.contains("sensor fusion") && text_lower.contains("kalman"))
    {
        detected.push("Robotics & Controls".to_string());
    }

    // 18. Security Analyst
    if text_lower.contains("security analyst")
        || (text_lower.contains("auditor-style agent")
            && text_lower.contains("cryptographic protocols"))
        || text_lower.contains("vulnerability scanning")
    {
        detected.push("Security Analyst".to_string());
    }

    // 19. Simulation (FEA/CFD)
    if text_lower.contains("simulation (fea/cfd)")
        || text_lower.contains("fea/cfd")
        || text_lower.contains("finite element analysis")
        || text_lower.contains("computational fluid dynamics")
        || (text_lower.contains("mesh generation")
            && text_lower.contains("convergence verification"))
    {
        detected.push("Simulation (FEA/CFD)".to_string());
    }

    // 20. Systems Scripting
    if text_lower.contains("systems scripting")
        || (text_lower.contains("low-level os tasks")
            && text_lower.contains("powershell scripting"))
        || text_lower.contains("cli tool development")
    {
        detected.push("Systems Scripting".to_string());
    }

    // 21. Web Dev
    if text_lower.contains("web dev")
        || text_lower.contains("web developer")
        || (text_lower.contains("full-stack web technologies")
            && (text_lower.contains("mobile-first responsive design")
                || text_lower.contains("zero pre-consent tracking")))
    {
        detected.push("Web Dev".to_string());
    }

    detected
}

fn detect_license(
    target: &std::path::Path,
    manifest_license_str: Option<&str>,
) -> Option<&'static str> {
    let mut found_content: Option<String> = None;

    for name in &[
        "LICENSE.md",
        "LICENSE",
        "license.md",
        "license.txt",
        "LICENSE.txt",
    ] {
        if let Some(c) = read_file_case_insensitive(target, name) {
            found_content = Some(c);
            break;
        }
    }

    if found_content.is_none() {
        if let Some(details_dir) = find_dir_case_insensitive(target, "project_details") {
            for name in &[
                "LICENSE.md",
                "LICENSE",
                "license.md",
                "license.txt",
                "LICENSE.txt",
            ] {
                if let Some(c) = read_file_case_insensitive(&details_dir, name) {
                    found_content = Some(c);
                    break;
                }
            }
        }
    }

    if let Some(content) = found_content {
        let lower = content.to_lowercase();
        if lower.contains("apache license, version 2.0") || lower.contains("apache-2.0") {
            return Some("Apache 2.0");
        }
        if lower.contains("gnu affero general public license") || lower.contains("agpl") {
            return Some("AGPL v3");
        }
        if lower.contains("gnu lesser general public license") || lower.contains("lgpl") {
            return Some("LGPL v3");
        }
        if lower.contains("gnu general public license")
            || lower.contains("gpl-3.0")
            || lower.contains("gpl v3")
        {
            return Some("GPL v3");
        }
        if lower.contains("mozilla public license, version 2.0") || lower.contains("mpl-2.0") {
            return Some("Mozilla Public License 2.0");
        }
        if lower.contains("the unlicense") || lower.contains("unlicense.org") {
            return Some("The Unlicense");
        }
        if lower
            .contains("neither the name of the copyright holder nor the names of its contributors")
        {
            return Some("BSD 3-Clause");
        }
        if lower.contains("redistribution and use in source and binary forms") {
            return Some("BSD 2-Clause");
        }
        if lower.contains("all rights reserved")
            || lower.contains("strictly prohibiting redistribution")
            || lower.contains("proprietary")
        {
            return Some("All Rights Reserved");
        }
        if lower.contains("mit license")
            || lower.contains("permission is hereby granted, free of charge")
            || lower.contains("mit")
        {
            return Some("MIT License");
        }
        return Some("MIT License");
    }

    if let Some(m_lic) = manifest_license_str {
        let m_lower = m_lic.to_lowercase();
        if m_lower.contains("mit") {
            return Some("MIT License");
        }
        if m_lower.contains("apache") {
            return Some("Apache 2.0");
        }
        if m_lower.contains("agpl") {
            return Some("AGPL v3");
        }
        if m_lower.contains("lgpl") {
            return Some("LGPL v3");
        }
        if m_lower.contains("gpl") {
            return Some("GPL v3");
        }
        if m_lower.contains("mozilla") || m_lower.contains("mpl") {
            return Some("Mozilla Public License 2.0");
        }
        if m_lower.contains("unlicense") {
            return Some("The Unlicense");
        }
        if m_lower.contains("bsd 3") {
            return Some("BSD 3-Clause");
        }
        if m_lower.contains("bsd 2") {
            return Some("BSD 2-Clause");
        }
        if m_lower.contains("all rights reserved") || m_lower.contains("proprietary") {
            return Some("All Rights Reserved");
        }
    }

    None
}

impl Workspace {
    pub fn detect_installed(&mut self, target_folder: &str) {
        self.target_folder = target_folder.to_string();
        let target = std::path::PathBuf::from(target_folder);
        if !target.exists() || !target.is_dir() {
            return;
        }

        // 1. Reset all detection flags
        for item in &mut self.items {
            item.exists_in_target = false;
            item.target_version = None;
        }

        let manifest_path = target.join("manifest.json");
        let mut manifest_contributing_content: Option<String> = None;
        let mut manifest_persona_content: Option<String> = None;
        let mut manifest_license_str: Option<String> = None;

        // 2. Parse manifest.json if present
        if let Ok(content) = std::fs::read_to_string(&manifest_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(artifacts_arr) = json.get("artifacts").and_then(|v| v.as_array()) {
                    for art in artifacts_arr {
                        let id = art.get("id").and_then(|v| v.as_str()).unwrap_or("");
                        let label = art.get("label").and_then(|v| v.as_str()).unwrap_or("");
                        let method = art.get("method").and_then(|v| v.as_str()).unwrap_or("");
                        let art_target = art.get("target").and_then(|v| v.as_str()).unwrap_or("");
                        let art_content = art.get("content").and_then(|v| v.as_str());

                        if id == "agent_personas"
                            || method == "inject_persona"
                            || label.eq_ignore_ascii_case("Agent Personas")
                        {
                            if let Some(c) = art_content {
                                manifest_persona_content = Some(c.to_string());
                            }
                        }

                        if id == "contributing"
                            || label.eq_ignore_ascii_case("CONTRIBUTING.md")
                            || art_target.to_lowercase().ends_with("contributing.md")
                        {
                            if let Some(c) = art_content {
                                manifest_contributing_content = Some(c.to_string());
                            } else if id == "strict-ownership"
                                || label.eq_ignore_ascii_case("strict-ownership")
                            {
                                manifest_contributing_content =
                                    Some("strict-ownership".to_string());
                            } else if id == "open-source"
                                || label.eq_ignore_ascii_case("open-source")
                            {
                                manifest_contributing_content = Some("open-source".to_string());
                            }
                        }

                        if id == "license"
                            || label.to_lowercase().contains("license")
                            || art_target.to_lowercase().ends_with("license.md")
                        {
                            manifest_license_str = Some(label.to_string());
                        }

                        for item in self
                            .items
                            .iter_mut()
                            .filter(|i| i.category == Category::Artifacts)
                        {
                            let matches_label = item.label.eq_ignore_ascii_case(label);
                            let matches_id = item.label.eq_ignore_ascii_case(id);
                            let matches_target_filename = std::path::Path::new(art_target)
                                .file_name()
                                .and_then(|f| f.to_str())
                                .map(|f| f.eq_ignore_ascii_case(&item.label))
                                .unwrap_or(false);
                            let matches_special = (item.label.eq_ignore_ascii_case("agent.md")
                                && (id == "agent"
                                    || id == "agent_personas"
                                    || label.eq_ignore_ascii_case("AGENT.md")
                                    || label.eq_ignore_ascii_case("Agent Personas")))
                                || (item.label.eq_ignore_ascii_case("readme.md")
                                    && (id == "readme" || label.eq_ignore_ascii_case("README.md")))
                                || (item.label.eq_ignore_ascii_case("env.example")
                                    && (id == "env"
                                        || label.eq_ignore_ascii_case(".env.example")
                                        || label.eq_ignore_ascii_case("env.example")))
                                || (item.label.eq_ignore_ascii_case("contributing.md")
                                    && (id == "contributing"
                                        || label.eq_ignore_ascii_case("CONTRIBUTING.md")));

                            if matches_label
                                || matches_id
                                || matches_target_filename
                                || matches_special
                            {
                                item.exists_in_target = true;
                            }
                        }
                    }
                }

                if let Some(skills_arr) = json.get("skills").and_then(|v| v.as_array()) {
                    for skill in skills_arr {
                        let id = skill.get("id").and_then(|v| v.as_str()).unwrap_or("");
                        let label = skill.get("label").and_then(|v| v.as_str()).unwrap_or("");
                        for item in self
                            .items
                            .iter_mut()
                            .filter(|i| i.category == Category::AgentSkills)
                        {
                            if item.label.eq_ignore_ascii_case(id)
                                || item.label.eq_ignore_ascii_case(label)
                            {
                                item.exists_in_target = true;
                            }
                        }
                    }
                }
            }
        }

        // 3. Filesystem Artifact Detection
        for item in self
            .items
            .iter_mut()
            .filter(|i| i.category == Category::Artifacts)
        {
            if check_artifact_exists_on_disk(&target, &item.label) {
                item.exists_in_target = true;
            }
        }

        // 4. Contributing Template Detection
        if let Some(chosen_contributing) =
            detect_contributing_template(&target, manifest_contributing_content.as_deref())
        {
            if let Some(art) = self.items.iter_mut().find(|i| {
                i.category == Category::Artifacts && i.label.eq_ignore_ascii_case("contributing.md")
            }) {
                art.exists_in_target = true;
            }
            for item in self
                .items
                .iter_mut()
                .filter(|i| i.category == Category::ContributingTemplate)
            {
                item.exists_in_target = item.label.eq_ignore_ascii_case(chosen_contributing);
            }
        }

        // 5. Agent Personas Detection
        let detected_personas = detect_personas(&target, manifest_persona_content.as_deref());
        if !detected_personas.is_empty() {
            if let Some(art) = self.items.iter_mut().find(|i| {
                i.category == Category::Artifacts && i.label.eq_ignore_ascii_case("agent.md")
            }) {
                art.exists_in_target = true;
            }
            for item in self
                .items
                .iter_mut()
                .filter(|i| i.category == Category::AgentPersona)
            {
                item.exists_in_target = detected_personas
                    .iter()
                    .any(|dp| dp.eq_ignore_ascii_case(&item.label));
            }
        }

        // 6. License Detection
        if let Some(chosen_license) = detect_license(&target, manifest_license_str.as_deref()) {
            for item in self
                .items
                .iter_mut()
                .filter(|i| i.category == Category::License)
            {
                item.exists_in_target = item.label.eq_ignore_ascii_case(chosen_license);
            }
        }

        // 7. Skills Detection & Version Inspection
        let skills_dir = target.join(".skills");
        let lockfile = crate::skills_cli::lockfile::LockfileManager::new(&target).read();

        for item in self
            .items
            .iter_mut()
            .filter(|i| i.category == Category::AgentSkills)
        {
            let skill_folder = skills_dir.join(&item.label);
            let skill_meta = skill_folder.join("meta.json");
            let skill_manifest = skill_folder.join("skill-manifest.json");

            let exists = skill_meta.exists()
                || skill_manifest.exists()
                || skill_folder.is_dir()
                || item.exists_in_target;

            if exists {
                item.exists_in_target = true;

                if let Ok(meta_content) = std::fs::read_to_string(&skill_meta) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&meta_content) {
                        item.target_version = extract_json_version(&json);
                    }
                }
                if item.target_version.is_none() {
                    if let Ok(manifest_content) = std::fs::read_to_string(&skill_manifest) {
                        if let Ok(json) =
                            serde_json::from_str::<serde_json::Value>(&manifest_content)
                        {
                            item.target_version = extract_json_version(&json);
                        }
                    }
                }
                if item.target_version.is_none() {
                    if let Some(lock_entry) = lockfile
                        .skills
                        .iter()
                        .find(|s| s.slug.eq_ignore_ascii_case(&item.label))
                    {
                        item.target_version = Some(lock_entry.version.clone());
                    }
                }
            }
        }

        // 8. Reconcile Selection States
        let is_existing_codebase = self.items.iter().any(|i| i.exists_in_target);
        if is_existing_codebase {
            for item in &mut self.items {
                item.selected = item.exists_in_target;
            }
        } else {
            for item in &mut self.items {
                item.selected = item.category == Category::Artifacts
                    && (item.label.eq_ignore_ascii_case("readme.md")
                        || item.label.eq_ignore_ascii_case("agent.md"));
            }
        }
    }

    pub fn draw_deployment_target(
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

        let outer = Block::default()
            .borders(Borders::ALL)
            .title(" Deployment Target ")
            .border_style(border_style)
            .style(Style::default().bg(theme.bg));

        let inner = outer.inner(area);
        f.render_widget(outer, area);

        if inner.height < 4 || inner.width < 10 {
            return Ok(());
        }

        let clean_path = self.target_folder.replace("\\\\?\\", "");
        let display_path = if clean_path.is_empty() {
            "."
        } else {
            &clean_path
        };

        let has_room_for_header = inner.height >= 10;
        let chunks = if has_room_for_header {
            Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(5),
                    Constraint::Length(1),
                    Constraint::Min(4),
                ])
                .split(inner)
        } else {
            Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Length(2), Constraint::Min(3)])
                .split(inner)
        };

        if has_room_for_header {
            let is_cwd = std::env::current_dir()
                .map(|d| d.to_string_lossy().to_string() == clean_path)
                .unwrap_or(false);
            let is_git = std::path::Path::new(&self.target_folder)
                .join(".git")
                .exists();
            let has_scaffold = std::path::Path::new(&self.target_folder)
                .join("manifest.json")
                .exists();

            let cwd_badge = if is_cwd {
                Span::styled(
                    " [Active CWD] ",
                    Style::default()
                        .fg(theme.primary)
                        .add_modifier(Modifier::BOLD),
                )
            } else {
                Span::styled(" [Custom Target] ", Style::default().fg(theme.secondary))
            };

            let git_badge = if is_git {
                Span::styled(" [Git Repo] ", Style::default().fg(theme.accent))
            } else {
                Span::styled(" [Non-Git] ", Style::default().fg(theme.secondary))
            };

            let scaffold_badge = if has_scaffold {
                Span::styled(" [Scaffold Found] ", Style::default().fg(theme.primary))
            } else {
                Span::styled(" [Clean Workspace] ", Style::default().fg(theme.text))
            };

            let path_lines = vec![
                Line::from(Span::styled(
                    " Target Directory:",
                    Style::default()
                        .fg(theme.secondary)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(Span::styled(
                    format!(" {}", display_path),
                    Style::default()
                        .fg(theme.accent)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(vec![cwd_badge, git_badge, scaffold_badge]),
            ];

            let path_paragraph = Paragraph::new(path_lines).style(Style::default().bg(theme.bg));
            f.render_widget(path_paragraph, chunks[0]);

            let divider = Paragraph::new(Line::from(Span::styled(
                "─".repeat(inner.width as usize),
                Style::default().fg(theme.secondary),
            )))
            .style(Style::default().bg(theme.bg));
            f.render_widget(divider, chunks[1]);
        }

        let list_area = if has_room_for_header {
            chunks[2]
        } else {
            chunks[1]
        };

        let key_style = Style::default()
            .fg(theme.primary)
            .add_modifier(Modifier::BOLD);
        let text_style = Style::default().fg(theme.text).bg(theme.bg);
        let confirm_lines = vec![
            Line::from(Span::styled(" Ready when you are.", text_style)),
            Line::from(vec![
                Span::styled("  [Enter] Continue  ", key_style),
                Span::styled("[F] Browse folders  ", text_style),
                Span::styled("[R] Reset  ", text_style),
                Span::styled("[W] Welcome", text_style),
            ]),
        ];

        let confirm = Paragraph::new(confirm_lines).style(Style::default().bg(theme.bg));
        f.render_widget(confirm, list_area);
        Ok(())
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
                    if label == "Mobile (iOS/And)" && new_state {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "xcross" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "mobile-pwa" && i.category == Category::AgentSkills
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
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "tasty" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "open-design" && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "skeleton" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                    if (label == "Security Analyst" || label == "Security") && new_state {
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            i.label == "cybersecurity-toolkit"
                                && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            (i.label == "ghostimprint"
                                || i.label == "ghostprint"
                                || i.label == "ghost-print")
                                && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self.items.iter_mut().find(|i| {
                            (i.label == "sentinel-strike" || i.label == "sentinel")
                                && i.category == Category::AgentSkills
                        }) {
                            companion.selected = true;
                        }
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "mxc" && i.category == Category::AgentSkills)
                        {
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
                    if label == "Academic / Research" && new_state {
                        for companion_name in &["quarto", "marp", "mermaid"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                    if label == "AEC / BIM & Parametric" && new_state {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "cad-tools" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                    if label == "CAD & Mech Engineering" && new_state {
                        for companion_name in &["cad-tools", "mechanica"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                    if label == "Computational Science" && new_state {
                        for companion_name in &["quarto", "manim"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                    if label == "EDA & Hardware (HDL)" && new_state {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "mechanica" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                    if label == "GIS & Spatial Systems" && new_state {
                        if let Some(companion) = self
                            .items
                            .iter_mut()
                            .find(|i| i.label == "tldraw" && i.category == Category::AgentSkills)
                        {
                            companion.selected = true;
                        }
                    }
                    if label == "Quant & Econometrics" && new_state {
                        for companion_name in &["trackio", "quarto"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                    if label == "Robotics & Controls" && new_state {
                        for companion_name in &["cad-tools", "mechanica"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                    if label == "Simulation (FEA/CFD)" && new_state {
                        for companion_name in &["cad-tools", "manim"] {
                            if let Some(companion) = self.items.iter_mut().find(|i| {
                                i.label == *companion_name && i.category == Category::AgentSkills
                            }) {
                                companion.selected = true;
                            }
                        }
                    }
                }

                // Platform skills (github, firebase, vercel) carry their own
                // configuration inside the skill payload and seed .env
                // defaults at deploy time, so they no longer toggle
                // companion artifact selections.
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
        if self.current_category == Category::DeploymentTarget {
            return self.draw_deployment_target(f, area, active, theme);
        }

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
            let is_row_highlighted = active && i == self.selected_idx;

            let exists_suffix = if item.exists_in_target {
                if let (Some(tv), Some(v)) = (&item.target_version, &item.version) {
                    if tv != v {
                        Some(format!(" [upgrade to v{}]", v))
                    } else {
                        Some(" [Current version installed]".to_string())
                    }
                } else {
                    Some(" [Exists]".to_string())
                }
            } else {
                None
            };

            let line = if is_row_highlighted {
                let rec_str = if item.is_recommended() {
                    " ★ Rec"
                } else {
                    ""
                };
                let suffix_str = exists_suffix.unwrap_or_default();
                Line::from(vec![Span::raw(format!(
                    "{} {}{}{}",
                    checkbox, item.label, rec_str, suffix_str
                ))])
            } else {
                let mut spans = vec![Span::styled(
                    format!("{} {}", checkbox, item.label),
                    Style::default().fg(theme.text).bg(theme.bg),
                )];
                if item.is_recommended() {
                    spans.push(Span::styled(
                        " ★ Rec",
                        Style::default()
                            .fg(theme.accent)
                            .bg(theme.bg)
                            .add_modifier(Modifier::BOLD),
                    ));
                }
                if let Some(suffix) = exists_suffix {
                    spans.push(Span::styled(
                        suffix,
                        Style::default().fg(theme.secondary).bg(theme.bg),
                    ));
                }
                Line::from(spans)
            };

            list_items.push(ListItem::new(line));
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn create_test_dir(prefix: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "scaffold_test_{}_{}_{}",
            prefix,
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_detect_installed_clean_directory() {
        let target_dir = create_test_dir("clean");
        let payload_dir = PathBuf::from("/nonexistent/dummy/path");
        let mut workspace = Workspace::new(payload_dir);

        workspace.detect_installed(target_dir.to_str().unwrap());

        // For clean directory, none exist in target
        assert!(workspace.items.iter().all(|i| !i.exists_in_target));

        // Default scaffold selections apply
        let selected_labels: Vec<_> = workspace
            .items
            .iter()
            .filter(|i| i.selected)
            .map(|i| i.label.as_str())
            .collect();

        // Either default artifacts or empty if dummy payload loaded no templates
        for label in &selected_labels {
            assert!(
                label.eq_ignore_ascii_case("readme.md")
                    || label.eq_ignore_ascii_case("agent.md")
                    || label.eq_ignore_ascii_case(".gitignore")
            );
        }

        let _ = fs::remove_dir_all(&target_dir);
    }

    #[test]
    fn test_workspace_item_is_recommended() {
        let rec_artifact = WorkspaceItem {
            label: ".gitignore".into(),
            selected: true,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        };
        assert!(rec_artifact.is_recommended());

        let non_rec_artifact = WorkspaceItem {
            label: "todo.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        };
        assert!(!non_rec_artifact.is_recommended());

        let rec_skill = WorkspaceItem {
            label: "github".into(),
            selected: false,
            category: Category::AgentSkills,
            description: None,
            version: Some("8".into()),
            exists_in_target: false,
            target_version: None,
            logo: None,
        };
        assert!(rec_skill.is_recommended());

        let non_rec_skill = WorkspaceItem {
            label: "docker".into(),
            selected: false,
            category: Category::AgentSkills,
            description: None,
            version: Some("3".into()),
            exists_in_target: false,
            target_version: None,
            logo: None,
        };
        assert!(!non_rec_skill.is_recommended());
    }

    #[test]
    fn test_detect_installed_filesystem_artifacts_and_contributing_and_personas() {
        let target_dir = create_test_dir("existing_fs");

        // 1. Create root artifacts
        fs::write(target_dir.join("README.md"), "# Test Project").unwrap();
        fs::write(target_dir.join(".gitignore"), "target/\nnode_modules/").unwrap();
        fs::write(target_dir.join(".env.example"), "PORT=3000").unwrap();

        // 2. Create CONTRIBUTING.md with strict-ownership text
        fs::write(
            target_dir.join("CONTRIBUTING.md"),
            "# Contributing\n\nTo preserve architectural vision, we do not accept or merge external pull requests. Soft-closed PRs only.",
        )
        .unwrap();

        // 3. Create .agents/AGENTS.md with Web Dev and Security Analyst personas
        let agents_dir = target_dir.join(".agents");
        fs::create_dir_all(&agents_dir).unwrap();
        fs::write(
            agents_dir.join("AGENTS.md"),
            "# Custom Agent Rules\n\n## Roles\n* **Web Dev**: Specialized in modern full-stack web technologies.\n* **Security Analyst**: An auditor-style agent focused on network security.\n\n## Protocols",
        )
        .unwrap();

        // 4. Create LICENSE.md with MIT license
        fs::write(
            target_dir.join("LICENSE.md"),
            "MIT License\n\nPermission is hereby granted, free of charge, to any person...",
        )
        .unwrap();

        // 5. Create project_details/TODO.md and PLAN.md
        let details_dir = target_dir.join("project_details");
        fs::create_dir_all(&details_dir).unwrap();
        fs::write(details_dir.join("TODO.md"), "* [ ] Item 1").unwrap();
        fs::write(details_dir.join("PLAN.md"), "# Project Plan").unwrap();

        // 6. Create .skills/docker
        let docker_skill_dir = target_dir.join(".skills").join("docker");
        fs::create_dir_all(&docker_skill_dir).unwrap();
        fs::write(
            docker_skill_dir.join("meta.json"),
            r#"{"label": "Docker Containerization", "version": "3", "description": "Docker containerization"}"#,
        )
        .unwrap();

        let payload_dir = PathBuf::from("/nonexistent/dummy/path");
        let mut workspace = Workspace::new(payload_dir);

        // Manually seed template items that would come from .templates
        workspace.items.push(WorkspaceItem {
            label: "readme.md".into(),
            selected: true,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: ".gitignore".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "env.example".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "contributing.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "agent.md".into(),
            selected: true,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "todo.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "plan.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "brand.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "docker".into(),
            selected: false,
            category: Category::AgentSkills,
            description: None,
            version: Some("3".into()),
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "ansible".into(),
            selected: false,
            category: Category::AgentSkills,
            description: None,
            version: Some("1".into()),
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "MIT License".into(),
            selected: false,
            category: Category::License,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "Apache 2.0".into(),
            selected: false,
            category: Category::License,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });

        // Run detection
        workspace.detect_installed(target_dir.to_str().unwrap());

        // Verify Artifacts
        let readme = workspace
            .items
            .iter()
            .find(|i| i.label == "readme.md")
            .unwrap();
        assert!(readme.exists_in_target, "README.md must be detected");
        assert!(readme.selected, "README.md must be selected");

        let gitignore = workspace
            .items
            .iter()
            .find(|i| i.label == ".gitignore")
            .unwrap();
        assert!(gitignore.exists_in_target, ".gitignore must be detected");
        assert!(gitignore.selected, ".gitignore must be selected");

        let env = workspace
            .items
            .iter()
            .find(|i| i.label == "env.example")
            .unwrap();
        assert!(env.exists_in_target, "env.example must be detected");
        assert!(env.selected, "env.example must be selected");

        let contributing = workspace
            .items
            .iter()
            .find(|i| i.label == "contributing.md")
            .unwrap();
        assert!(
            contributing.exists_in_target,
            "contributing.md must be detected"
        );
        assert!(contributing.selected, "contributing.md must be selected");

        let agent = workspace
            .items
            .iter()
            .find(|i| i.label == "agent.md")
            .unwrap();
        assert!(agent.exists_in_target, "agent.md must be detected");
        assert!(agent.selected, "agent.md must be selected");

        let todo = workspace
            .items
            .iter()
            .find(|i| i.label == "todo.md")
            .unwrap();
        assert!(todo.exists_in_target, "todo.md must be detected");
        assert!(todo.selected, "todo.md must be selected");

        let plan = workspace
            .items
            .iter()
            .find(|i| i.label == "plan.md")
            .unwrap();
        assert!(plan.exists_in_target, "plan.md must be detected");
        assert!(plan.selected, "plan.md must be selected");

        let brand = workspace
            .items
            .iter()
            .find(|i| i.label == "brand.md")
            .unwrap();
        assert!(!brand.exists_in_target, "brand.md must NOT be detected");
        assert!(!brand.selected, "brand.md must NOT be selected");

        // Verify ContributingTemplate
        let strict = workspace
            .items
            .iter()
            .find(|i| i.label == "strict-ownership" && i.category == Category::ContributingTemplate)
            .unwrap();
        assert!(
            strict.exists_in_target,
            "strict-ownership template must be detected"
        );
        assert!(
            strict.selected,
            "strict-ownership template must be selected"
        );

        let open_src = workspace
            .items
            .iter()
            .find(|i| i.label == "open-source" && i.category == Category::ContributingTemplate)
            .unwrap();
        assert!(
            !open_src.exists_in_target,
            "open-source template must NOT be detected"
        );
        assert!(
            !open_src.selected,
            "open-source template must NOT be selected"
        );

        // Verify AgentPersona
        let web_dev = workspace
            .items
            .iter()
            .find(|i| i.label == "Web Dev" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(web_dev.exists_in_target, "Web Dev persona must be detected");
        assert!(web_dev.selected, "Web Dev persona must be selected");

        let sec_analyst = workspace
            .items
            .iter()
            .find(|i| i.label == "Security Analyst" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(
            sec_analyst.exists_in_target,
            "Security Analyst persona must be detected"
        );
        assert!(
            sec_analyst.selected,
            "Security Analyst persona must be selected"
        );

        let dba = workspace
            .items
            .iter()
            .find(|i| i.label == "DBA" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(!dba.exists_in_target, "DBA persona must NOT be detected");
        assert!(!dba.selected, "DBA persona must NOT be selected");

        // Verify License
        let mit = workspace
            .items
            .iter()
            .find(|i| i.label == "MIT License" && i.category == Category::License)
            .unwrap();
        assert!(mit.exists_in_target, "MIT License must be detected");
        assert!(mit.selected, "MIT License must be selected");

        // Verify Skills
        let docker = workspace
            .items
            .iter()
            .find(|i| i.label == "docker")
            .unwrap();
        assert!(docker.exists_in_target, "docker skill must be detected");
        assert!(docker.selected, "docker skill must be selected");
        assert_eq!(docker.target_version.as_deref(), Some("3"));

        let ansible = workspace
            .items
            .iter()
            .find(|i| i.label == "ansible")
            .unwrap();
        assert!(
            !ansible.exists_in_target,
            "ansible skill must NOT be detected"
        );
        assert!(!ansible.selected, "ansible skill must NOT be selected");

        let _ = fs::remove_dir_all(&target_dir);
    }

    #[test]
    fn test_detect_installed_manifest_matching() {
        let target_dir = create_test_dir("manifest_test");

        let manifest_json = r#"{
            "metadata": {
                "version": "7.34.0",
                "lastUpdated": "2026-10-10T12:00:00Z"
            },
            "env": {},
            "apps": [],
            "artifacts": [
                {
                    "id": "readme",
                    "label": "README.md",
                    "target": "README.md",
                    "method": "copy"
                },
                {
                    "id": "agent_personas",
                    "label": "Agent Personas",
                    "target": ".agents/AGENTS.md",
                    "method": "inject_persona",
                    "content": "* **AI Systems Engineer**: Specialized in LLMs and ComfyUI.\n* **Cloud & DevOps Architect**: Infrastructure as code."
                },
                {
                    "id": "contributing",
                    "label": "CONTRIBUTING.md",
                    "target": "CONTRIBUTING.md",
                    "method": "copy",
                    "content": "open-source"
                },
                {
                    "id": "license",
                    "label": "Apache 2.0",
                    "target": "LICENSE.md",
                    "method": "copy"
                },
                {
                    "id": "todo",
                    "label": "TODO.md",
                    "target": "project_details/TODO.md",
                    "method": "copy"
                }
            ],
            "skills": [
                {
                    "id": "github",
                    "label": "GitHub Automation",
                    "target": ".skills/github",
                    "method": "copy"
                }
            ]
        }"#;

        fs::write(target_dir.join("manifest.json"), manifest_json).unwrap();

        let payload_dir = PathBuf::from("/nonexistent/dummy/path");
        let mut workspace = Workspace::new(payload_dir);

        // Seed items
        workspace.items.push(WorkspaceItem {
            label: "readme.md".into(),
            selected: true,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "agent.md".into(),
            selected: true,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "todo.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "contributing.md".into(),
            selected: false,
            category: Category::Artifacts,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "github".into(),
            selected: false,
            category: Category::AgentSkills,
            description: None,
            version: Some("5".into()),
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "Apache 2.0".into(),
            selected: false,
            category: Category::License,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });
        workspace.items.push(WorkspaceItem {
            label: "MIT License".into(),
            selected: false,
            category: Category::License,
            description: None,
            version: None,
            exists_in_target: false,
            target_version: None,
            logo: None,
        });

        // Run detection
        workspace.detect_installed(target_dir.to_str().unwrap());

        // Verify Artifacts
        let readme = workspace
            .items
            .iter()
            .find(|i| i.label == "readme.md")
            .unwrap();
        assert!(readme.exists_in_target);
        assert!(readme.selected);

        let agent = workspace
            .items
            .iter()
            .find(|i| i.label == "agent.md")
            .unwrap();
        assert!(agent.exists_in_target);
        assert!(agent.selected);

        let todo = workspace
            .items
            .iter()
            .find(|i| i.label == "todo.md")
            .unwrap();
        assert!(todo.exists_in_target);
        assert!(todo.selected);

        let contributing = workspace
            .items
            .iter()
            .find(|i| i.label == "contributing.md")
            .unwrap();
        assert!(contributing.exists_in_target);
        assert!(contributing.selected);

        // Verify ContributingTemplate
        let open_src = workspace
            .items
            .iter()
            .find(|i| i.label == "open-source" && i.category == Category::ContributingTemplate)
            .unwrap();
        assert!(open_src.exists_in_target);
        assert!(open_src.selected);

        let strict = workspace
            .items
            .iter()
            .find(|i| i.label == "strict-ownership" && i.category == Category::ContributingTemplate)
            .unwrap();
        assert!(!strict.exists_in_target);
        assert!(!strict.selected);

        // Verify Personas
        let ai = workspace
            .items
            .iter()
            .find(|i| i.label == "AI Systems Engineer" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(ai.exists_in_target);
        assert!(ai.selected);

        let devops = workspace
            .items
            .iter()
            .find(|i| i.label == "Cloud & DevOps Architect" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(devops.exists_in_target);
        assert!(devops.selected);

        let web = workspace
            .items
            .iter()
            .find(|i| i.label == "Web Dev" && i.category == Category::AgentPersona)
            .unwrap();
        assert!(!web.exists_in_target);
        assert!(!web.selected);

        // Verify License
        let apache = workspace
            .items
            .iter()
            .find(|i| i.label == "Apache 2.0" && i.category == Category::License)
            .unwrap();
        assert!(apache.exists_in_target);
        assert!(apache.selected);

        // Verify Skill
        let gh = workspace
            .items
            .iter()
            .find(|i| i.label == "github")
            .unwrap();
        assert!(gh.exists_in_target);
        assert!(gh.selected);

        let _ = fs::remove_dir_all(&target_dir);
    }

    #[test]
    fn test_detect_personas_multi_selection_and_legacy_paths() {
        let target_dir = create_test_dir("multi_persona_test");

        // 1. When project has .agents/AGENTS.md with Mobile, Web Dev, and Containerization
        let agents_dir = target_dir.join(".agents");
        fs::create_dir_all(&agents_dir).unwrap();
        fs::write(
            agents_dir.join("AGENTS.md"),
            "# Custom Agent Rules\n\n## Roles\n* **Mobile (iOS/And)**: Expert in mobile app development, including iOS (Swift) and Android (Kotlin).\n* **Containerization (Docker/K8s)**: Focused strictly on container ecosystems. Excels at writing Dockerfiles.\n* **Web Dev**: Specialized in modern full-stack web technologies.\n\n## Protocols",
        )
        .unwrap();

        let detected = detect_personas(&target_dir, None);
        assert_eq!(detected.len(), 3);
        assert!(detected.contains(&"Mobile (iOS/And)".to_string()));
        assert!(detected.contains(&"Containerization (Docker/K8s)".to_string()));
        assert!(detected.contains(&"Web Dev".to_string()));

        let _ = fs::remove_dir_all(&target_dir);

        // 2. When project only has legacy project_details/agent.md with raw placeholder
        let target_legacy = create_test_dir("legacy_placeholder_test");
        let details_dir = target_legacy.join("project_details");
        fs::create_dir_all(&details_dir).unwrap();
        fs::write(
            details_dir.join("agent.md"),
            "# Custom Agent Rules\n\n## Role\n[Define the agent's primary role and responsibilities here]\n\n## Protocols\n* **Mandatory Mobile-First Responsive Design Protocol:**\n",
        )
        .unwrap();

        let detected_legacy = detect_personas(&target_legacy, None);
        assert!(
            detected_legacy.is_empty(),
            "Raw placeholder must NOT detect any personas"
        );

        // 3. When legacy project_details/agent.md has actual persona text
        fs::write(
            details_dir.join("agent.md"),
            "# Custom Agent Rules\n\n## Role\n* **Mobile (iOS/And)**: Expert in iOS and Android.\n* **Web Dev**: Full stack web technologies.\n",
        )
        .unwrap();

        let detected_with_personas = detect_personas(&target_legacy, None);
        assert_eq!(detected_with_personas.len(), 2);
        assert!(detected_with_personas.contains(&"Mobile (iOS/And)".to_string()));
        assert!(detected_with_personas.contains(&"Web Dev".to_string()));

        let _ = fs::remove_dir_all(&target_legacy);
    }

    #[test]
    fn test_detect_engineering_and_science_personas() {
        let target_dir = create_test_dir("eng_sci_personas_test");
        let agents_dir = target_dir.join(".agents");
        fs::create_dir_all(&agents_dir).unwrap();
        fs::write(
            agents_dir.join("AGENTS.md"),
            "# Custom Agent Rules\n\n## Roles\n* **Academic / Research**: Enforce strict citation integrity (BibTeX/LaTeX) and reproducible methodology.\n* **CAD & Mech Engineering**: Emphasize parametric 3D CAD modeling (OpenSCAD, CadQuery).\n* **Simulation (FEA/CFD)**: Manage finite element analysis and CFD workflows.\n* **Robotics & Controls**: Enforce real-time loop constraints and ROS2 kinematics.\n* **EDA & Hardware (HDL)**: Focus on digital/analog circuit design and Verilog synthesis.\n* **Quant & Econometrics**: Financial risk modeling and algorithmic backtesting.\n* **AEC / BIM & Parametric**: Building information modeling and IfcOpenShell.\n* **Computational Science**: Numerical stability and floating-point precision with SciPy.\n* **GIS & Spatial Systems**: Coordinate reference systems and PostGIS spatial indexing.\n",
        )
        .unwrap();

        let detected = detect_personas(&target_dir, None);
        assert_eq!(detected.len(), 9);
        assert!(detected.contains(&"Academic / Research".to_string()));
        assert!(detected.contains(&"CAD & Mech Engineering".to_string()));
        assert!(detected.contains(&"Simulation (FEA/CFD)".to_string()));
        assert!(detected.contains(&"Robotics & Controls".to_string()));
        assert!(detected.contains(&"EDA & Hardware (HDL)".to_string()));
        assert!(detected.contains(&"Quant & Econometrics".to_string()));
        assert!(detected.contains(&"AEC / BIM & Parametric".to_string()));
        assert!(detected.contains(&"Computational Science".to_string()));
        assert!(detected.contains(&"GIS & Spatial Systems".to_string()));

        let _ = fs::remove_dir_all(&target_dir);
    }

    #[test]
    fn test_detect_contributing_empty_or_placeholder_ignored() {
        let target_dir = create_test_dir("contributing_empty_test");

        // 1. Empty CONTRIBUTING.md
        fs::write(target_dir.join("CONTRIBUTING.md"), "").unwrap();
        assert_eq!(detect_contributing_template(&target_dir, None), None);
        assert!(!check_artifact_exists_on_disk(
            &target_dir,
            "contributing.md"
        ));

        // 2. Placeholder comment CONTRIBUTING.md
        fs::write(
            target_dir.join("CONTRIBUTING.md"),
            "<!-- Placeholder for contributing.md template injected by wizard -->\n",
        )
        .unwrap();
        assert_eq!(detect_contributing_template(&target_dir, None), None);
        assert!(!check_artifact_exists_on_disk(
            &target_dir,
            "contributing.md"
        ));

        // 3. Valid strict-ownership CONTRIBUTING.md
        fs::write(
            target_dir.join("CONTRIBUTING.md"),
            "# Contributing\n\nTo preserve architectural vision, we do not accept or merge external pull requests. Soft-closed PRs only.",
        )
        .unwrap();
        assert_eq!(
            detect_contributing_template(&target_dir, None),
            Some("strict-ownership")
        );
        assert!(check_artifact_exists_on_disk(
            &target_dir,
            "contributing.md"
        ));

        let _ = fs::remove_dir_all(&target_dir);
    }
}
