# Operations

Server lifecycle, custom nodes, queue discipline, and the troubleshooting
matrix. Read this before touching a production install.

## Launch Flags

* `--port 8188`: API and UI port. Change per instance in fleets.
* `--listen 127.0.0.1`: bind address. Loopback for local, explicit LAN IP
behind auth for shared rigs. Never `0.0.0.0` without a proxy.
* `--enable-cors-header`: allow browser origins for remote UIs and web
frontends calling the API.
* `--preview-method auto`: live preview transport; `none` saves cycles on
headless workers.
* `--lowvram`, `--normalvram`, `--highvram`: memory strategies per GPU tier.
* `--cache-lru`: model cache size for multi model servers.
* `--disable-smart-memory`: escape hatch when the memory manager misbehaves.

## Custom Nodes

* Install through the node manager UI or a pinned git checkout into
`custom_nodes`, then restart the server. No restart, no nodes.
* Snapshot the node set (folder list plus commit hashes) before fleet wide
changes. Roll back by restoring the snapshot.
* Red nodes mean missing classes: identify the pack from the class name,
install, restart, revalidate the graph.
* Keep production packs pinned. Floating checkouts drift between runs and
break reproduction.
* Audit new packs before installing on shared hardware: nodes execute
arbitrary code with server privileges.

## Queue Discipline

* Inspect running and pending jobs before queueing heavy work.
* Clear stale pending jobs; delete by id when selective.
* Interrupt runaways instead of waiting them out.
* One client id per agent session keeps ownership traceable.
* Batch during off hours on shared rigs; state the job count up front.

## VRAM Operations

* Unload models when switching families; free cached memory between large
batches.
* Out of memory triage, in order: shrink batch, shrink resolution, enable a
lower VRAM flag, tile VAE and sampling, split video into windows, then
redesign the graph. Retry once between steps, never blind loop.
* Watch the high water mark in `/system_stats` during first runs of a new
pattern.

## Multi Server Routing

* Register each server with id, URL, VRAM, and role (explore, hero, video).
* Route by fit: exploration to small fast rigs, finals to big VRAM, video
to high memory workers.
* Check queue depth before placing batches; a deep queue beats a fast GPU.
* Keep model sets aligned across a fleet or tag graphs with required
weights so routing skips unfit servers.

## Troubleshooting Matrix

* **Red or missing node:** class absent. Install the pack, restart,
revalidate.
* **Model not found:** filename mismatch or wrong folder. List folders,
correct the name.
* **Out of memory:** follow VRAM triage above. Halve batch first.
* **Black images:** NaN in VAE or fp16 overflow. Switch VAE precision or
weights, lower CFG, change seed.
* **Empty output:** graph lacks a save node, or the save node wires to a
dead branch. Validate and trace the output path.
* **401 or forbidden:** credentials missing or wrong on a protected server.
Fix auth, never disable it.
* **CORS blocked:** browser calling a remote API without the CORS header
flag. Enable the flag or proxy same origin.
* **WebSocket stalls:** reconnect with the same client id, then fall back
to history polling.
* **Slow first run:** model load plus compile. Warm up before timing.
* **Drift between runs:** floating node versions, unpinned weights, or
randomized seeds. Pin all three.

## Safety

* Localhost bind by default. Remote access rides SSH tunnels or authed
reverse proxies.
* Secrets live in `.env` and server side config, never in workflow JSON,
filenames, or chat.
* Uploaded media and generated outputs are user data: run folders stay
local, nothing exfiltrates without instruction.
* Refuse non consensual likeness edits of real private people and any
fraud, phishing, or disinformation artifact.
