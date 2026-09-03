---
name: Marp
description: Generates Marp presentation slides from Markdown
---

# Marp Slide Generation Skill

## Description
This skill enables the agent to transform structured content or outlines into professional slide decks using the Marp Markdown ecosystem. It automates the application of slide delimiters, directives, and thematic styling compatible with Marp CLI and Marp Core.

## Inputs
* Content Outline: A structured list of points or a raw text draft.
* Theme Preference: Selection of built-in Marp themes such as default, gaia, or uncover.
* Directives: Global settings like pagination, header/footer content, and aspect ratio.

## Actions
1.  Initialize Markdown file with Marp frontmatter.
2.  Segment content into logical slide breaks using the `---` horizontal ruler.
3.  Apply Marp specific syntax for formatting:
    * Image resizing: `![width:500px](image.png)`
    * Background images: `![bg](background.jpg)`
    * Fragmented lists: Using `*` for bullet points.
4.  Insert global and local directives to control slide behavior.

## Outputs
* Marp Compatible Markdown: A single .md file ready for conversion to PDF, HTML, or PowerPoint via Marp CLI.

## Constraints
* Ensure every slide break is preceded and followed by a newline.
* Always include the `marp: true` global directive in the frontmatter.
* Maintain accessible contrast ratios when selecting background colors.
