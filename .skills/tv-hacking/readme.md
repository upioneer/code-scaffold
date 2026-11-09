# TV Hacking Arsenal

**Version:** 1

**Target:** `.skills/tv-hacking`

**Category:** Security & Cryptography

**Keywords:** `tv-hacking`, `smart-tv-root`, `tv-rooting`, `tv-debloat`, `android-tv`, `google-tv`, `fire-tv`, `fire-os`, `samsung-tizen`, `tizen-tv`, `lg-webos`, `webos-tv`, `adb-debloat`, `tv-launcher`, `ad-free-tv`, `tv-privacy`, `telemetry-removal`, `acr-removal`, `tv-remote-control`, `tv-automation`, `dumb-tv`, `bloatware-removal`, `tv-sideload`, `tv-firmware`, `homebrew-tv`, `tv-privacy-audit`

## Description
TV Hacking Arsenal is a smart TV liberation engine covering Samsung Tizen, LG webOS, Android TV, Google TV, and Fire TV. It maps every set to the correct access path, removes ads plus telemetry plus bloatware reversibly, installs clean launchers, researches root on exact firmware, and automates the television over the local network.

## Capabilities & Use Cases
* **Nine Guided TV Workflows**: scout first routing, Android TV plus Google TV debloat, Fire TV cleanup, LG webOS launcher paths with and without root, Samsung Tizen firmware research, remote control plus automation, privacy audits, and firmware update recovery.
* **LAN Debug Surface Scout**: probes ADB, SDB, webOS, Cast, and JointSpace ports and guesses the platform family so agents route correctly without guessing.
* **Tiered Reversible Debloat Planner**: classifies package captures into safe, ask, review, and never tiers and emits matching disable plus restore scripts with a protected HOME guard.
* **Ad Plus Telemetry Shutdown**: sponsored rows, ACR screen fingerprinting, voice capture paths, usage reporting, and experiment frameworks silenced across settings, package, and DNS layers.
* **Custom Launcher Routing**: third party home screens on Android TV plus Google TV, home helper control with emergency exit on webOS without root, native HOME routing on rooted webOS.
* **Rooted TV Control Plane**: on TV dashboard, privacy switch, service menu access, OLED panel care, remote button remapping, and MQTT smart home bridging on rooted sets.
* **Tizen Research Discipline**: exact model plus firmware evidence labels (owner tested, reported, candidate), bounded SDB probing, volatile root with host reacquire patterns, and clean staging rules.
* **Universal Remote Automation**: ADB key events, SDB sessions, webOS sockets, DIAL plus Cast launching, DLNA play, MQTT entities, and Wake on LAN power control.
* **Never Brick Safety Rails**: record first restore, small batches, updater consent gates, setup shadow wifi checks, debug hygiene close up, and LAN only exposure invariants.

## Usage
Activate TV Hacking when you need to remove TV ads, silence TV telemetry, replace a TV launcher, research TV root, or automate a television over the local network.

```bash
# Scout a TV for open debug surfaces and route to the right workflow
python .skills/tv-hacking/scripts/tv_scout.py 192.168.1.50

# Capture the package inventory over ADB
adb connect 192.168.1.50:5555
adb shell pm list packages > packages.before.txt

# Build a tiered debloat plan with matching restore script
python .skills/tv-hacking/scripts/debloat_plan.py plan --platform android-tv --packages packages.before.txt --out ./plan-android

# Verify the helper scripts
python .skills/tv-hacking/scripts/tv_scout.py --self-test
python .skills/tv-hacking/scripts/debloat_plan.py --self-test
```

## Changelog
* **v1** : Initial release of the TV Hacking Arsenal: nine guided workflows across Samsung Tizen, LG webOS, Android TV, Google TV, and Fire TV, plus a LAN debug scout, a tiered reversible debloat planner, and never brick safety rails.
