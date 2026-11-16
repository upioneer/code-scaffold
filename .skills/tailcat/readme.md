# Tailcat

**Version:** 1

**Target:** `.skills/tailcat`

**Category:** DevOps & Infrastructure

**Keywords:** `tailcat`, `tailscale`, `port-forward`, `reverse-tunnel`, `ngrok-alternative`, `wireguard-tunnel`, `sftp-share`, `remote-ssh`, `socks-proxy`, `exit-node`, `derp-relay`, `p2p-tunnel`, `file-dropbox`, `zero-trust-share`, `secure-share`

## Description
Agent operator for Tailcat peer to peer tunnels: serves apps and ports, pipes bytes, moves files, opens shells, routes SOCKS and exit nodes, and manages identities, all without accounts, firewalls, or a control plane.

## Capabilities & Use Cases
* **Private App Sharing** : Exposes local ports with ephemeral tokens and one step browser forwarding for demos and support sessions
* **Multi Service Forwarding** : Maps several remote ports at once with pinned or automatic local listeners
* **Byte Pipes and Raw TCP** : One shot stdin stdout streams plus listener free raw connections for fixtures and debugging
* **File Drops and Shares** : Write only drop boxes, read only directory offers, and read write two way shares with explicit modes
* **Remote Shells** : Forwarded daemon SSH with existing auth, built-in keyed SSH with SFTP, and fenced disposable access
* **Forced Commands** : Single operation servers replacing shells for scoped automation identities
* **SOCKS and Exit Nodes** : Per command proxies, standalone listeners, token hostnames, and far LAN reach with UDP support
* **Identity Lifecycle** : Ephemeral defaults, named saved keys, client allowlists, fixed regions, and DNS TXT publishing with safety probes
* **Automation Hooks** : JSON address output, file and TCP handoff, self contained resolved addresses, and offline parsing
* **Relay Operations** : Default bootstrap relays, direct path gating, private DERP fleets with custom maps
* **Throughput Diagnostics** : Relay versus direct ping probes plus iperf style perf tests with JSON results
* **Interactive Recipe Builder Sandbox** : Goal picker generating exact server plus client command pairs with live fields and trust banners
* **Threat Model Enforcement** : Token secrecy, least privilege serving, DNS exposure rules, and powerful mode consent gates

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v1** : Initial release with CLI reference, recipes, security model, operations manual, Go library orientation, recipe script, and interactive builder sandbox
