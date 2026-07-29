---
name: TUI Tools
description: Architectural playbook and tooling (including VHS integration) for building robust, instant-on, and visually stunning modern terminal splash screens and integrations.
version: 5
---

# TUI Tools Architectural Playbook

When building modern CLI tools and Terminal User Interfaces (TUIs), the splash screen is the first interaction the user has with the application. This skill provides the architectural playbook for crafting a modern, robust, and instantaneous splash screen, as well as comprehensive tooling for documenting these TUIs via headless automation.

## 1. The "Instant First Frame" Architecture
The biggest secret to a high-quality splash screen isn't the text art: it's the timing. If your terminal stays blank for even half a second while Python or Node initializes, the tool feels sluggish.

* **Render before you load**: Print your initial banner before importing heavy libraries, initializing runtime dependencies, or making network connections.
* **The Shim Approach**: For heavy runtimes, use a lightweight compiled shim (like a tiny Go or Rust binary) or a fast shell script wrapper that instantly prints the ANSI escape sequence for the splash screen, then hands execution over to the main application.
* **Progressive Enhancement**: As seen in Hermes, paint the static layout immediately, then let the dynamic sections (tools, skills, loaded models) fill in progressively as they initialize in the background.

## 2. Crafting the Visuals
Modern TUI text art rarely uses standard keyboard characters. It uses specific Unicode blocks and True Color (24-bit) ANSI escape sequences.

* **Use Block Elements**: Instead of `/` and `\`, use Unicode half-blocks (`▀`, `▄`, `█`) to double your vertical resolution. Tools like Chafa or image-to-ANSI converters can turn standard PNG logos into high-resolution terminal blocks.
  * **Typography**: For large text, use FIGlet or TOIlet generators with modern fonts like "ANSI Shadow" or "Slant".
  * **FIGlet ANSI Shadow Character & Frame Spacing Rules**:
    * **Preserve Native Geometry (DO NOT STRIP OR SHIFT)**: The "ANSI Shadow" font uses native leading spaces to simulate 3D beveling and kerning for letters like A, C, G, O, Q, and T (e.g. ` █████╗` on Line 0 over `██╔══██╗` on Line 1). You MUST NOT strip, trim, or shift any native leading or trailing spaces from individual lines. Doing so corrupts the character's geometry and breaks letter alignment.
    * **Equal Length Normalization (`padEnd`)**: Every line in the logo array MUST be padded to the maximum content width (`maxLen`) using trailing spaces (`line.padEnd(maxLen, ' ')`). This converts the multi-line string array into a single, cohesive rectangular bounding box so that TUI layout engines (like Ratatui) render and center the logo cleanly without skewing lines.
    * **Uniform Outer Frame Margins**: To prevent the ASCII art from touching or clipping against the TUI pane borders (`│`), prepend a 2-character leading margin (`'  '`) and append a 2-character trailing margin (`'  '`) to every line in the array.
    * **Standardized Replication Formula (for all AI Agents)**:
      ```javascript
      const maxLen = Math.max(...lines.map(l => l.length));
      const formatted = lines.map(line => '  ' + line.padEnd(maxLen, ' ') + '  ');
      ```
* **Gradients and Shading**: Apply gradient text rendering. Instead of flat 16-color palettes, interpolate standard hex colors across the characters using true color escape codes (e.g., `\x1b[38;2;R;G;Bm`).

## 3. Dynamic Banners (The Hermes Layout)
A modern splash screen isn't just a logo; it serves as a dashboard confirming the app's state.

* **Collapsible Sections**: Instead of a wall of text, group initialization states into collapsible headers using chevrons (`❯ Tools [3]`, `❯ Skills [Loaded]`).
* **Differential Updates**: Do not clear the screen and reprint the whole banner. Use cursor movement escape sequences (e.g., `\x1b[1A` to move up) to overwrite specific lines. This prevents flickering while the splash screen updates with real-time loading metrics.

## 4. Terminal Hygiene
A high-quality TUI respects the user's environment.

* **Light/Dark Auto-Detection**: Keep the main body text in the terminal's default foreground color so it remains legible. If your banner relies on background colors, attempt to query the terminal's background (`\033]11;?\007`) or check the `COLORFGBG` environment variable to swap themes automatically.
* **The TTY Check**: Always check if standard output is an interactive terminal (`isatty()`). If the user is piping your tool into a file or grep, completely disable the splash screen and output raw logs to avoid polluting their data with ANSI garbage.
* **Alternate Screen Buffer**: If your tool is a full-screen application, send the `\x1b[?1049h` sequence to switch to the alternate buffer. When the user quits, send `\x1b[?1049l` to restore their previous terminal state without leaving a messy scrollback history.

## 5. The Best Tooling by Language
To build this without manually writing raw ANSI sequences, use these modern UI libraries:

* **Go**: `Charmbracelet/Lipgloss` (for styling and layout) and `Bubble Tea` (for the interactive event loop). This is the gold standard for modern CLI aesthetics.
* **Rust**: `Ratatui`. Highly performant, zero-flicker rendering used by the fastest modern terminal tools.
* **Python**: `Rich` (for instant, beautiful layouts and progress bars) or `Textual` (if the splash screen transitions into a full interactive dashboard).
* **Node.js / TypeScript**: `Ink` (lets you build TUIs using React components) or `Clack` (for beautiful, lightweight prompt flows).

## 6. Automated TUI Documentation (VHS)
For maintaining premium version history and release documentation, static screenshots fall short. This skill integrates explicitly with `vhs` (by Charmbracelet) to automate headless TUI rendering and recording.

* **The `.tape` File**: Use VHS `.tape` scripts to orchestrate the CLI sequence. This includes typing commands (`Type "my-cli"`), executing (`Enter`), sleeping to wait for renders (`Sleep 2s`), and capturing outputs (`Screenshot file.png` or `Output file.gif`).
* **UI Manipulation**: VHS can send specialized keystrokes (`Down`, `Up`, `Space`, `Tab`, `Ctrl+C`) to navigate complex TUI wizards perfectly and repeatedly for every release.
* **Configuration**: Set robust visual defaults at the top of your `.tape` files (e.g., `Set FontSize 15`, `Set Width 1200`, `Set Height 800`, `Set Padding 20`, `Set Theme "Dracula"`, `Set Framerate 60`).
* **Order of Operations (Pre-Compilation)**: VHS executes predefined commands against the *currently compiled* binary. It does not natively compile code. Therefore, you MUST explicitly compile the application (e.g., `cargo build`, `npm run build`) immediately *before* executing the `.tape` script. Failure to do so guarantees the screenshots will reflect old, cached versions of the application rather than the newly bumped code.
* **Deployment Integration**: Always wire the `vhs` execution into the build pipeline or version-bump scripts. This ensures that every release branch automatically generates pristine, up-to-date `.gif` and `.png` assets.
* **Documentation Embedding**: Output files should be placed alongside their respective changelogs and directly embedded using standard markdown tags (e.g., `![Demo](demo.gif)`). Because `vhs` uses a headless Chromium emulator internally, the resulting captures reflect exactly how the TUI appears in a premium desktop terminal.

## 7. Headless Execution & WSL Fallback (Windows)
When automating VHS directly through headless agents on Windows (e.g., as a background CI task), the capture process will often hang indefinitely. This occurs because `vhs` relies on `ttyd`, which requires an interactive Windows pseudo-TTY (`conpty`) that does not exist in headless environments.

To bypass this, execute the `vhs` capture through Windows Subsystem for Linux (WSL).

**One-Time WSL Setup Sequence:**
Before running VHS via WSL for the first time, you MUST proactively prompt the user to authorize a one-time WSL environment preparation. Because standard Ubuntu `apt` repositories are frequently missing or broken for these specific tools, you MUST install them via static binaries:

```powershell
# 1. Ensure extraction tools and headless Chromium graphics dependencies are available
wsl -u root bash -c "apt-get update && apt-get install -y xz-utils libnss3 libasound2 libgbm1 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libpango-1.0-0 libcairo2"

# 2. Install FFmpeg Static Binary
wsl -u root bash -c "cd /tmp && curl -fsSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz && tar -xf ffmpeg.tar.xz && cp ffmpeg-*-static/ffmpeg /usr/local/bin/ffmpeg && chmod +x /usr/local/bin/ffmpeg"

# 3. Install VHS Static Binary
wsl -u root bash -c "cd /tmp && curl -fsSL https://github.com/charmbracelet/vhs/releases/download/v0.7.2/vhs_0.7.2_Linux_x86_64.tar.gz -o vhs.tar.gz && tar -xzf vhs.tar.gz && cp vhs_0.7.2_Linux_x86_64/vhs /usr/local/bin/vhs"

# 4. Install ttyd Static Binary
wsl -u root bash -c "curl -fsSL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 -o /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd"
```

*Note: VHS will automatically download its own headless Chromium browser on first execution.*

**Execution Command:**
Once the static dependencies are configured, execute the tape by explicitly injecting the static binary path inside WSL:

```powershell
$cmd = 'export PATH="/usr/local/bin:$PATH"; vhs project_details/assets/demo.tape'
wsl bash -c $cmd
```

## Changelog
* **v5** : Added strict aesthetic alignment instructions for generating ANSI Shadow font logos natively within TUI layouts.
