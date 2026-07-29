# DESIGN.md: Stateless Scaffolding TUI and Manifest Distribution Blueprint

## 1. Architectural Scope and Framework Design
The project infrastructure splits into two distinct, decoupled boundaries:
1. The Core Stateless TUI Engine (Rust/Ratatui): A native cross platform client application that handles terminal presentation logic, local keyboard event cycles, and file system write operations. It contains zero hardcoded project definitions or scaffolding layout logic.
2. The Dynamic Resource Manifest Infrastructure: Remote tracking JSON maps containing metadata definitions for project blueprints, schema inputs, and task execution rules. The engine resolves and caches these descriptors dynamically at runtime.

### Data Distribution Flow Architecture

+-------------------------------------------------------------------------+
|                         GitHub Action Pipeline                          |
|  Matrix Builds Core Executables & Pushes Production Manifest Metadata    |
+-------------------------------------------------------------------------+
             |                                             |
             v                                             v
+------------------------+                    +---------------------------+
|  GitHub Release Assets |                    | Remote Storage Endpoint   |
|  (Target Binary Pool)  |                    | (manifest.json & Schema)  |
+------------------------+                    +---------------------------+
             |                                             |
     One Time Download                             Runtime Data Pull
             v                                             v
+-------------------------------------------------------------------------+
|                       End User Native Machine Run                       |
|                                                                         |
|   1. Execution Initialization                                           |
|   2. Engine parses local storage config path (~/.config/scaffold/)       |
|   3. Local Cache validated against Remote Manifest                      |
|   4. Dynamic layout definitions parsed to construct UI fields           |
|   5. Native file system mutations executed inside local target workspace|
+-------------------------------------------------------------------------+

### Technical Constraints
* File Verification: The core engine must deliver full standalone source file outputs. Truncated templates, code block snippets, or helper omissions are strictly disallowed.
* Typography Regulations: Emojis, em dashes, structural placeholder hyphens, and decorative semicolons are completely barred from user documentation files and application generation logs.
* Target Matrix Platforms: x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu, aarch64-pc-windows-msvc, aarch64-apple-darwin, and x86_64-pc-windows-msvc.

---

## 2. Dynamic Resource Manifest Schema (manifest.json)
The application dynamically builds input views and scaffolding trees by reading an external manifest structure. The blueprint schema specification follows this model format:

{
  "$schema": "https://raw.githubusercontent.com/owner/repo/main/schemas/manifest.v1.json",
  "version": "2026.06.19",
  "blueprints": [
    {
      "id": "nextjs-vercel-clerk-redis",
      "name": "Full Stack Serverless Blueprint",
      "description": "Next.js App Router containing Clerk Auth, Upstash Redis Stack, and automated Vercel deployment lanes",
      "fields": [
        {
          "key": "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
          "label": "Clerk Publishable Key",
          "type": "string",
          "required": true,
          "default": "pk_test_"
        },
        {
          "key": "UPSTASH_REDIS_REST_URL",
          "label": "Upstash Redis REST URL",
          "type": "string",
          "required": true
        }
      ],
      "artifacts": [
        {
          "target_path": "vercel.json",
          "source_url": "https://raw.githubusercontent.com/owner/repo/main/templates/vercel.json"
        },
        {
          "target_path": ".github/workflows/deploy.yml",
          "source_url": "https://raw.githubusercontent.com/owner/repo/main/templates/deploy.yml"
        }
      ]
    }
  ]
}

---

## 3. Structural Engine Layout
The internal engine components separate layout rendering from metadata resolution:

src/
├── main.rs            # Process initialization and cache directory resolution
├── tui.rs             # Cross platform raw mode console lifecycle manager
├── action.rs          # Message routing queue definitions
├── app.rs             # Central application execution loop state orchestrator
├── manifest_engine.rs # Asynchronous remote fetch, signature validation, and caching
├── components.rs      # System base component trait interface definitions
└── components/        # Isolated runtime viewport components
    ├── header.rs      # Active directory and manifest state view
    ├── nav_tree.rs    # Structural project file tree node explorer
    ├── workspace.rs   # Dynamic dynamic input field configuration manager
    ├── logger_pipe.rs # Status reports and diagnostic terminal monitor
    └── footer.rs      # Contextual interface keybindings toolbar

---

## 4. Cross Platform Terminal Input Management (src/tui.rs)
To eliminate double strike execution input behaviors native to standard Windows Console API release rings, key processing loops must implement key step filtering:

use ratatui::crossterm::event::{self, Event, KeyEventKind};

pub fn handle_terminal_events() -> anyhow::Result<Option<Action>> {
    if event::poll(std::time::Duration::from_millis(16))? {
        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                return Ok(Some(map_key_to_action(key.code)));
            }
        }
    }
    Ok(None)
}

---

## 5. Continuous Integration and Matrix Distribution Pipeline
The GitHub Actions workflow automates standard cargo unit verification alongside automated multi target binary builds when structural tracking version tags are initialized.

### Automation Protocol Workspace (.github/workflows/release.yml)
name: Continuous Integration and Matrix Distribution Pipeline

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  code_hygiene:
    name: Code Hygiene and Test Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Initialize Rust Infrastructure
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Run Code Formatting Check
        run: cargo fmt --check

      - name: Execute Compiler Static Analysis
        run: cargo clippy -- -D warnings

      - name: Run Native Architecture Tests
        run: cargo test --all-features

  matrix_release:
    name: Compilation Matrix Release Execution
    needs: code_hygiene
    if: startsWith(github.ref, 'refs/tags/v')
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact_name: scaffold-tui-linux-x64
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            artifact_name: scaffold-tui-linux-arm64
          - os: windows-latest
            target: aarch64-pc-windows-msvc
            artifact_name: scaffold-tui-windows-arm64.exe
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact_name: scaffold-tui-macos-arm64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact_name: scaffold-tui-windows-x64.exe
    runs-on: ${{ matrix.os }}
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Initialize Rust Infrastructure Toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install Linux Cross Compiler Tools
        if: matrix.target == 'aarch64-unknown-linux-gnu'
        run: |
          sudo apt-get update
          sudo apt-get install -y gcc-aarch64-linux-gnu

      - name: Compile Release Target Binary
        run: cargo build --release --target ${{ matrix.target }}

      - name: Consolidate Output Files (Unix)
        if: matrix.os != 'windows-latest'
        run: |
          cp target/${{ matrix.target }}/release/scaffold-tui ./${{ matrix.artifact_name }}

      - name: Consolidate Output Files (Windows)
        if: matrix.os == 'windows-latest'
        run: |
          copy target\${{ matrix.target }}\release\scaffold-tui.exe .\${{ matrix.artifact_name }}

      - name: Stage Workspace Production Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact_name }}
          path: ./${{ matrix.artifact_name }}

  publish_release_binaries:
    name: Publish Release Asset Pool
    needs: matrix_release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Gather Staged Construction Artifacts
        uses: actions/download-artifact@v4
        with:
          path: ./dist

      - name: Build Global Deployment Release Hub
        uses: softprops/action-gh-release@v2
        with:
          files: ./dist/**/*
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

---

## 6. Execution Roadmap for the Code Agent
1. Phase 1: Bootstrapping Cargo Targets. Establish the project structure running `cargo new project-scaffold-tui --bin` and configuring standard production parameters inside `Cargo.toml`.
2. Phase 2: Action Loop Mapping. Configure `src/action.rs` and `src/tui.rs` to secure robust cross platform input evaluation layers filtering out duplicate key signatures.
3. Phase 3: Manifest Engine Assembly. Complete `src/manifest_engine.rs` to initialize structural platform tracking directories (`~/.config/scaffold-tui/`) and manage remote networking routines to pull definitions via standard HTTP connections.
4. Phase 4: Component Workspace Building. Construct the viewport scripts inside `src/components/` ensuring individual areas execute custom coordinate splits dynamically mapped by the terminal master bounds calculations.
5. Phase 5: Workflow Integration. Inject the complete release script workflow configuration to drive error free execution gates inside the host deployment systems.