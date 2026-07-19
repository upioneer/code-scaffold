const fs = require('fs');

/**
 * Validates an A2UI JSON payload against basic schema rules.
 * Usage: node validate-a2ui.cjs <path-to-json-file>
 */

function validateA2UI(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  if (!data.a2ui_doc) {
    console.error("Missing root 'a2ui_doc' object.");
    process.exit(1);
  }

  const nodes = data.a2ui_doc.nodes;
  if (!Array.isArray(nodes)) {
    console.error("'a2ui_doc.nodes' must be an array.");
    process.exit(1);
  }

  const ids = new Set();
  const childrenReferences = new Set();

  for (const node of nodes) {
    if (!node.id || typeof node.id !== 'string') {
      console.error(`Node missing string 'id': ${JSON.stringify(node)}`);
      process.exit(1);
    }
    if (ids.has(node.id)) {
      console.error(`Duplicate node id found: ${node.id}`);
      process.exit(1);
    }
    ids.add(node.id);

    if (!node.component || typeof node.component !== 'string') {
      console.error(`Node '${node.id}' missing string 'component' property.`);
      process.exit(1);
    }

    if (node.children) {
      if (!Array.isArray(node.children)) {
        console.error(`Node '${node.id}' 'children' property must be an array of strings.`);
        process.exit(1);
      }
      for (const childId of node.children) {
        if (typeof childId !== 'string') {
          console.error(`Node '${node.id}' has a non-string child id: ${childId}`);
          process.exit(1);
        }
        childrenReferences.add(childId);
      }
    }
  }

  // Validate all child references exist
  for (const childId of childrenReferences) {
    if (!ids.has(childId)) {
      console.error(`Child reference '${childId}' not found in nodes array.`);
      process.exit(1);
    }
  }

  console.log("✅ A2UI validation passed.");
  process.exit(0);
}

const file = process.argv[2];
if (!file) {
  console.log("Usage: node validate-a2ui.cjs <payload.json>");
  process.exit(1);
}

validateA2UI(file);
