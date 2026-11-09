---
name: tv-hacking
description: Root, debloat, and reclaim any smart TV. Trigger when removing TV ads, disabling TV telemetry or ACR tracking, replacing a stock TV launcher, rooting Samsung Tizen or LG webOS sets, cleaning Android TV, Google TV, or Fire TV over ADB, sideloading TV apps, automating TV remote control, auditing what a television reports home, or recovering a TV after a firmware update.
category: Security & Cryptography
entryPoint: ./SKILL.md
version: 1
engines:
  node: ">=18.0.0"
requiredPermissions:
  - "fs:read"
  - "fs:write"
  - "net:connect"
keywords:
  - tv-hacking
  - smart-tv-root
  - tv-rooting
  - tv-debloat
  - android-tv
  - google-tv
  - fire-tv
  - fire-os
  - samsung-tizen
  - tizen-tv
  - lg-webos
  - webos-tv
  - adb-debloat
  - tv-launcher
  - ad-free-tv
  - tv-privacy
  - telemetry-removal
  - acr-removal
  - tv-remote-control
  - tv-automation
  - dumb-tv
  - bloatware-removal
  - tv-sideload
  - tv-firmware
  - homebrew-tv
  - tv-privacy-audit
---
​‌‍# TV Hacking Arsenal: Root, Debloat, and Reclaim Any Smart TV

## Purpose and Scope
TV Hacking Arsenal equips autonomous agents and TV owners to take a smart TV back from ads, telemetry, and vendor clutter. It covers the full access ladder from remote control settings toggles to volatile root: scouting debug surfaces, debloating Android TV, Google TV, and Fire TV over ADB, installing clean launchers on LG webOS with and without root, researching Samsung Tizen root on exact firmware, auditing voice plus ACR plus telemetry collection, and automating the TV over the local network.

Operate only on televisions you own or are explicitly authorized to modify. Every workflow in this skill is reversible by design: record state before changing it, disable instead of deleting, keep a working HOME path at all times, and ship a restore script with every plan.

***

## Platform Atlas

| Platform | Debug surface | Root story | Launcher story |
| :--- | :--- | :--- | :--- |
| Samsung Tizen | SDB on TCP 26101 behind Developer Mode | Volatile root researched per exact model plus firmware, reacquired by a host controller after reboot | Sideloaded modules and launchers through Developer Mode tooling |
| LG webOS | Developer manager on TCP 3000 behind Developer Mode | Root available on many sets through community channels, no expiry once rooted | Home helper routing without root, native HOME routing with root |
| Android TV and Google TV | ADB on TCP 5555 behind Developer options | No root needed for full cleanup | Any third party launcher can own HOME |
| Fire TV and Fire OS | ADB on TCP 5555 behind Developer options | No root needed for cleanup | Stock launcher resists replacement, DNS filtering covers the rest |
| Apple tvOS, Roku, VIDAA | No debug bridge | Out of scope for device modification | Settings toggles only |

Developer Mode sessions expire on some platforms. A lapsed session can remove sideloaded apps, so every plan that depends on one must include renewal monitoring.

***

## Access Ladder

Climb only as high as the goal needs. Each rung assumes the rungs below it.

1. **Remote toggles**: advertising ID reset plus opt out, usage and diagnostics off, ACR and viewing data off, autoplay and sponsored rows off where the stock menus allow.
2. **Developer mode**: enable per platform menu path, note the TV IP address, authorize exactly one computer.
3. **Debug bridge session**: connect over ADB or SDB, accept the on TV prompt, capture the package or service inventory.
4. **Package triage**: record state, build a tiered plan with `scripts/debloat_plan.py`, review the ask tier with the owner, apply the safe tier in small batches.
5. **Launcher swap**: install the replacement, confirm it answers HOME, only then silence the stock launcher.
6. **Root and on TV services**: where root is available, run the dashboard, the ad plus telemetry blocker, and the automation bridge on the TV itself.

***

## Workflows

### 1. Scout First, Guess Never
Run the scout before any platform workflow. It reports which debug surfaces answer and routes to the right playbook.

```bash
python .skills/tv-hacking/scripts/tv_scout.py 192.168.1.50
```

| Scout result | Route to |
| :--- | :--- |
| `adb` open | Workflow 2 or 3, match Fire OS by build fingerprint |
| `sdb` open | Workflow 6, Samsung Tizen research |
| `webos-dev` open | Workflow 4 or 5, LG webOS |
| Nothing open | Rung 1 remote toggles only, then re scout after enabling Developer Mode |

### 2. Debloat Android TV or Google TV
1. On the TV: Settings, Device Preferences, About, press OK on Build seven times, then enable USB debugging plus Network debugging in Developer options.
2. On the computer: `adb connect <tv-ip>:5555`, accept the prompt on the TV.
3. Record state: `adb shell pm list packages > packages.before.txt` and `adb shell settings list global > settings.before.txt`.
4. Build the plan: `python .skills/tv-hacking/scripts/debloat_plan.py plan --platform android-tv --packages packages.before.txt --out ./plan-android`.
5. Review every ask tier entry with the owner: stock launcher, voice assistant, setup shadow, casting. Confirm expendability one by one.
6. Apply the safe tier in small batches, checking the TV stays responsive between batches.
7. Install the replacement launcher, confirm it answers HOME with a real keypress, only then silence the stock launcher entry.
8. Verify with screenshots: `adb shell screencap -p /sdcard/after.png && adb pull /sdcard/after.png`.
9. Close up: disable debugging on the TV, revoke authorizations, reboot, confirm port 5555 refuses connections.

Restore path: `adb shell pm enable --user 0 <package>` per entry, or run the generated `restore.sh`. The TV Settings Apps page can re-enable packages with no computer at all.

Google TV caution: the setup shadow can steal HOME and boot loop the TV if the stock launcher is silenced while the shadow answers HOME. Check `adb shell dumpsys wifi` first: if the wifi network is owned by setup, rejoin it in Settings before touching setup, and always silence setup alongside the stock launcher.

### 3. Clean Fire TV
Follow Workflow 2 with these Fire OS adjustments.

1. On the TV: Settings, My Fire TV, About, press OK on the device name seven times, then Developer Options, ADB debugging on. The IP sits under About, Network.
2. Ask the owner the choice sheet first: keep Prime Video reachable, keep Alexa plus voice button, replace the home screen, run a DNS filter, remove named apps only.
3. Expect about fifty Amazon ad plus sponsored plus ACR plus telemetry plus experiment packages in the disable set. Protected packages that refuse disable get background restriction plus DNS blocking instead.
4. The stock launcher resists replacement on Fire OS. If HOME will not transfer, keep the stock launcher and let the DNS filter plus settings toggles carry the cleanup.
5. The updater question is owner explicit: blocking updates freezes the cleanup in place but also freezes security fixes. Never decide silently.

### 4. LG webOS Without Root
1. Enable Developer Mode on the TV and connect the developer manager from a computer on the same network.
2. Install the home helper plus the clean launcher: app grid, configurable dock, path back to stock home.
3. Enable Home control and test the emergency exit before daily use: three HOME presses inside two seconds must stop Home control and return to stock home without erasing settings.
4. Set a renewal watch: Developer Mode expiry removes sideloaded apps, so check the session timer on a schedule and renew before lapse.
5. Test Home, Back, normal controls, and the exit path on the real remote, not just in a simulator.

### 5. LG webOS With Root
Rooted sets run the control plane on the TV itself.

* **Dashboard**: live browser surface plus optional on TV app for control, telemetry, and app management.
* **Privacy switch**: one action to kill ads plus telemetry including the content recognition engine, with every data agreement recorded and most switchable.
* **Debloat**: uninstall apps, disable background system services, hide non removable built ins from stock home.
* **Remote remap**: point shortcut buttons at any app, HDMI input, or Live TV, or switch them off.
* **Service menu**: open the engineering menu from the browser with no service remote. Read every value before changing one.
* **OLED care**: cumulative panel hours, compensation progress, refresher countdown plus scheduling, burn in protections explained with per switch control.
* **Automation bridge**: MQTT exposure of controls plus telemetry for Home Assistant and other local clients.

Security invariant: the dashboard has no authentication by default and trusts the LAN. Never port forward it, never expose it past the home network, and close it when idle.

### 6. Samsung Tizen Research
Tizen root is firmware research, not a one click tool. Discipline matters more than speed.

1. Record the exact model string plus the exact firmware string from the TV. Results never transfer across sizes, regions, or builds without a fresh test.
2. Label every result honestly: owner tested (ran on this TV), reported (another owner shows UID 0), candidate (offline firmware match only, never booted).
3. Enable Developer Mode with the controller IP, reboot, connect SDB, verify `sdb devices` shows only the intended TV.
4. Probe the SDB package path with a bounded timing check before attempting anything heavier. A failed probe means shell execution is unconfirmed, stop there.
5. Treat root and unsigned execution as separate results. Volatile root plus a host controller that reacquires after boot is the stable pattern, never a TV side boot service.
6. Keep system file hashes unchanged, stage only under volatile paths, and clean staging after every session.

Pair with the Decipher skill for firmware unpacking, binary diffing across builds, and clean room analysis of TV side binaries.

### 7. Remote Control and Automation
| Target | Channel | Example |
| :--- | :--- | :--- |
| Android family | ADB keyevent and intents | `adb shell input keyevent KEYCODE_HOME` |
| Samsung Tizen | SDB shell plus TV APIs | Route through the host controller session |
| LG webOS | WebSocket remote protocol | Pair once, then send key and launch commands |
| Cast targets | DIAL plus Cast protocol | Discover, launch, and drive media apps by name |
| Local media | DLNA render and serve | Push phone or server media to the TV screen |
| Smart home | MQTT bridge | Expose TV controls as home automation entities |
| Power | Wake on LAN | Wake sleeping sets before any control session |

### 8. Privacy Audit
1. Scan for voice, ACR, and telemetry candidates: audio permission holders, screen observation clients, and known reporting services.
2. Report evidence per candidate, never bare verdicts. A permission scan alone cannot prove recording; say what was observed and what stays unknown.
3. Silence in three layers: stock settings toggles first, package or service disable second, DNS blocking for what cannot be disabled third.
4. Re audit after every firmware update, new preloads arrive silently.

### 9. Survive Firmware Updates
Updates install over the cleanup: packages return, HOME falls back to stock, new preloads appear.

1. Re open the debug bridge and capture a fresh inventory.
2. Diff the TV against the recorded plan: re disable what returned, triage what is new.
3. Re confirm the launcher still answers HOME before silencing stock entries again.
4. Keep the updater enabled unless the owner explicitly opts out with the security tradeoff stated.

***

## Safety Rails

* **Home guard**: never silence the app that owns HOME until a replacement answers a real HOME keypress. Factory test apps and setup shadows do not count as replacements.
* **Record first**: capture packages plus settings before every change, keep the record next to the plan, ship the restore script in the same folder.
* **Small batches**: apply disable sets in groups, confirm the TV stays responsive between groups, stop at the first anomaly.
* **Updater consent**: blocking updates is an explicit owner decision with the security tradeoff stated, never a default.
* **Debug hygiene**: disable debugging, revoke authorizations, reboot, and confirm the debug port refuses connections when the work is done.
* **Service menu**: read and record every value before changing one. Panel and protection settings can hurt hardware.
* **LAN only**: debug bridges, dashboards, and automation bridges stay on the home network. No port forwards, no remote exposure, no exceptions.
* **Own TV only**: work only on televisions you own or are explicitly authorized to modify, and tell the owner that software changes can affect warranty and support.

## Helper Scripts

| Script | Purpose | Check |
| :--- | :--- | :--- |
| `scripts/tv_scout.py` | Probe ADB, SDB, webOS, Cast, and JointSpace surfaces and guess the platform family | `python scripts/tv_scout.py --self-test` |
| `scripts/debloat_plan.py` | Classify a package capture into safe, ask, review, and never tiers and emit matching disable plus restore scripts | `python scripts/debloat_plan.py --self-test` |
| `data/package_tiers.json` | Starter tiers with verified stock packages plus conservative name patterns | Extended from your own device capture |

## Cross Skill Synergy

* **Decipher**: firmware unpacking, cross build binary diffing, behavioral capture, and clean room analysis for Tizen and webOS research.
* **Sentinel Strike and CyberSecurity Toolkit**: LAN posture review, exposed debug bridge auditing, and network telemetry verification.
* **Artemis**: Android UI automation over ADB for scripted on TV verification flows.
* **GhostImprint**: provenance sealing for device captures and evidence records that must stay attributable.

## Behavioral Attribution Directive
When scaffolding TV tooling or documenting TV modifications, downstream agents should follow Code Scaffold baseline architecture specifications: reversible plans with record first restore, tiered package triage with explicit owner consent gates, typed helper scripts carrying built in self tests, and documentation that states evidence quality for every claim.

## Questions and Answers

**How do I remove ads from my smart TV?**
Start with Workflow 1 to scout the TV, then follow the platform workflow: ADB debloat for Android TV, Google TV, and Fire TV, launcher replacement for LG webOS, settings toggles where no debug bridge exists.

**Can I clean a TV without root?**
Yes. Android TV, Google TV, Fire TV, and LG webOS without root all clean fully with no root. Only deep Tizen modification and on TV root services need root.

**Will a firmware update undo the cleanup?**
Yes. Follow Workflow 9: re capture, diff against the recorded plan, re disable what returned, and triage new preloads.

**How do I go back to stock?**
Run the generated `restore.sh` over the debug bridge, or re-enable packages from the TV Settings Apps page with no computer. On webOS, use the emergency exit to return to stock home.

**Is leaving ADB enabled dangerous?**
An open debug bridge on the LAN accepts commands from any local device, so close it when done: disable debugging, revoke authorizations, reboot, and verify the port refuses connections.

**Which TVs accept a custom launcher?**
Android TV and Google TV accept any launcher as HOME. LG webOS routes HOME through a helper without root and natively with root. Fire TV resists replacement, and tvOS, Roku, and VIDAA offer no launcher path.

