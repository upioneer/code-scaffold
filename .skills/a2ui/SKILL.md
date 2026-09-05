---
​‌‍name: A2UI
description: Agent-to-User Interface (A2UI) protocol implementation and client renderer scaffolding.
---

# A2UI Skill Instructions

This skill enables agents to generate, validate, and scaffold interactive user interfaces using the A2UI (Agent-to-User Interface) protocol (v0.9+). By adhering to A2UI, agents output declarative JSON payloads instead of executable frontend code, maximizing security, LLM-streaming efficiency, and client interoperability.

## Core Philosophy

* **Declarative Data, Not Code:** You MUST NOT generate React, Vue, HTML, or Ratatui code when prompted to generate a user interface via A2UI. Instead, generate the strict A2UI JSON node schema.
* **Component Catalog (Trust Ladder):** Assume the client application holds a catalog of safe, pre-registered UI components (e.g., `Card`, `Button`, `TextField`). Your JSON output simply requests the client to render these specific, registered components.
* **Flat List Architecture:** A2UI structures the UI as a flat list of nodes, linked via IDs. This structure is specifically optimized to allow you (the LLM) to stream UI updates incrementally without needing to wrap deeply nested closing brackets.

## A2UI JSON Protocol Schema (v0.9)

When emitting an A2UI payload, you MUST wrap it in a root JSON structure containing an array of node updates.

### The Standard Payload

```json
{
  "a2ui_doc": {
    "nodes": [
      {
        "id": "node_1",
        "component": "Card",
        "props": {
          "title": "Welcome to Code Scaffold"
        },
        "children": ["node_2"]
      },
      {
        "id": "node_2",
        "component": "Button",
        "props": {
          "label": "Click Me",
          "action": "submit_form"
        }
      }
    ]
  }
}
```

### Node Constraints
1. **`id`** (String): Must be a unique identifier within the document.
2. **`component`** (String): Must match a component registered in the client's catalog.
3. **`props`** (Object): Key-value pairs matching the component's expected data.
4. **`children`** (Array of Strings): A list of node IDs that this component should render as its children.

## Best Practices for A2UI Agents

1. **Avoid Deep Nesting in your thought process:** Leverage the flat node structure. Define the parent, define the children, and link them via IDs. This prevents token context limits from breaking JSON validation.
2. **Dynamic Data Collection:** Use A2UI to dynamically generate forms tailored to the conversation (e.g., specific input fields, date pickers) rather than asking the user for information purely via text.
3. **Client-Side Rendering Hooks:** When implementing an A2UI client application (e.g., a React app), you MUST build a rendering loop that parses the `a2ui_doc.nodes` array and recursively traverses from a `root` node, mapping the `component` strings to native React components.

## Scaffolding an A2UI Client (React/Vite Example)

If the user asks you to implement an A2UI renderer in a frontend project, use this architectural pattern:

```tsx
// Example Renderer Loop
function A2UIRenderer({ nodes, rootId }) {
  const rootNode = nodes.find(n => n.id === rootId);
  if (!rootNode) return null;

  // Retrieve the actual React component from the catalog
  const Component = Catalog[rootNode.component];
  
  if (!Component) {
    console.warn(`Component ${rootNode.component} not found in catalog.`);
    return null;
  }

  return (
    <Component {...rootNode.props}>
      {rootNode.children?.map(childId => (
        <A2UIRenderer key={childId} nodes={nodes} rootId={childId} />
      ))}
    </Component>
  );
}
```

## Validation (When Applicable)
If working within a backend environment, always ensure your A2UI JSON output passes structural validation before streaming it to the frontend, verifying that `id` fields are unique and `children` references exist within the node array.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
