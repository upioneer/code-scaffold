# Core Node Catalog

Stable built in nodes by category. Classes below ship with ComfyUI itself
and rarely change. Anything else is a custom node: confirm it through
`/object_info` before wiring. This catalog names roles and wiring order,
not parameter enums; pull live enums per server.

## Loaders

* **CheckpointLoaderSimple**: one file checkpoint to model plus clip plus
vae. The default start for classic pipelines.
* **CheckpointLoader**: full checkpoint record with config name override for
exotic architectures.
* **UNetLoader**: diffusion model weights only, for split pipelines.
* **CLIPLoader**: text encoder only, for split pipelines and multi encoder
stacks.
* **VAELoader**: VAE only, for decode and encode stages in split pipelines.
* **LoRALoader**: patches model plus clip with a LoRA at a strength. Chain
several between checkpoint and sampler.
* **ControlNetLoader**: loads a ControlNet model for the apply node.
* **UpscaleModelLoader**: ESRGAN style upscalers for the model upscale path.
* **GLIGENLoader**: grounding boxes model for layout controlled generation.

## Conditioning

* **CLIPTextEncode**: prompt text plus clip to conditioning. One instance per
prompt role (positive, negative).
* **ConditioningCombine** and **ConditioningConcat**: merge two
conditionings with strength control.
* **ConditioningSetArea**: region scoped prompt with coordinates and
strength for composition control.
* **ControlNetApply**: conditioning plus control image plus ControlNet model
to guided conditioning, with strength.
* **GLIGENTextBoxApply**: box grounded phrase conditioning.

## Sampling

* **KSampler**: model plus conditioning plus latent to sampled latent. Steps,
CFG, sampler name, scheduler, denoise, seed. The workhorse.
* **KSamplerAdvanced**: adds start and end step ranges plus return with
leftover noise for multi stage refinement.
* **SamplerCustom**: explicit sampler plus scheduler plus guider wiring for
advanced control.

## Latent

* **EmptyLatentImage**: width plus height plus batch size to blank latent.
* **LatentUpscale**: latent resize with method, for latent upscale chains.
* **VAEEncode**: pixels plus vae to latent. Starts img2img and inpaint.
* **VAEDecode**: latent plus vae to pixels. Ends every image path.
* **VAEDecodeTiled** and **VAEEncodeTiled**: tiled variants for huge images
on small VRAM.
* **SetLatentNoiseMask**: latent plus mask to masked latent for inpainting.
* **LatentComposite** and **LatentCompositeMasked**: paste and masked paste
for region workflows.

## Image I/O and Transform

* **LoadImage**: server side file to image plus mask outputs.
* **SaveImage**: image to disk with filename prefix. Mandatory output.
* **PreviewImage**: shows without saving. Never the only output.
* **ImageScale** and **ImageScaleBy**: resize with method and rounding.
* **ImageUpscaleWithModel**: image plus upscale model to enlarged image.
* **ImageComposite**: source over destination with position, for collage and
repair.
* **ImageBatch**: stack images for batch samplers.
* **ImageInvert**, **ImageBlur**, **ImageCrop**: utility transforms.

## Mask

* **LoadImageMask**: mask channel from an uploaded file.
* **SolidMask**: constant value mask at resolution for full frame control.
* **GrowMaskWithBlur**: expand plus feather to hide inpaint seams.
* **MaskComposite**: combine masks with operations.

## Video

* **LoadVideo**: server side video to image batch plus audio plus metadata.
* **SaveVideo**: image batch to encoded video with format and quality.
* Frame counts multiply VRAM: batch and window long clips.

## Audio

* **LoadAudio** and **SaveAudio**: audio file I/O for generative audio
chains. Model nodes vary by pack; discover per server.

## Utilities

* **PrimitiveNode**: typed constants for reroute friendly graphs.
* **Reroute**: passthrough for clean layout.
* **Note**: documentation text inside the canvas.

## Samplers and Schedulers

Common sampler names: `euler`, `euler_ancestral`, `heun`, `dpm_2`,
`dpm_2_ancestral`, `lms`, `dpm_fast`, `dpm_adaptive`, `dpmpp_2s_ancestral`,
`dpmpp_sde`, `dpmpp_2m`, `ddim`, `uni_pc`, `lcm`. Common schedulers:
`normal`, `karras`, `exponential`, `sgm_uniform`, `simple`, `ddim_uniform`.
Availability depends on the sampler node; confirm via `/object_info`
before pinning names in a graph.
