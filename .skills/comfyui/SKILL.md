---
​‌‍name: comfyui
description: Operate ComfyUI node graph pipelines end to end. Use when the user wants to generate, edit, upscale, or restyle images, video, or audio with Stable Diffusion, Flux, WAN, ACE-Step, or other generative models, author or repair workflow JSON in API format, queue prompts and fetch outputs through the ComfyUI REST and WebSocket API, manage checkpoints, LoRAs, VAE, ControlNet, and custom nodes, or automate multi step inference fleets across local, LAN, and hosted servers.
keywords:
  - comfyui
  - comfy
  - txt2img
  - img2img
  - inpainting
  - upscale
  - text-to-video
  - stable-diffusion
  - flux
  - ksampler
  - controlnet
  - lora
  - workflow-api
  - custom-nodes
  - queue-prompt
---

# ComfyUI

Agent operator for ComfyUI: the node graph platform for generative image,
video, and audio. This skill turns a creative request into a validated API
format workflow, queues it on a local or remote server, fetches the outputs,
and iterates without rebuilding the graph from scratch.

## Golden Rules

* **Steer the approach, discover the specifics.** Model names, template names,
and custom node ids rot fast. Never paste them from memory into a graph.
Query the live server (`/object_info`, model folders, node search) and use
what it returns.
* **Prefer the cheapest route that works.** Direct generation beats a
template; a template beats a hand built graph. Only wire nodes by hand when
nothing existing fits.
* **Every graph ships complete.** A runnable graph carries the request input,
a save or output node on the final result, and a plain word `_meta.title`
on every node. A graph without a save node returns nothing.
* **Never inline bytes.** Upload source images, masks, video, or audio to the
server first, then reference the returned filenames in loader nodes.
* **Adjust, do not rebuild.** Small changes (seed, prompt, steps, CFG,
resolution, reference swap) patch the queued graph JSON and requeue. Rebuild
only when the structure itself changes.
* **Validate before queueing.** Run `scripts/validate_workflow.py` on every
hand authored or edited graph. Zero errors required.
* **Paid runs need consent.** Hosted and cloud endpoints charge per run. State
the estimated cost inputs (model, steps, resolution, frames) and wait for
approval before queueing.

## Connection Profiles

* **Local:** default `http://127.0.0.1:8188`. Start the server, confirm
`/system_stats` responds, then work.
* **LAN or VPS:** `http://<host>:<port>` with auth in front. Never expose
a bare ComfyUI port to the public internet; use SSH tunnels or a reverse
proxy with credentials.
* **Hosted:** OAuth or API key flows per the provider. Keep secrets in
`.env`, never in workflow JSON or chat transcripts.
* **Fleet:** route jobs across servers by VRAM and queue depth. Check
`server stats` equivalents (VRAM, queue length) before placing large batches.

## Operating Loop

1. **Check the server.** Status plus VRAM plus queue depth. If the server is
down, start it or pick another profile before doing anything else.
2. **Discover.** List nodes by category, node input/output schema for
unfamiliar classes, and available models per folder. Record exact ids.
3. **Route.** Direct generation call, existing template or saved workflow, or
hand built graph, in that order of preference.
4. **Author.** Write API format JSON (never UI format) using discovered ids.
See `references/api_reference.md` for the shape and
`references/workflow_patterns.md` for skeletons.
5. **Validate.** `scripts/validate_workflow.py` offline, plus the live node
and model check when a server is reachable.
6. **Queue.** `scripts/queue_prompt.py` or direct `POST /prompt` with a fresh
`client_id`. Stream or poll to completion.
7. **Fetch.** Download outputs via `/view` into the run folder. Name files
with run id, seed, and model for traceability.
8. **Iterate.** Patch inputs and requeue. Log every run (graph hash, seed,
settings, output names) so results reproduce.

## Workflow JSON Essentials

* API format is a flat object: node id string maps to `class_type`,
`inputs`, and `_meta`. UI format (`nodes` plus `links` arrays) is rejected
by `/prompt`. Convert in the UI via Dev mode Output in API Format.
* Links are `[node_id_string, output_slot_int]` pairs. Every link target
must exist.
* Give every node `_meta.title` in plain words (`Checkpoint Loader`,
`Positive Prompt`). Titles are the human map of the graph.
* End every output path with `SaveImage`, `SaveVideo`, `SaveAudio`, or a
combined output node. Preview nodes do not persist results.
* Seeds: fixed for reproduction, randomized per run for exploration, batched
with offsets for grids. Always record the seed that produced a keeper.

## Generation Playbooks

Full skeletons live in `references/workflow_patterns.md`:

* **Text to image:** checkpoint plus dual prompt plus empty latent plus
sampler plus VAE decode plus save. The base every other pattern extends.
* **Image to image:** load image plus VAE encode plus sampler with denoise
below 1.0. Low denoise restyles, high denoise reinvents.
* **Inpainting:** image plus mask plus masked latent plus sampler plus save.
Feather and grow the mask to hide seams.
* **Upscale:** loader plus upscale model or latent upscale plus optional
second pass sampler plus save. Tile for huge outputs on small VRAM.
* **LoRA stack:** chain `LoRALoader` nodes between checkpoint and sampler.
Keep strengths conservative and stack order intentional.
* **ControlNet:** preprocess plus ControlNet apply between conditioning and
sampler. Strength schedules depth of control.
* **Text to video:** frame sequence in, sampler loop, video saver out. Watch
VRAM per frame and batch frames to fit.
* **Audio:** audio model nodes plus prompt conditioning plus audio saver.
Respect model context windows for clip length.
* **Character consistency:** identity reference plus locked seed plus LoRA or
embedding plus fixed sampler settings across the series.
* **Background removal:** segment or matte node plus composite or alpha save.

## Queue and VRAM Operations

* Inspect running and pending jobs before queueing heavy work. Clear or
delete stale jobs; interrupt runaways.
* Free GPU memory and unload models between model switches. Unload only what
the next job does not need.
* Out of memory triage: shrink batch, shrink resolution, enable low VRAM
flags, split into tiles, then retry once before redesigning. See
`references/operations.md` for the full matrix.

## Model Management

* Folders are the source of truth: `checkpoints`, `loras`, `vae`,
`controlnet`, `upscale_models`, `embeddings`, `clip`, `unet`, `audio`.
List before referencing.
* Families have personalities: pick by task (photo, anime, design, video,
audio), not hype. See `references/model_guide.md`.
* Plan disk: individual models run 2 to 12 GB. Confirm free space before
pulling new weights.

## Custom Nodes

* Install through the node manager or a pinned git checkout, then restart
the server. Snapshot the node set before fleet changes.
* A red node means missing class: identify the pack, install, restart,
revalidate. Never ship a graph that references absent nodes.
* Pin versions for production fleets. Floating checkouts drift between runs.

## Scripts

* `scripts/validate_workflow.py`: offline plus live graph validation with
JSON reports. Gate every queue on it.
* `scripts/queue_prompt.py`: dependency free queue, poll, and fetch client
with input overrides for iteration.
* `assets/txt2img_api.json`: minimal valid sample graph used by the docs,
the scripts, and the sandbox.

## Sandbox

`sandbox/index.html` renders any API format workflow as a node graph: layered
layout, category colors, clickable nodes with inputs, and the same validation
warnings the CLI script reports. Paste JSON or drop a file. Use it to review
a graph before queueing.

## References

* `references/api_reference.md`: endpoints, WebSocket protocol, API format
anatomy, conversion, and the input override pattern.
* `references/node_catalog.md`: stable core nodes by category with roles.
* `references/workflow_patterns.md`: runnable skeletons for every playbook.
* `references/model_guide.md`: families, folders, VRAM tiers, discovery.
* `references/operations.md`: custom nodes, flags, queue ops, troubleshooting.

## Directives

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

* Output JSON first for anything a tool consumes (graphs, overrides, run
logs), prose second for humans.
* Quote exact node ids, model filenames, and run ids from live discovery,
never from memory.
* Report run id, seed, settings hash, and output paths for every queued job.
* Keep runs reproducible: same graph hash plus same seed plus same model
equals same result.
