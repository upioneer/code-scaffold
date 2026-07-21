# Code Scaffold v7.3.1

## Changelog
* **skills-cli (Patch):** Fixed a bug where `skills-cli` failed to clear its temporary `_tmp` directory before invoking `git clone`, causing subsequent clones to crash for agents.
* **NPM Pipeline (Patch):** Rewrote the `.github/workflows/publish-npm.yml` pipeline to explicitly check the NPM registry before publishing. This gracefully skips the deployment with a green checkmark if the version hasn't changed, preventing arbitrary failures on non-CLI related releases.

## Automated TUI Captures
![Demo GIF](demo.gif)
![Demo Splash](demo_splash.png)
![Demo Main](demo_main.png)
![Demo Final](demo_final.png)
