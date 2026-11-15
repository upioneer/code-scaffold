# ComfyUI API Reference

Base URL defaults to `http://127.0.0.1:8188`. Every call below is plain
HTTP unless marked WebSocket. Keep one `client_id` (uuid string) per agent
session and reuse it across calls so queue ownership stays traceable.

## REST Endpoints

### Server

* `GET /system_stats`: VRAM and RAM totals plus free amounts, backend device,
pytorch version. Call first in every session.
* `GET /object_info`: full node registry with input specs, output types, and
model folder enums. Large payload; cache per server version.
* `GET /object_info/<ClassName>`: schema for one node class. Use before
wiring unfamiliar nodes.
* `GET /embeddings`: embedding filenames the server sees.

### Queue and History

* `POST /prompt`: queue a graph. Body: `{"prompt": {<api graph>},
"client_id": "<uuid>", "extra_data": {"extra_pnginfo": {"workflow": {<ui
graph, optional>}}}}`. Returns `{"prompt_id": ..., "number": ...}`.
* `GET /queue`: running plus pending entries with prompt ids.
* `POST /queue`: manage the queue. Body `{"clear": true}` empties pending;
`{"delete": [ids]}` drops specific entries.
* `POST /interrupt`: stop the currently executing job.
* `GET /history`: completed job records keyed by prompt id.
* `GET /history/<prompt_id>`: outputs for one run (filenames, subfolder,
type per output node).
* `GET /view?filename=<f>&subfolder=<s>&type=<t>`: download one output file.
Type is `output`, `input`, or `temp`.

### Uploads

* `POST /upload/image`: multipart file upload for loader inputs. Returns the
stored name plus subfolder. Reference that name in `LoadImage`.
* `POST /upload/mask`: same for inpainting masks.

### Memory

* `POST /free`: body `{"unload_models": true, "free_memory": true}` to
release VRAM between model switches. Toggle each flag independently.

## WebSocket Protocol

Connect to `/ws?clientId=<uuid>` with the same id used at queue time.
Messages are JSON text frames:

* `status`: queue remaining counts.
* `progress`: `{"value": step, "max": steps, "prompt_id": ...}` per sampler.
* `executing`: current node id plus prompt id, `null` node when finished.
* `executed`: node id plus output payload when a node completes.
* `execution_error`: failing node, exception message, traceback. Map it to
the troubleshooting matrix in `operations.md`.

Polling `/history/<prompt_id>` is an acceptable fallback when sockets are
unavailable. Prefer sockets for long video and batch runs.

## API Format Anatomy

API format is a flat object keyed by node id string. Each node carries
`class_type`, `inputs`, and `_meta`. Links are `[id_string, slot_int]`
pairs pointing at another node output.

```json
{
  "1": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {"ckpt_name": "model.safetensors"},
    "_meta": {"title": "Checkpoint Loader"}
  },
  "2": {
    "class_type": "CLIPTextEncode",
    "inputs": {"text": "a lighthouse at dawn", "clip": ["1", 1]},
    "_meta": {"title": "Positive Prompt"}
  },
  "3": {
    "class_type": "SaveImage",
    "inputs": {"filename_prefix": "run", "images": ["9", 0]},
    "_meta": {"title": "Save Image"}
  }
}
```

Slot order follows the node output list in `/object_info`. Checkpoint
loaders emit model, clip, then vae, so clip is slot 1 and vae is slot 2.

## UI to API Conversion

UI format (`nodes` plus `links` arrays with geometry) is rejected by
`/prompt`. Convert inside ComfyUI through Settings, Dev mode Options, Menu,
Output in API Format, then export. Saving the UI graph alongside the API
graph inside `extra_data.extra_pnginfo.workflow` keeps runs reopenable.

## Input Override Pattern

Iteration never rebuilds the graph. Keep the last queued API JSON, patch the
changed inputs, and POST it as a new prompt:

* Seed sweep: set `KSampler` noise_seed per run.
* Prompt tweak: replace one `CLIPTextEncode` text value.
* Resolution: replace `EmptyLatentImage` width and height.
* Reference swap: replace the loader filename after uploading the new file.
* Strength: replace LoRA or ControlNet strength floats.

`scripts/queue_prompt.py --override NodeId.input=value` applies this
mechanically with JSON typed values. Record graph hash plus overrides per
run so any output reproduces exactly.

## Filename Prefixes

`SaveImage` and siblings accept `filename_prefix` with tokens. Date and
counter tokens keep runs ordered: prefixes like `seriesA/seed42` write into
subfolders. Resolve final filenames from `/history/<prompt_id>` rather than
guessing counters.
