# Skills Distribution Architecture Guide

This document outlines the systematic process for creating, packaging, and distributing ad hoc installable skills for the orchestration engine.

## Core Component Layout

Every installable skill must strictly adhere to an isolated directory structure to ensure compatibility with the runtime loader.

### Manifest Configuration

The skill manifest defines the structural metadata, execution entry points, and required sandbox permissions for the tool.

```json
{
  "name": "code_scaffold_export_skill",
  "version": "1.0.0",
  "description": "Exposes code scaffold skills to public distributions via automated packaging",
  "entryPoint": "./dist/index.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "requiredPermissions": [
    "fs:read",
    "fs:write",
    "net:connect"
  ]
}
```

## Distribution Manager Tool

The distribution management skill automates the validation and packaging pipelines of custom capabilities.

```javascript
import fs from "fs/promises"
import path from "path"

export const DistributeSkillManager = {
  name: "package_distribution_manager",
  description: "Automates the packaging structural validation and local registration of modular agent skills for public deployment",
  parameters: {
    type: "object",
    properties: {
      targetSkillPath: {
        type: "string",
        description: "The absolute or relative path to the directory containing the source skill assets"
      },
      distributionTarget: {
        type: "string",
        description: "The targeted distribution format or directory mapping"
      }
    },
    required: ["targetSkillPath", "distributionTarget"]
  },

  handler: async (args) => {
    const sourceDir = path.resolve(args.targetSkillPath)
    const manifestPath = path.join(sourceDir, "skill-manifest.json")

    try {
      const rawManifest = await fs.readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(rawManifest)

      if (!manifest.name || !manifest.entryPoint) {
        return {
          success: false,
          error: "Invalid skill structure missing required manifest keys"
        }
      }

      const resolvedEntry = path.resolve(sourceDir, manifest.entryPoint)
      await fs.access(resolvedEntry)

      const assetPayload = {
        meta: manifest,
        timestamp: new Date().toISOString(),
        verifiedArtifacts: [
          "skill-manifest.json",
          manifest.entryPoint
        ]
      }

      return {
        success: true,
        message: "Skill target verified and staged successfully for distribution",
        payloadSummary: assetPayload
      }

    } catch (error) {
      return {
        success: false,
        error: "Distribution failure " + error.message
      }
    }
  }
}
```

## Installation Workflow Pipeline

The core command line installer handles remote asset acquisition and integration with the active local environment.

```javascript
import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"

export async function installAdHocSkill(skillIdentifier, targetProjectDir) {
  const vendorDirectory = path.join(targetProjectDir, ".code_scaffold", "skills")
  const internalRegistryPath = path.join(targetProjectDir, ".code_scaffold", "skills.json")

  await fs.mkdir(vendorDirectory, { recursive: true })

  const targetUrl = "https://github.com/" + skillIdentifier + ".git"
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
```