# Dynamic Skill Sandboxing Architecture

## 📖 Overview
The Code Scaffold website dynamically aggregates skills from the `upioneer/code-scaffold` GitHub repository at runtime. To maintain this decoupled architecture while supporting rich, visual skill demonstrations, we are implementing a **Dynamic Iframe Sandbox Strategy**.

Instead of introducing complex build steps or monorepo bridging, the website will embed skill sandboxes directly from the GitHub repository via a Git CDN proxy (e.g., `raw.githack.com` or `jsDelivr`).

**Your role (as the coding agent on the `code-scaffold` repository) is to adhere to the Sandbox Contract and ensure skills provide a compliant presentation layer.**

---

## 🤝 The Sandbox Contract

If a skill features visual elements that would benefit from a live demonstration (e.g., animations, UI components, interactive widgets), you must provide a sandbox environment that the website can consume.

### Structure Requirements
1. The sandbox must be located in a `sandbox/` directory within the skill's root folder:
   ```text
   .skills/
   └── <skill-name>/
       ├── meta.json
       ├── SKILL.md
       └── sandbox/          <-- MUST exist here
           └── index.html    <-- Entry point
   ```
2. The primary entry point **MUST** be named `index.html`. 

---

## ⚠️ Technical Constraints & Rules for the Sandbox

Because the sandbox will be hosted statically via a raw GitHub CDN proxy and embedded inside an `<iframe>` on the Code Scaffold website, you must adhere strictly to the following rules:

### 1. Relative Asset Paths (Critical)
The sandbox will not be hosted at the root of a domain. Therefore, absolute paths will break.
* **DO NOT USE:** `href="/style.css"` or `src="/script.js"`
* **MUST USE:** `href="./style.css"` or `src="./script.js"` (strict relative paths)

### 2. Single-File Bundles (Universal Standard)
To eliminate mime-type issues, cross-origin restrictions, and complex CDN caching layers, it is highly recommended to bundle the sandbox into a single file if you are using a framework (like React or Vue) or Vite.
* If using Vite, configure `vite-plugin-singlefile` to inline all CSS and JS directly into the `index.html`.
* If writing vanilla HTML/JS, simply keep the JS and CSS inline within the `<script>` and `<style>` tags if possible.

### 3. Responsive & Liquid Layouts
The website will render the sandbox within an `<iframe>` that may take up a modal window or a specific viewport area.
* Ensure the sandbox `<body>` uses `margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: auto;`.
* The design must be fluid and responsive to whatever dimensions the host iframe dictates.
* Do not apply fixed dimensions to the root container.

### 4. Zero Backend Dependencies
The sandbox must be a purely static frontend application. It cannot rely on API routes, server-side rendering, or dynamic server logic.

### 5. Seamless Theming & Presentation
To make the iframe feel like a native part of the website, use a dark mode color palette (Slate / Cyan) that matches the Code Scaffold aesthetic.
* Background: `#0f172a` (slate-900) or `#020617` (slate-950)
* Accents: `#22d3ee` (cyan-400)
* **Presentation Layer:** The sandbox should act as a mini landing page for the skill, providing information on what it is, how it works, and multimedia examples.

### 6. WebGL Context Management
Browsers enforce strict limits on the number of active WebGL contexts per page (often ~8-16).
* **Rule:** Sandboxes must **never** mount more than a few WebGL canvases simultaneously. 
* **Implementation:** Use carousels, tabs, or dropdown selectors that explicitly unmount (destroy) off-screen shaders/canvases before mounting new ones to preserve GPU memory and prevent browser crashes.

### 7. Heavy Asset Fallbacks & Payload Limits
Base64 encoding large assets (like `.glb` 3D models) inflates file sizes by ~33%, which can bloat the single-file `index.html` and degrade loading speeds on the CDN.
* **Rule:** Exclude heavy 3D assets from live sandboxes.
* **Implementation:** Replace interactive elements requiring massive assets with high-quality static media (e.g., animated GIFs, looping videos, or screenshots). Accompany these fallbacks with professional, encouraging copy that invites the user to run the skill locally to experience the full interactive capability (e.g., *"Download the skill locally to experience the fully interactive 3D simulation."*).

---

## ⚙️ How The Integration Works (For Context)

1. **Discovery:** When the user selects a skill on the website, the website pings the GitHub API: `GET https://api.github.com/repos/upioneer/code-scaffold/contents/.skills/<skill-name>/sandbox`
2. **Routing:** If the directory exists, the website enables a "View Live Demo" action.
3. **Rendering:** The website spawns an iframe with explicit security permissions (`sandbox="allow-same-origin allow-scripts"`) pointed at the production-grade **jsDelivr** CDN:
   `https://cdn.jsdelivr.net/gh/upioneer/code-scaffold@main/.skills/<skill-name>/sandbox/index.html`
4. **Result:** The user sees a fully functional, isolated demonstration of the skill, seamlessly embedded in the website.

---

## ✅ Your Next Task
1. Pick a visually-oriented skill (e.g., `kinetic-canvas`).
2. Create the Vite workspace in `project_details/proof/<skill-name>-sandbox`.
3. Build a stunning, self-contained HTML demonstration following the constraints above.
4. Execute `project_details/playbooks/build_sandbox.ps1 <skill-name>` to deploy the payload.
5. Push the changes to the `main` branch. 
6. (Once pushed, the website will automatically detect it and render the demo without any further configuration).
