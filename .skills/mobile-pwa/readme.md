# Mobile PWA

**Version:** 1

**Target:** `.skills/mobile-pwa`

**Category:** Frontend & UI Design

**Keywords:** `pwa`, `progressive-web-app`, `installable`, `add-to-home-screen`, `service-worker`, `web-manifest`, `offline-shell`, `mobile`, `ios`, `android`

## Description
Turns a browser web app into an installable mobile PWA with standalone display, home screen icon, themed splash, offline app shell, and a guided install flow across Vite React Vue Svelte, Next.js, Nuxt, SvelteKit, and Angular projects.

## Capabilities & Use Cases
* Emits a production grade web manifest with identity, standalone display plus minimal UI fallback, orientation, theme colors, categories, and full icon coverage in 192px and 512px PNG (`any` and `maskable`) plus an SVG fallback.
* Generates install icon sets from an SVG master with maskable safe zone discipline, catching the padding violations that silently block installability.
* Ships a versioned service worker with cache first static asset strategy, network first API strategy, and take over on update semantics, registered in production secure contexts only.
* Wires HTML head metadata and server header requirements (manifest content type, no cache worker delivery) for every supported stack.
* Provides pure unit testable platform detection helpers covering iPhone, Android, iPadOS, and desktop, with iPadOS touch point handling.
* Implements the deferred install prompt flow with reactive state plus an iOS specific Share then Add to Home Screen instruction path, since iOS fires no prompt event.
* Maps framework specific integration paths for Vite SPA, Next.js, Nuxt, SvelteKit, Angular, and static builds, with exact tooling pinned in the skill `package.json`.
* Enforces a full verification gate (fresh profile production build, manifest clean, worker registered, offline shell loads, Android sheet fires, iOS manual path documented) before work is called done.

## Usage
An agent activates this skill when the user asks for installable, add to home screen, standalone, or offline shell behavior. Collect the app identity inputs first (name, short name, description, brand colors, icon source, offline routes), follow the framework matrix in `SKILL.md`, then run every verification step. Read the Limitations section below before promising store like behavior.

## Limitations
* iOS fires no install prompt event: installation is always manual via Share then Add to Home Screen, and the skill renders instruction UI instead of a system sheet. No third party browser on iOS can install; Safari is the only path.
* Push notifications are out of scope for this skill. Installed home screen apps on recent iOS releases can receive web push, but browser tabs cannot, and permission plus installation gating make it a separate workstream.
* No app store presence: this skill produces an installable web app, not a store listing or a natively wrapped binary. Store distribution needs a wrapper approach, which is explicitly excluded.
* Offline covers the cached app shell only by default: networked data, auth sessions, and media streams still require connectivity unless explicitly added to runtime caching.
* Secure context required: production installs need HTTPS or localhost. LAN IP HTTP keeps install prompts working in some Chromium builds, but secure context features degrade, so clipboard and credential flows need fallbacks.
* Installed web apps run inside OS browser storage partitions: cached data can be evicted under storage pressure, and there is no cross origin scope escape, so the app id, start URL, and scope must stay same origin.
* Desktop install prompts differ from mobile flows: verify mobile (Android sheet, iOS manual path) separately rather than assuming desktop success transfers.
* Service worker updates strand open tabs until takeover logic runs: always ship versioned caches with take over semantics and never register workers in dev builds.

## Changelog
* **v1** : Initial release with manifest, icon, service worker, platform detection, install prompt, verification, and limitation coverage across Vite, Next.js, Nuxt, SvelteKit, and Angular targets
