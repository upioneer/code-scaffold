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
    execSync(`git clone --depth 1 --filter=blob:none --sparse ${targetUrl} "${cloneDir}"`, { stdio: "ignore" })
    execSync(`git sparse-checkout set .skills/${skillName}`, { cwd: cloneDir, stdio: "ignore" })
    
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
    // Universal Agent Routing Configurations
    try {
      // Antigravity Mapping
      const agyDir = path.join(targetProjectDir, ".agents")
      await fs.mkdir(agyDir, { recursive: true })
      const linkContent = { entries: [{ path: "../.skills" }] }
      await fs.writeFile(path.join(agyDir, "skills.json"), JSON.stringify(linkContent, null, 2), "utf-8")

      // Cursor Mapping
      const cursorDir = path.join(targetProjectDir, ".cursor", "rules")
      await fs.mkdir(cursorDir, { recursive: true })
      const cursorRules = path.join(cursorDir, "skills.mdc")
      const rule = "\n# Code Scaffold Skills\nWhen using skills, actively read and adhere to the instructions inside the `.skills/` directory.\n"
      let currentRules = ""
      try { currentRules = await fs.readFile(cursorRules, "utf-8") } catch (e) {}
      if (!currentRules.includes(".skills/")) {
        await fs.writeFile(cursorRules, currentRules + rule, "utf-8")
      }

      // Claude Code Mapping
      const claudeCodeFile = path.join(targetProjectDir, "CLAUDE.md")
      let currentClaudeCode = ""
      try { currentClaudeCode = await fs.readFile(claudeCodeFile, "utf-8") } catch (e) {}
      if (!currentClaudeCode.includes(".skills/")) {
        await fs.writeFile(claudeCodeFile, currentClaudeCode + rule, "utf-8")
      }

      // OpenCode Mapping
      const openCodeFile = path.join(targetProjectDir, ".opencode.md")
      let currentOpenCode = ""
      try { currentOpenCode = await fs.readFile(openCodeFile, "utf-8") } catch (e) {}
      if (!currentOpenCode.includes(".skills/")) {
        await fs.writeFile(openCodeFile, currentOpenCode + rule, "utf-8")
      }

      // Devin CLI & Devin Desktop Mapping
      const devinDir = path.join(targetProjectDir, ".devin", "rules")
      await fs.mkdir(devinDir, { recursive: true })
      const devinRules = path.join(devinDir, "skills.md")
      let currentDevin = ""
      try { currentDevin = await fs.readFile(devinRules, "utf-8") } catch (e) {}
      if (!currentDevin.includes(".skills/")) {
        await fs.writeFile(devinRules, currentDevin + rule, "utf-8")
      }
    } catch (configError) {
      // Fail silently if configuration writing fails, to prevent blocking the skill installation
    }

    return { success: true, registeredSkill: parsedMeta.name }
  } catch (error) {
    throw new Error("Execution bootstrapper failed to deploy target package " + error.message)
  }
}
