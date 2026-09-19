# Docker Engine

**Version:** 2
**Target:** `.skills/docker`
**Category:** DevOps & Infrastructure
**Keywords:** `docker`, `container-engine`, `ephemeral-swapper`, `in-place-updates`, `zero-downtime`, `buildkit`, `multi-stage-builds`, `distroless`, `sidecar-diagnostics`, `image-optimization`

## Description
Comprehensive container engineering arsenal featuring the Ephemeral Swapper Protocol for in-place zero-downtime updates, BuildKit cache optimization, and sidecar diagnostic injection.

## Capabilities & Use Cases
* Implements the Ephemeral Swapper Protocol to resolve the container self-destruction paradox and port collision dilemmas for seamless, dependency-free in-place self-updates.
* Features a multi-tier capability detection model automatically routing between direct engine sockets, persistent host trigger files, and out-of-band instruction fallbacks.
* Guarantees persistent storage and configuration preservation across container updates by synthesizing volume binds and replicating service composition labels.
* Accelerates multi-stage build pipelines with advanced BuildKit cache mounts (`--mount=type=cache`), secret mounts, and declarative multi-architecture compilation matrices.
* Enforces minimal attack surfaces and tiny footprint runtime deployments through distroless base images and scratch compilation patterns.
* Provides non-invasive container diagnostics and troubleshooting by injecting ephemeral sidecars directly into target network and process namespaces without polluting production images.
* Implements automated dangling image garbage collection and disk storage hygiene policies to prevent host exhaustion on long-running edge nodes.
* Bundles standalone, dependency-free Python and shell automation routines for direct execution across heterogeneous Linux and Windows host environments.

## Usage
Activate this skill whenever designing, building, optimizing, or automating containerized applications, implementing in-place self-updating container architectures, or configuring high-performance Docker build workflows.

## Changelog
* **v2** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v1** : Initial release featuring the Ephemeral Swapper Protocol, multi-tier capability detection, BuildKit cache mounts, distroless patterns, and sidecar diagnostic injection
