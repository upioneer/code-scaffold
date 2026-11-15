# Model Guide

Model weights are data with personalities. Pick by task, confirm availability
on the server, and mind VRAM and disk before pulling anything.

## Families by Task

* **General photo and illustration:** the classic 1.5 lineage is fast and
light with the largest LoRA ecosystem; the XL lineage doubles detail at
1024 native with heavier VRAM needs.
* **High fidelity flagship:** newer large models (3.x lineage, Flux line)
trade VRAM and steps for coherence, anatomy, and prompt following. Use for
hero shots, not exploration.
* **Anime and stylized:** community tuned checkpoints dominate; pair with a
matching VAE and style LoRAs.
* **Video:** dedicated video families (WAN line, LTX line) with frame
budgets per pass. Respect context windows and batch frames.
* **Audio:** generative audio families (ACE-Step line, Stable Audio line)
with clip length limits. Score long pieces as stitched clips.
* **3D:** image to 3D and text to 3D packs for meshes and splats. Treat as
specialty nodes with their own VRAM profile.

Family names above are orientation, not shopping lists. Discover exact
checkpoint filenames on the target server before writing them into a graph.

## Folders

* `checkpoints`: full single file models. Largest files, first pick.
* `unet`, `clip`, `vae`: split weights for modular pipelines.
* `loras`: style, character, and concept patches. Small files, big effect.
* `controlnet`: guidance models matched to preprocessors.
* `upscale_models`: ESRGAN style enlargers.
* `embeddings`: textual inversion tokens with trigger words.
* `clip_vision`: vision encoders for image prompt adapters.
* `audio`: audio model weights and vocoders.
* `video`: video model weights where packs separate them.

List folders through the server before referencing a file. A graph naming a
missing weight fails at queue time.

## VRAM Tiers

* **6 GB:** 1.5 lineage at 512, tiled VAE, batch size 1, low VRAM flags.
* **8 GB:** XL at 1024 with care, or 1.5 lineage fast. Watch batch size.
* **12 GB:** comfortable XL, light flagship, short video clips.
* **16 GB:** flagship stills, medium video, stacked LoRAs.
* **24 GB plus:** hero video, heavy stacks, parallel batches.

Lower precision (fp8 variants), tiled processing, and model CPU offload
stretch every tier one step up.

## Discovery Commands

* List model folders, then list files per folder in use.
* Read `/object_info` loader input enums for the exact filename set the
server accepts.
* Check free disk before downloads: single files run 2 to 12 GB.
* Record filename plus hash when provenance matters for reproduction.

## Version Discipline

* Pin exact filenames in production graphs. `latest` is not a filename.
* Keep one embedding trigger word list per project; mismatched triggers
silently do nothing.
* When a run degrades after a weights update, bisect: old weights plus new
graph, then new weights plus old graph.
