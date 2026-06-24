import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"

export async function installAdHocSkill(skillIdentifier, targetProjectDir) {
  const vendorDirectory = path.join(targetProjectDir, ".code_scaffold", "skills")
  const internalRegistryPath = path.join(targetProjectDir, ".code_scaffold", "skills.json")

  await fs.mkdir(vendorDirectory, { recursive: true })

  const targetUrl = "[https://github.com/](https://github.com/)" + skillIdentifier + ".git"
  const temporaryTargetDir = path.join(vendorDirectory, path.basename(skillIdentifier))

  try {
    execSync("git clone --depth 1 " + targetUrl + " " + temporaryTargetDir, { stdio: "ignore" })

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
    return { success: true, registeredSkill: parsedMeta.name }

  } catch (error) {
    throw new Error("Execution bootstrapper failed to deploy target package " + error.message)
  }
}