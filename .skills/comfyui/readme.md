# ComfyUI

**Version:** 2

**Target:** `.skills/comfyui`

**Category:** AI, MCP & Developer Tools

**Keywords:** `comfyui`, `comfy`, `txt2img`, `img2img`, `inpainting`, `upscale`, `text-to-video`, `stable-diffusion`, `flux`, `ksampler`, `controlnet`, `lora`, `workflow-api`, `custom-nodes`, `queue-prompt`

## Description
Agent operator for ComfyUI node graph pipelines: authors validated API format workflows, queues prompts through REST and WebSocket, manages checkpoints, LoRAs, and custom nodes, and fetches finished image, video, and audio across local and hosted servers.

## Capabilities & Use Cases
* **API Format Workflow Authoring** : Writes runnable node graphs with resolved links, plain word titles, and mandatory save nodes, converting UI exports to queueable JSON
* **Interactive Graph Visualizer Sandbox** : Renders any pasted or dropped workflow as a layered node diagram with category colors, clickable inputs, and inline validation warnings
* **Prompt Queueing and Output Fetch** : Posts graphs to `/prompt`, polls history to completion, and downloads every output with run id traceability
* **Input Override Iteration** : Patches seeds, prompts, steps, CFG, resolution, and references onto queued graphs without rebuilding structure
* **Generation Playbooks** : Text to image, image to image, inpainting, model and latent upscale, LoRA stacks, ControlNet guidance, text to video, generative audio, character consistency, and background removal
* **Node Catalog Fluency** : Loaders, conditioning, samplers, latent, image, mask, video, audio, and utility classes with wiring order and roles
* **Model Lifecycle Management** : Family selection by task, folder discovery, VRAM tier planning, disk budgeting, and version pinning for reproduction
* **Custom Node Operations** : Manager installs, pinned checkouts, snapshot discipline, restart flows, and red node triage
* **Queue and VRAM Discipline** : Job inspection, selective clears, interrupts, model unloads, and ordered out of memory recovery
* **Offline and Live Validation** : Dependency free checker for structure, links, save coverage, titles, plus live class and model verification against the server
* **Multi Server Routing** : Fleet profiles by VRAM and queue depth with fit based job placement

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Removed the Safety and Cost Discipline guardrails per owner direction
* **v1** : Initial release with API reference, node catalog, workflow patterns, model guide, operations manual, validator plus queue scripts, sample graph, and graph visualizer sandbox
