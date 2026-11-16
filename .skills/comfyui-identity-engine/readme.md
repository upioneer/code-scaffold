# ComfyUI Identity Engine

**Version:** 2

**Target:** `.skills/comfyui-identity-engine`

**Category:** AI, MCP & Developer Tools

**Keywords:** `comfyui-identity-engine`, `character-consistency`, `voice-consistency`, `anti-drift`, `pulid`, `ip-adapter`, `lora-character`, `arcface-qa`, `rvc-voice`, `tts-pipeline`, `multi-angle`, `canon-pack`, `lip-sync`, `comic-pipeline`, `music-video`

## Description
Zero drift character system for ComfyUI: immutable visual and acoustic canon packs, star topology routing, angle matched identity injection, RVC voice clamping, and measured face, wardrobe, and voice QA gates for comics, videos, podcasts, and animation.

## Capabilities & Use Cases
* **Character Manifest Canon** : Single source of truth locking identity tokens, wardrobe presets, 14 visual views, voice matrix, model weights, and QA baselines per character
* **14-View Visual Factory** : Master portrait lock, A-pose plus T-pose rig sheet, 8 azimuth turnarounds, 4 elevation extremes, slicing plus matting plus optional 3D mesh depth pass
* **Dynamic Angle Routing** : Closest anchor selection per shot with face node gating that disables identity locks on backside views to prevent Janus artifacts
* **Star Topology Enforcement** : Every asset references Generation 0 canon or trained LoRAs only, never chained outputs, killing recursive drift
* **5-State Voice Bible** : Neutral, projected, whisper, urgent, and melodic locked WAVs with transcripts plus RVC formant clamping and broadcast mastering chain
* **Comic Execution Mode** : Regional masked conditioning per character with a global style lock shared across the page
* **Music Video Execution Mode** : Stem separation, beat synced cuts, and lip synced vocal keyframes
* **Podcast Execution Mode** : Locked multi-camera setups, independent per speaker synthesis, natural turn gaps, active mask lip-sync with idle listener loops
* **Animation Execution Mode** : Verified start plus end keyframes with dual-keyframe interpolation and boundary identity restoration
* **Measured QA Gates** : ArcFace face verdicts with repair and reject paths, CLIP wardrobe checks, and speaker embedding voice gates with prescribed recoveries
* **Deterministic Contracts** : Strict JSON schemas for manifests and shot requests plus parameterized API graph templates
* **Routing Lab Sandbox** : Interactive yaw and pitch router with live anchor selection plus QA threshold verdict preview

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Removed the Safety guardrail section and consent capability per owner direction
* **v1** : Initial release with identity doctrine, manifest plus shot schemas, 4 API graph templates, canon builder plus drift validator plus router scripts, and routing lab sandbox
