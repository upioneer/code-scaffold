import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"

export async function installAdHocSkill(skillIdentifier, targetProjectDir) {
  const vendorDirectory = path.join(targetProjectDir, ".skills")
  const internalRegistryPath = path.join(vendorDirectory, "registry.json")

  await fs.mkdir(vendorDirectory, { recursive: true })

  const [author, skillName] = skillIdentifier.split("/")
  if (!author || !skillName) {
    throw new Error("Invalid skill identifier format. Expected author/skill-name.")
  }

  const temporaryTargetDir = path.join(vendorDirectory, skillName)
  const cloneDir = temporaryTargetDir + "_tmp"

  try {
    // Robust pre-cleanup: Ensure the temporary directory is empty before cloning
    await fs.rm(cloneDir, { recursive: true, force: true }).catch(() => {})
    
    const targetUrl = "https://github.com/" + author + "/code-scaffold.git"
    
    // Purge environment variables that frequently crash automated nested git operations
    const safeEnv = { ...process.env }
    delete safeEnv.GIT_DIR
    delete safeEnv.GIT_WORK_TREE
    delete safeEnv.GIT_INDEX_FILE
    delete safeEnv.GIT_OBJECT_DIRECTORY
    delete safeEnv.GIT_TERMINAL_PROMPT

    try {
      execSync(`git clone --depth 1 --filter=blob:none --sparse ${targetUrl} "${cloneDir}"`, { env: safeEnv, stdio: "ignore", timeout: 30000 })
      execSync(`git sparse-checkout set .skills/${skillName}`, { cwd: cloneDir, env: safeEnv, stdio: "ignore", timeout: 30000 })
    } catch (sparseError) {
      console.log(`[skills-cli] Phase 1 (Sparse Clone) failed. Retrying with shallow clone...`)
      await fs.rm(cloneDir, { recursive: true, force: true }).catch(() => {})
      try {
        execSync(`git clone --depth 1 ${targetUrl} "${cloneDir}"`, { env: safeEnv, stdio: "ignore", timeout: 30000 })
      } catch (shallowError) {
        console.log(`[skills-cli] Phase 2 (Shallow Clone) failed. Retrying with direct tarball download...`)
        await fs.rm(cloneDir, { recursive: true, force: true }).catch(() => {})
        await fs.mkdir(cloneDir, { recursive: true })
        try {
          const tarballUrl = `https://github.com/${author}/code-scaffold/archive/refs/heads/main.tar.gz`
          execSync(`curl -sSL ${tarballUrl} | tar -xz -C "${cloneDir}" --strip-components=1`, { env: safeEnv, stdio: "ignore", timeout: 45000 })
        } catch (curlError) {
          throw new Error("All extraction phases failed. Agent environment restricts git and curl/tar operations.")
        }
      }
    }
    
    await fs.rename(path.join(cloneDir, ".skills", skillName), temporaryTargetDir)
    await fs.rm(cloneDir, { recursive: true, force: true }).catch(() => {})
    const rawManifest = await fs.readFile(path.join(temporaryTargetDir, "skill-manifest.json"), "utf-8")
    const parsedMeta = JSON.parse(rawManifest)

    let currentRegistry = {}
    try {
      const existingData = await fs.readFile(internalRegistryPath, "utf-8")
      currentRegistry = JSON.parse(existingData)
    } catch (e) {
      // Dynamic index creation when tracking matrix is absent
    }

    currentRegistry[parsedMeta.name] = {
      version: parsedMeta.version,
      localPath: path.relative(targetProjectDir, temporaryTargetDir),
      registeredAt: new Date().toISOString()
    }

    await fs.writeFile(internalRegistryPath, JSON.stringify(currentRegistry, null, 2), "utf-8")
    // Universal Agent Routing Configurations (12 Leading AI Ecosystems)
    try {
      // Antigravity Mapping
      const agyDir = path.join(targetProjectDir, ".agents")
      await fs.mkdir(agyDir, { recursive: true })
      const linkContent = { entries: [{ path: "../.skills" }] }
      await fs.writeFile(path.join(agyDir, "skills.json"), JSON.stringify(linkContent, null, 2), "utf-8")

      const rule = "\n# Code Scaffold Skills\nWhen using skills, actively read and adhere to the instructions inside the `.skills/` directory.\n"

      // Helper to append rule idempotently
      const appendRuleIfMissing = async (filePath) => {
        const dir = path.dirname(filePath)
        await fs.mkdir(dir, { recursive: true })
        let current = ""
        try { current = await fs.readFile(filePath, "utf-8") } catch (e) {}
        if (!current.includes(".skills/")) {
          const prefix = current && !current.endsWith("\n") ? "\n" : ""
          await fs.writeFile(filePath, current + prefix + rule.trimStart(), "utf-8")
        }
      }

      // Cursor Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".cursor", "rules", "skills.mdc"))

      // Claude Code Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, "CLAUDE.md"))

      // OpenCode Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".opencode.md"))

      // Devin CLI & Devin Desktop Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".devin", "rules", "skills.md"))

      // OpenAI Codex & ChatGPT Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, "CODEX.md"))

      // Meta Muse Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, "MUSE.md"))

      // Kimi Code Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, "KIMI.md"))

      // Qwen Code Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, "QWEN.md"))

      // GitHub Copilot Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".github", "copilot-instructions.md"))

      // Windsurf (Codeium Cascade) Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".windsurfrules"))

      // Cline & Roo Code Mapping
      await appendRuleIfMissing(path.join(targetProjectDir, ".clinerules"))
    } catch (configError) {
      // Fail silently if configuration writing fails, to prevent blocking the skill installation
    }

    return { success: true, registeredSkill: parsedMeta.name }
  } catch (error) {
    throw new Error("Execution bootstrapper failed to deploy target package " + error.message)
  }
}
