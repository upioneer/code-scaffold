#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_DIR = path.resolve(__dirname, "../registry");
const MANIFEST_PATH = path.join(REGISTRY_DIR, "manifest.json");
const COMPONENTS_DIR = path.join(REGISTRY_DIR, "components");

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Error: manifest.json not found at " + MANIFEST_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

const args = process.argv.slice(2);
const command = args[0] || "help";

switch (command) {
  case "list": {
    const filterCat = args[1];
    const manifest = loadManifest();
    console.log("\n======================================================================");
    console.log("  Code Scaffold Tactile Kinetic Matrix : 86-Component Registry");
    console.log("======================================================================\n");
    
    let count = 0;
    for (const cat of manifest.categories) {
      if (filterCat && cat !== filterCat) continue;
      const comps = manifest.components.filter((c) => c.category === cat);
      console.log(`[Category: ${cat.toUpperCase()}] (${comps.length} components)`);
      for (const c of comps) {
        console.log(`  * ${c.slug.padEnd(24)} : ${c.title} - ${c.description.slice(0, 50)}...`);
        count++;
      }
      console.log("");
    }
    console.log(`Total displayed: ${count} / ${manifest.totalComponents} components.\n`);
    break;
  }

  case "info": {
    const slug = args[1];
    if (!slug) {
      console.error("Usage: node primitive_registry.mjs info <slug>");
      process.exit(1);
    }
    const manifest = loadManifest();
    const comp = manifest.components.find((c) => c.slug === slug);
    if (!comp) {
      console.error(`Error: Component "${slug}" not found in registry.`);
      process.exit(1);
    }

    console.log("\n======================================================================");
    console.log(`  Component: ${comp.title} (${comp.slug})`);
    console.log("======================================================================\n");
    console.log(`Category:     ${comp.category}`);
    console.log(`Description:  ${comp.description}`);
    console.log(`Dependencies: ${comp.dependencies.length > 0 ? comp.dependencies.join(", ") : "None (Pure React)"}`);
    console.log("\nFiles:");
    for (const f of comp.files) {
      const fullPath = path.join(COMPONENTS_DIR, f.fileName);
      const exists = fs.existsSync(fullPath);
      console.log(`  * ${f.fileName} (${exists ? "Available" : "Missing"})`);
    }
    console.log("");
    break;
  }

  case "export": {
    const slug = args[1];
    const targetDir = args[2] || "src/components/ui";
    if (!slug) {
      console.error("Usage: node primitive_registry.mjs export <slug> [targetDir]");
      process.exit(1);
    }
    const manifest = loadManifest();
    const comp = manifest.components.find((c) => c.slug === slug);
    if (!comp) {
      console.error(`Error: Component "${slug}" not found.`);
      process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Exporting ${comp.slug} to ${targetDir}...`);
    for (const f of comp.files) {
      const src = path.join(COMPONENTS_DIR, f.fileName);
      const dest = path.join(targetDir, f.fileName);
      fs.copyFileSync(src, dest);
      console.log(`  -> Copied ${f.fileName}`);
    }
    console.log("Export complete!\n");
    break;
  }

  case "export-all": {
    const targetDir = args[1] || "src/components/ui";
    const manifest = loadManifest();
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Exporting all ${manifest.totalComponents} components to ${targetDir}...`);
    let copied = 0;
    for (const comp of manifest.components) {
      for (const f of comp.files) {
        const src = path.join(COMPONENTS_DIR, f.fileName);
        const dest = path.join(targetDir, f.fileName);
        fs.copyFileSync(src, dest);
        copied++;
      }
    }
    console.log(`Successfully exported ${copied} files across ${manifest.totalComponents} components!\n`);
    break;
  }

  case "doctor": {
    const manifest = loadManifest();
    console.log("\nVerifying Tactile Kinetic Matrix registry integrity...");
    let missing = 0;
    for (const comp of manifest.components) {
      for (const f of comp.files) {
        const fullPath = path.join(COMPONENTS_DIR, f.fileName);
        if (!fs.existsSync(fullPath)) {
          console.error(`  [MISSING] ${comp.slug} -> ${f.fileName}`);
          missing++;
        }
      }
    }
    if (missing === 0) {
      console.log(`✅ All ${manifest.totalComponents} components and their files are 100% verified and intact.\n`);
    } else {
      console.error(`❌ Verification failed: ${missing} files missing.\n`);
      process.exit(1);
    }
    break;
  }

  default:
    console.log("\nCode Scaffold Tactile Kinetic Matrix CLI");
    console.log("Commands:");
    console.log("  list [category]          : List components in registry");
    console.log("  info <slug>              : Show component metadata and dependencies");
    console.log("  export <slug> [target]   : Copy component to target project directory");
    console.log("  export-all [target]      : Copy all 86 components to target directory");
    console.log("  doctor                   : Verify registry file integrity\n");
}
