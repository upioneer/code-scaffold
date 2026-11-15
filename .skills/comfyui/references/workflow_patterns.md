# Workflow Patterns

Runnable API format skeletons. Replace model filenames with live discovered
values; every filename below is a placeholder. Validate each graph with
`scripts/validate_workflow.py` before queueing. A complete minimal graph
ships in `assets/txt2img_api.json`.

## Text to Image

Checkpoint plus positive plus negative plus empty latent plus sampler plus
decode plus save.

```json
{
  "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "MODEL.safetensors"}, "_meta": {"title": "Checkpoint Loader"}},
  "2": {"class_type": "CLIPTextEncode", "inputs": {"text": "POSITIVE", "clip": ["1", 1]}, "_meta": {"title": "Positive Prompt"}},
  "3": {"class_type": "CLIPTextEncode", "inputs": {"text": "NEGATIVE", "clip": ["1", 1]}, "_meta": {"title": "Negative Prompt"}},
  "4": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}, "_meta": {"title": "Empty Latent"}},
  "5": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": 1, "steps": 25, "cfg": 7.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0}, "_meta": {"title": "Sampler"}},
  "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}, "_meta": {"title": "VAE Decode"}},
  "7": {"class_type": "SaveImage", "inputs": {"filename_prefix": "txt2img/run", "images": ["6", 0]}, "_meta": {"title": "Save Image"}}
}
```

## Image to Image

Load plus encode plus sampler with denoise below 1.0 plus decode plus save.
Denoise near 0.3 keeps composition, near 0.7 reinvents freely.

```json
{
  "8": {"class_type": "LoadImage", "inputs": {"image": "SOURCE.png"}, "_meta": {"title": "Source Image"}},
  "9": {"class_type": "VAEEncode", "inputs": {"pixels": ["8", 0], "vae": ["1", 2]}, "_meta": {"title": "VAE Encode"}}
}
```

Feed node 9 into the sampler `latent_image` and set `denoise` to taste.

## Inpainting

Image plus mask plus masked latent plus sampler plus save. Grow and feather
the mask so seams vanish.

```json
{
  "10": {"class_type": "LoadImageMask", "inputs": {"image": "MASK.png", "channel": "red"}, "_meta": {"title": "Load Mask"}},
  "11": {"class_type": "GrowMaskWithBlur", "inputs": {"mask": ["10", 0], "expand": 12, "incremental_expandrate": 0, "tapered_corners": true, "flip_input": false, "blur_radius": 8, "lerp_alpha": 1.0, "decay_factor": 1.0, "fill_holes": false}, "_meta": {"title": "Feather Mask"}},
  "12": {"class_type": "SetLatentNoiseMask", "inputs": {"samples": ["9", 0], "mask": ["11", 0]}, "_meta": {"title": "Masked Latent"}}
}
```

Feed node 12 into the sampler with denoise at 1.0 for full replacement.

## Upscale

Model path for fidelity, latent path for speed. Chain both for hero shots.

```json
{
  "13": {"class_type": "UpscaleModelLoader", "inputs": {"model_name": "UPSCALER.pth"}, "_meta": {"title": "Upscale Model"}},
  "14": {"class_type": "ImageUpscaleWithModel", "inputs": {"upscale_model": ["13", 0], "image": ["6", 0]}, "_meta": {"title": "Model Upscale"}}
}
```

For latent upscale, encode the image, run `LatentUpscale`, sample lightly
with low denoise, then decode. Tile encode and decode on small VRAM.

## LoRA Stack

Chain loaders between checkpoint and sampler. Order matters: style LoRAs
usually ride after character LoRAs, strengths stay conservative.

```json
{
  "15": {"class_type": "LoRALoader", "inputs": {"model": ["1", 0], "clip": ["1", 1], "lora_name": "FIRST.safetensors", "strength_model": 0.8, "strength_clip": 0.8}, "_meta": {"title": "LoRA One"}},
  "16": {"class_type": "LoRALoader", "inputs": {"model": ["15", 0], "clip": ["15", 1], "lora_name": "SECOND.safetensors", "strength_model": 0.5, "strength_clip": 0.5}, "_meta": {"title": "LoRA Two"}}
}
```

Point the sampler at node 16 outputs.

## ControlNet

Preprocess the control image, apply with strength, feed guided conditioning
to the sampler. Lower strength sketches, higher strength obeys.

```json
{
  "17": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "CONTROL.pth"}, "_meta": {"title": "ControlNet Loader"}},
  "18": {"class_type": "ControlNetApply", "inputs": {"conditioning": ["2", 0], "control_net": ["17", 0], "image": ["8", 0], "strength": 0.8}, "_meta": {"title": "ControlNet Apply"}}
}
```

Point the sampler positive input at node 18.

## Text to Video

Load or generate start frames, sample the sequence, save video. Batch
frames to fit VRAM and window long clips into overlapping chunks.

```json
{
  "19": {"class_type": "LoadVideo", "inputs": {"video": "SOURCE.mp4", "force_rate": 0, "force_size": "Disabled", "custom_width": 512, "custom_height": 512, "frame_load_cap": 49, "skip_first_frames": 0, "select_every_nth": 1}, "_meta": {"title": "Load Video"}},
  "20": {"class_type": "SaveVideo", "inputs": {"video": ["30", 0], "filename_prefix": "video/run", "format": "auto", "codec": "auto"}, "_meta": {"title": "Save Video"}}
}
```

Node 30 stands for the final frame output of the sampler chain.

## Audio

Audio model nodes vary by pack, so discover classes per server first. The
shape is constant: prompt conditioning plus audio model plus sampler plus
`SaveAudio`. Respect model context windows: split long pieces into scored
clips and stitch.

## Character Consistency

Lock identity across a series: same reference image, same seed family, same
sampler and CFG, one identity LoRA or embedding, fixed resolution. Change
one variable at a time (pose prompt, then background, then wardrobe) and
keep losers for the LoRA training set.

## Background Removal

Segment or matte node to alpha, then composite over the new background or
save with transparency. Feather one pixel to kill halos.

## Prompt Engineering

* Weight phrases with `(phrase:1.2)` emphasis and `(phrase:0.8)` suppression.
* Front load subject and medium, back load details and finishers.
* Negative prompts name defects to avoid: anatomy errors, artifacts, blur,
watermarks, text.
* Embeddings (textual inversion) inject trained tokens; trigger words must
match the embedding exactly.
* Keep prompts under encoder token limits; split long scenes across
conditioning combines.

## Seed Discipline

* Fixed seed plus fixed graph equals reproducible result. Record both.
* Seed sweeps explore: increment by 1 across a batch for neighbors, random
for diversity.
* Batch size above 1 with one seed fans offsets automatically.
* A keeper without its seed is luck, not process. Log everything.

## Resolution Guide

Match training buckets first, upscale second. Square 1024 for portraits and
icons, 1216 by 832 or 1344 by 768 for landscape, 832 by 1216 for poster
verticals, multiples of 64 everywhere. Video follows the model frame budget;
never exceed the context window in one pass.
