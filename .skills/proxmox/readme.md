# Proxmox VE Container Engineering

**Version:** 3
**Target:** `.skills/proxmox`
**Category:** DevOps
**Keywords:** `proxmox`, `proxmox-ve`, `lxc`, `pct-create`, `whiptail`, `container-provisioning`, `zfs`, `cloud-init`, `vm-template`, `proxmox-backup-server`, `prometheus-pve-exporter`, `homelab`, `cluster-automation`

## Description

The Proxmox VE Container Engineering skill is the complete agent playbook for designing, building, debugging, and operating turnkey Proxmox VE LXC helper scripts and VM templates. It encodes every real-world host, kernel, and minimal container template constraint that causes silent failures in naive implementations, including disk sizing integer requirements, bootstrap isolation, V8 heap management, pipe-safe interactive dialogs, and active health polling.

## Capabilities & Use Cases

* **Two-Tier Script Architecture**: Enforces strict separation between the PVE host orchestrator (`ct/<app>.sh`) and the in-container provisioner (`install/<app>-install.sh`). The orchestrator runs on the hypervisor and handles all cluster interaction; the provisioner runs inside the rootfs and handles all package/runtime/service setup.
* **Host Orchestrator Template**: Canonical pattern with PVE host guard, pipe-safe `stdin` recovery, `whiptail` GUI dialogs with `read -r -p` terminal fallback, cluster CTID discovery via `pvesh get /cluster/nextid`, storage pool auto-detection via `pvesm status`, Debian 12 template download via `pveam`, `pct create` provisioning, and final access URL banner.
* **In-Container Provisioner Template**: Canonical pattern with `DEBIAN_FRONTEND=noninteractive`, base package installation, NodeSource Node.js LTS repository setup, Git clone with idempotent update path, `npm install` + `npm run build` with `NODE_OPTIONS` heap ceiling, systemd service unit generation with `daemon-reload` + `enable` + `restart`, liveness polling, update routine creation at `/usr/local/bin/update-<app>`, and apt cache cleanup.
* **Critical Rule: Integer-Only Disk Sizing**: `pct create --rootfs` interprets `4G` or `8GB` as a logical volume name causing catastrophic failures. Always strip non-numeric characters with `tr -dc '0-9'` before passing to `pct create`.
* **Critical Rule: Bootstrap Isolation**: Debian 12 minimal templates have no `curl`. Fetch install scripts on the PVE host, push via `pct push`, execute via `pct exec`, and clean up. Never pipe-execute inside the container during bootstrap.
* **Critical Rule: Node.js V8 Heap Management**: Containers with under 2048MB RAM crash `npm run build` with exit code 134. Always set `export NODE_OPTIONS="--max-old-space-size=1536"` before builds. Require minimum 2048MB RAM + 1024MB Swap for frontend-compiling apps.
* **Critical Rule: Pipe-Safe Interactive Dialogs**: When run via `bash -c "$(curl ...)"`, `whiptail` aborts because stdin is the pipe. Always execute `exec < /dev/tty` before dialogs when `[ ! -t 0 ] && [ -c /dev/tty ]`. Provide full `read -r -p` fallback when whiptail is unavailable.
* **Critical Rule: Active Health Verification**: Polling `systemctl is-active` for 15 seconds after `systemctl start`, then polling the HTTP health endpoint for 20 seconds, prevents false-positive success banners when apps crash during database init or port binding. On failure, immediately dump `journalctl -n 50 --no-pager`.
* **Critical Rule: Idempotent Update Routines**: Every provisioner must create `/opt/<app>/update.sh` (linked to `/usr/local/bin/update-<app>`) that stops service, pulls upstream, reinstalls deps, rebuilds with memory controls, restarts, and verifies health.
* **ZFS and Ceph Storage Integration**: Discovery of storage pools via `pvesm status`, ZFS dataset compression with `zstd`, pre-update snapshots via `pct snapshot`, Ceph RBD pool configuration for HA block storage, and LVM-thin free space verification.
* **Cloud-Init VM Templating**: Full `qm create` + cloud image import + cloud-init drive attachment + SSH key injection + `qm template` conversion workflow for building golden base images that clone in seconds.
* **Snapshot and Backup Automation**: `pct snapshot` / `pct rollback` / `pct delsnapshot` lifecycle, `vzdump` to Proxmox Backup Server with `--mode snapshot --compress zstd`, automated pre-update snapshot with rollback on failure, and Proxmox GUI backup scheduling guidance.
* **Cluster Resource Discovery**: `pvesh get /cluster/nextid`, CTID conflict detection across both CTs and VMs via `pct status` and `qm status`, `pvesh get /cluster/status` cluster-wide node enumeration.
* **Proxmox API Automation**: Token-based REST API access pattern, container start/stop/status via `curl` with `PVEAPIToken` header, Terraform `bpg/proxmox` provider integration, and Ansible `community.general.proxmox` module guidance.
* **Prometheus Monitoring Stack**: `prometheus-pve-exporter` setup, `/pve` metrics endpoint scrape config, Grafana dashboard integration, and alert rule templates for container OOM, storage saturation, CPU overload, and container-not-running conditions.
* **Container Hardening**: Unprivileged container enforcement, AppArmor profile assignment, cgroup v2 CPU weight and hard limits, memory balloon configuration, and read-only bind mount patterns.
* **Network Configuration Patterns**: Dynamic `net0` string construction for DHCP/static/VLAN-tagged containers, multi-interface configuration, post-creation network reconfiguration via `pct set`, and DHCP lease acquisition polling loop.
* **Debugging and Triage Playbook**: `pct console`, `pct exec` single-command execution, `journalctl` service log extraction, boot log inspection, memory/disk/network diagnostics from inside the container, and template download failure triage via `pveam`.
* **Advanced Mode Dialog Flow**: Full `whiptail` Advanced mode covering Container ID (with conflict detection loop), Hostname, CPU Cores, RAM, Swap, Disk Size, Storage Pool, Network Bridge, VLAN Tag, IP Address (DHCP or CIDR static), and Gateway with confirmation summary before `pct create`.

## Usage

Invoke this skill when an agent is asked to:
* Build a new Proxmox VE LXC helper script for any application
* Debug a failing `pct create`, `pveam download`, or in-container provisioning step
* Add ZFS snapshot automation or Proxmox Backup Server integration
* Set up cloud-init VM golden images and clone pipelines
* Configure Prometheus monitoring for a Proxmox cluster
* Harden LXC containers with AppArmor and cgroup resource limits
* Automate Proxmox cluster operations via the REST API or Terraform

* **v3** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v2**: Major expansion with two-tier architecture templates, 6 critical engineering rules (integer disk sizing, bootstrap isolation, V8 heap ceiling, pipe-safe dialogs, active health verification, idempotent updates), ZFS/Ceph/LVM-thin storage integration, cloud-init VM templating, snapshot and backup automation with rollback, cluster resource discovery, Proxmox REST API and Terraform automation, Prometheus PVE exporter monitoring stack, AppArmor and cgroup v2 container hardening, VLAN network configuration patterns, and comprehensive debug triage playbook.
* **v1**: Initial release with basic LXC templates, SSH hardening, and baseline app deployment patterns.
