# Mermaid Diagram Skill

## Description
This skill grants the agent the ability to design, generate, and edit professional visual diagrams using the Mermaid text-based syntax. Mermaid is a JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically. It supports flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, mindmaps, and more.

## Inputs
* Diagram Intent: A description of the architecture, flowchart, sequence, state, or mental model to visualize.
* Depth Level: Abstract (high level) or Technical (detailed).
* Existing File: A `.mmd` or Markdown file to modify.

## Actions
1. Perform a Depth Assessment to determine the level of detail required for the request.
2. Select the appropriate Mermaid diagram type based on the intent (e.g., `flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `mindmap`, `timeline`, `architecture`).
3. Generate Mermaid diagram code using the appropriate syntax:
    * Use `flowchart TD` or `flowchart LR` for workflows and component architecture.
    * Use `sequenceDiagram` for API flows or microservice interactions.
4. Apply the configuration and theming to ensure readability and brand consistency:
    * Use frontmatter YAML `---` or directives `%%{ init: { 'theme': 'default' } }%%`.
    * You can configure layout algorithms such as `elk` for better routing in complex flowcharts.
5. If generating an image, you can use the `mermaid-cli` (`mmdc`):
    * E.g., `npx -p @mermaid-js/mermaid-cli mmdc -i input.mmd -o output.svg`.

## Outputs
* Mermaid Code: Text containing the diagram syntax, either in a standalone `.mmd` file or embedded in Markdown within ` ```mermaid ` blocks.
* Generated SVG/PNG (if CLI is requested).
* Summary: A text-based explanation of the components and relationships created in the diagram.

## Constraints
* Always start diagram code with the proper diagram declaration (e.g., `flowchart TD`, `sequenceDiagram`).
* Use `%%` for line comments.
* Unknown words and misspellings will break the diagram; ensure exact syntax.
* Avoid special characters inside node labels that could break syntax, or escape/wrap them appropriately.
* Frontmatter configuration MUST have the triple dash `---` as the first characters on the line.

