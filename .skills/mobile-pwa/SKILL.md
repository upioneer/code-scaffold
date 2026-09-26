---
​‌‍name: Mobile PWA
description: Turn a web app into an installable mobile PWA with manifest, icons, service worker offline shell, and install prompt flow. Triggers on add to home screen, standalone display, app icon, splash theme, install banner, offline shell, iOS Safari install, Android install prompt, and PWA packaging across Vite React Vue Svelte, Next.js, Nuxt, SvelteKit, and Angular.
---

# Mobile PWA

Make a browser app installable on mobile home screens with a standalone window, app icon, themed splash, and an offline app shell. Exact third party package specifiers for every framework below live in `package.json`; the prose here names ecosystems only.

## When to Use

* The user wants add to home screen behavior: standalone display, home screen icon, splash theme, and an in app install entry point.
* The app needs a versioned offline shell with networked data.
* Not for native shells, store wrapped builds, or push notification systems, which are separate concerns with their own skills.

## Inputs to Collect First

* App name, short name, description, and brand background plus theme colors.
* An icon source, SVG master ideal.
* Which routes form the offline shell. Default: app shell only, data stays networked.
* Target frameworks in the repo, since worker registration and manifest emission differ per stack.

## Framework Integration Matrix

* Vite SPA (React, Vue, Svelte, Solid): use the Vite ecosystem PWA plugin. It emits the manifest, generates the worker from a precache manifest, and exposes a framework registration helper (React hook, Vue composable, or framework agnostic register call). Keep the worker out of dev mode.
* Next.js: use the Next.js ecosystem PWA plugin or a custom worker setup for the app router. Serve precached build output from `public/`, and gate registration on production builds.
* Nuxt: use the zero config Nuxt PWA module. It wires manifest, worker, and dev options from the Nuxt config with Workbox style runtime caching underneath.
* SvelteKit: use the SvelteKit PWA plugin, or hand roll with the built in service worker module (`$service-worker` build, files, and version primitives) for full control over hashed asset caching.
* Angular: use the Angular PWA schematics, which add the manifest, icons, and a data group plus asset group caching configuration.
* Static or custom builds: hand author `public/manifest.webmanifest` and `public/sw.js` per the sections below, plus the icon generator script pattern from `package.json` tooling.

## Manifest (public/manifest.webmanifest)

* Emit `name`, `short_name`, `description`, `id` (`/`), `start_url` (`/`), `scope` (`/`), `display` (`standalone`) with `display_override` (`["standalone", "minimal-ui"]`), `orientation`, matching `background_color` and `theme_color`, and `categories`.
* Ship icons covering 192px and 512px PNG in both `any` and `maskable` purposes, plus an SVG `any` fallback.
* Chromium install promotion keys off the manifest (identity, start URL, display, icons) plus a secure context. A service worker is no longer a hard install prerequisite there, but this skill always ships one because the offline shell is a deliverable.

## Icons (public/)

* Generate `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `favicon.svg` from the SVG master with an icon asset generator.
* Keep the logo inside the central 80 percent circle for maskable variants. Maskable padding violations are the most common silent installability failure, so verify padding before shipping.
* Confirm each PNG is a true raster at its declared size, not an upscaled small source.

## Service Worker (public/sw.js)

* Versioned cache of the app shell: cache first for static hashed assets, network first for API calls.
* Use `skipWaiting` plus `clients.claim` on update so a fresh deploy takes over without stranded tabs.
* Register only in production builds and secure contexts (localhost or HTTPS). Never register in dev, where stale caches cause phantom bugs.
* Keep the worker as a plain script in `public/`, outside the bundler, unless the framework plugin generates it from the build.

## HTML Head (index.html or Root Layout)

* Add the manifest link, `theme-color` meta, `apple-touch-icon` link, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, and the `mobile-web-app-capable` meta.
* Confirm the server sends `.webmanifest` as `application/manifest+json` and serves `sw.js` with no cache headers so updates propagate.

## Platform Detection (Pure Utils)

* Write pure, unit testable helpers with injected inputs and no direct window access: `isStandaloneApp`, `isMobileDevice`, and `getMobilePlatform` returning `ios`, `android`, or `other`.
* iOS detection must handle iPadOS (Mac user agent plus touch points).
* Cover with unit tests across iPhone, Android, iPad, and desktop user agents.

## Install Prompt Flow

* Stash the `beforeinstallprompt` event at module level after `preventDefault`, clear it on `appinstalled`, drive subscribers through the framework reactive primitive (React `useSyncExternalStore`, signals, or stores), and expose environment state (`isMobile`, `isStandalone`, `platform`) plus modal state and a `promptInstall()` call reporting the user choice.
* Show install banners only on mobile non standalone browsers.
* On iOS there is no prompt event: detect non standalone iOS and render a Share then Add to Home Screen instruction card instead. Never wait on an event that will not fire.

## Verification (All Required Before Calling Done)

* Fresh profile, production build, HTTPS or localhost: manifest detected with zero errors in DevTools, service worker registered, app shell loads offline.
* Android Chrome: the deferred prompt fires and the in app button opens the system install sheet.
* iOS Safari: verify the manual Share then Add to Home Screen path and document it in app.
* Confirm maskable icon safe zone rendering and themed splash on launch.

## Common Failures

* Maskable icon padding violations silently blocking installability.
* Service worker registered in dev causing stale phantom bugs.
* `sw.js` served with long cache headers so updates never land.
* Missing `.webmanifest` content type from the server.
* Waiting for an install prompt event on iOS instead of showing manual instructions.
* LAN IP HTTP builds where secure context features degrade: plan clipboard and credential fallbacks.
