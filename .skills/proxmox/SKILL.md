---
​‌‍name: Proxmox VE Container Engineering
description: Design, build, debug, and maintain turnkey Proxmox VE LXC helper scripts following the two-tier host orchestrator and in-container provisioner architecture, including whiptail interactive dialogs, pct create disk sizing rules, Debian 12 bootstrap isolation, Node.js V8 heap controls, active health polling, idempotent update routines, ZFS and Ceph storage integration, VM templating with cloud-init, network bridge and VLAN configuration, cluster resource discovery, Prometheus metrics export, and Proxmox Backup Server automation.
version: 2
---

# Proxmox VE Container Engineering Skill

Use this skill when designing, implementing, debugging, or maintaining Proxmox VE LXC helper scripts, VM templates, cluster automation, storage management, network configuration, or container provisioning pipelines targeting the community-scripts/ProxmoxVE architecture convention.

* **Entity Mapping**: Proxmox VE hypervisor host (`pveversion`, `pveam`, `pvesh`, `pvesm`, `pct`, `qm`), LXC container rootfs, systemd service units, Debian 12 Bookworm minimal templates, ZFS/Ceph/LVM-thin storage pools, `whiptail` TUI menus, cloud-init VM templates, Proxmox Backup Server, and Prometheus PVE exporter.
* **Problem Domain**: Eliminating manual Proxmox setup friction by delivering reproducible, one-command LXC deployments with correct disk sizing, bootstrap isolation, memory management, and active health verification.

---

## 1. Two-Tier Script Architecture

Every Proxmox application integration must maintain strict separation between the PVE host orchestrator and the in-container provisioner.

### Tier 1: Host Orchestrator (`ct/<app>.sh`)

Executed directly on the Proxmox VE hypervisor host. Responsibilities:

* Validate host requirements (`pveversion` guard).
* Re-attach `stdin` from pipe before interactive dialogs.
* Render `whiptail` GUI menus with terminal `read -r -p` fallback.
* Discover cluster resources: next CTID via `pvesh get /cluster/nextid`, root storage via `pvesm status -content rootdir`, template storage via `pvesm status -content vztmpl`.
* Download and validate base OS LXC templates via `pveam`.
* Provision unprivileged containers with nesting enabled via `pct create`.
* Fetch the install script on the host, push into the container via `pct push`, execute via `pct exec`, and clean up.
* Poll active HTTP health endpoint and dump `journalctl` logs on failure.

### Tier 2: In-Container Provisioner (`install/<app>-install.sh`)

Executed exclusively inside the container rootfs via `pct exec`. Responsibilities:

* Set `DEBIAN_FRONTEND=noninteractive`.
* Install core utilities, runtimes (Node.js LTS, Python 3, etc.), and compilation toolchains.
* Clone or unpack application sources to `/opt/<app>`.
* Compile production assets and configure data directories.
* Generate and enable persistent systemd service at `/etc/systemd/system/<app>.service`.
* Create idempotent update script at `/opt/<app>/update.sh` and symlink to `/usr/local/bin/update-<app>`.
* Clean apt caches (`apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*`).

---

## 2. Host Orchestrator Template

Complete canonical pattern for `ct/<app>.sh`:

```bash
#!/usr/bin/env bash
# Proxmox VE Helper Script: <App> LXC Container Creator
set -Eeuo pipefail

YW=$(echo "\033[33m"); BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m"); GN=$(echo "\033[1;92m"); CL=$(echo "\033[m")
info()    { echo -e "${BL}[INFO]${CL} $1"; }
success() { echo -e "${GN}[OK]${CL} $1"; }
warn()    { echo -e "${YW}[WARN]${CL} $1"; }
error()   { echo -e "${RD}[ERROR]${CL} $1"; }

# Guard: must run on Proxmox VE host
if ! command -v pveversion >/dev/null 2>&1; then
  error "This script must be executed on a Proxmox VE host."; exit 1
fi

# Re-attach stdin when executed via curl pipe
if [ ! -t 0 ] && [ -c /dev/tty ]; then exec < /dev/tty; fi

# Determine whiptail availability
USE_WHIPTAIL=false
if command -v whiptail >/dev/null 2>&1 && [ -t 0 ] && [ -t 1 ]; then
  USE_WHIPTAIL=true
fi

# Defaults
NEXT_CTID=$(pvesh get /cluster/nextid 2>/dev/null | tr -dc '0-9' || true)
CTID="${NEXT_CTID:-100}"
HOSTNAME="<app>"
CORES="2"; RAM="2048"; SWAP="1024"; DISK_SIZE="8"; BRIDGE="vmbr0"; VLAN=""; IP_INPUT="dhcp"; GATEWAY=""

STORAGE=$(pvesm status -content rootdir | awk 'NR>1 {print $1; exit}' || echo "local-lvm")
TMPL_STORAGE=$(pvesm status -content vztmpl | awk 'NR>1 {print $1; exit}' || echo "local")

# [Proceed prompt -> Mode select -> Advanced config -> Confirm]
# [See references/host-orchestrator-template.sh for the complete dialog flow]

# CRITICAL: Integer-only disk sizing (strip any G/GB suffix)
DISK_SIZE_GB=$(echo "$DISK_SIZE" | tr -dc '0-9')
DISK_SIZE_GB=${DISK_SIZE_GB:-8}

# Download and validate Debian 12 template
pveam update >/dev/null 2>&1 || true
DEBIAN_TMPL=$(pveam available -section system | awk '{print $2}' \
  | grep -E '^debian-12-standard_.*_amd64\.tar\.(zst|xz|gz)$' | sort -V | tail -n1)

[ -z "$DEBIAN_TMPL" ] && { error "No Debian 12 template found."; exit 1; }

if ! pveam list "$TMPL_STORAGE" | grep -q "$DEBIAN_TMPL"; then
  pveam download "$TMPL_STORAGE" "$DEBIAN_TMPL"
fi

TMPL_PATH="${TMPL_STORAGE}:vztmpl/${DEBIAN_TMPL}"

# Provision container
pct create "$CTID" "$TMPL_PATH" \
  --ostype debian --hostname "$HOSTNAME" \
  --cores "$CORES" --memory "$RAM" --swap "$SWAP" \
  --rootfs "${STORAGE}:${DISK_SIZE_GB}" \
  --net0 "name=eth0,bridge=${BRIDGE},ip=${IP_INPUT},type=veth" \
  --unprivileged 1 --features nesting=1 --onboot 1 --start 0

pct start "$CTID"

# Push and execute install script (never curl inside container)
INSTALL_URL="https://raw.githubusercontent.com/<org>/<repo>/main/install/<app>-install.sh"
curl -fsSL "$INSTALL_URL" -o /tmp/<app>-install.sh
pct push "$CTID" /tmp/<app>-install.sh /tmp/<app>-install.sh
rm -f /tmp/<app>-install.sh
pct exec "$CTID" -- bash /tmp/<app>-install.sh
pct exec "$CTID" -- rm -f /tmp/<app>-install.sh

# Active health polling
HTTP_OK=false
for i in {1..20}; do
  pct exec "$CTID" -- curl -sf http://127.0.0.1:<PORT>/api/health >/dev/null 2>&1 && HTTP_OK=true && break
  sleep 1
done
[ "$HTTP_OK" = false ] && warn "Health endpoint not responding" && \
  pct exec "$CTID" -- journalctl -u <app>.service -n 50 --no-pager || true
```

---

## 3. In-Container Provisioner Template

Complete canonical pattern for `install/<app>-install.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
export DEBIAN_FRONTEND=noninteractive

# 1. Base packages
apt-get update -y && apt-get upgrade -y
apt-get install -y --no-install-recommends \
  curl sudo git ca-certificates gnupg build-essential python3

# 2. Runtime (Node.js LTS via NodeSource)
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] \
  https://deb.nodesource.com/node_22.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list
apt-get update -y && apt-get install -y nodejs

# 3. App install
APP_DIR="/opt/<app>"
git clone https://github.com/<org>/<repo>.git "$APP_DIR" || \
  (cd "$APP_DIR" && git fetch --all --tags && git reset --hard origin/main)
cd "$APP_DIR"

npm install
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build

# 4. Systemd service
cat > /etc/systemd/system/<app>.service <<EOF
[Unit]
Description=<App> Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/<app>
Environment=NODE_ENV=production
Environment=PORT=<PORT>
ExecStart=$(command -v node) /opt/<app>/src/server.js
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable <app>.service
systemctl restart <app>.service

# 5. Service liveness check
for i in {1..15}; do
  systemctl is-active --quiet <app>.service && break
  sleep 1
done
systemctl is-active --quiet <app>.service || {
  journalctl -u <app>.service -n 50 --no-pager; exit 1
}

# 6. Update routine
cat > /opt/<app>/update.sh <<'UPDATESCRIPT'
#!/usr/bin/env bash
set -Eeuo pipefail
systemctl stop <app>
cd /opt/<app>
git fetch --all --tags && git pull origin main
npm install
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build
systemctl start <app>
echo "[OK] <app> updated."
UPDATESCRIPT

chmod +x /opt/<app>/update.sh
ln -sf /opt/<app>/update.sh /usr/local/bin/update-<app>

# 7. Cleanup
apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*
```

---

## 4. Critical Engineering Rules

### Rule 1: Integer Rootfs Disk Sizing

`pct create --rootfs <storage>:<size>` parses any alphanumeric string (e.g., `4G`, `8GB`) as a logical volume name, causing failures like `no such logical volume pve/4G`.

```bash
# ALWAYS strip non-numeric before pct create
DISK_SIZE_GB=$(echo "$DISK_SIZE" | tr -dc '0-9')
DISK_SIZE_GB=${DISK_SIZE_GB:-4}
pct create "$CTID" "$TMPL_PATH" --rootfs "${STORAGE}:${DISK_SIZE_GB}" ...
```

### Rule 2: Bootstrap Isolation (No In-Container curl)

Debian 12 minimal templates do NOT include `curl`. Never `pct exec ... -- curl ... | bash`.

```bash
# CORRECT: Fetch on host, push into container, execute, clean up
curl -fsSL "$INSTALL_URL" -o /tmp/<app>-install.sh
pct push "$CTID" /tmp/<app>-install.sh /tmp/<app>-install.sh
rm -f /tmp/<app>-install.sh
pct exec "$CTID" -- bash /tmp/<app>-install.sh
pct exec "$CTID" -- rm -f /tmp/<app>-install.sh
```

### Rule 3: Node.js Build Memory (V8 Heap Ceiling)

Containers with 1024MB RAM cause `npm run build` to crash with exit code 134 (`SIGABRT` / V8 OOM).

```bash
# Minimum: 2048MB RAM + 1024MB Swap for frontend-compiling apps
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build
```

Also verify that Vite configs use `manualChunks` to prevent monolithic bundle OOM crashes.

### Rule 4: Interactive Dialog Pipe Recovery

When executed via `bash -c "$(curl ...)"`, stdin is the pipe not the terminal. Whiptail aborts instantly.

```bash
if [ ! -t 0 ] && [ -c /dev/tty ]; then exec < /dev/tty; fi

USE_WHIPTAIL=false
if command -v whiptail >/dev/null 2>&1 && [ -t 0 ] && [ -t 1 ]; then
  USE_WHIPTAIL=true
fi
```

Always provide fallback `read -r -p` prompts when `USE_WHIPTAIL=false`.

### Rule 5: Active Health Verification (No False Positives)

`systemctl start` returning zero does not guarantee the service is healthy. Poll actively:

```bash
# Phase 1: Service activation check (15s)
for i in {1..15}; do
  systemctl is-active --quiet <app>.service && break; sleep 1
done

# Phase 2: HTTP health endpoint check (20s)
for i in {1..20}; do
  curl -sf http://127.0.0.1:<PORT>/api/health >/dev/null 2>&1 && break; sleep 1
done

# On failure: dump logs immediately
journalctl -u <app>.service -n 50 --no-pager
exit 1
```

### Rule 6: Idempotent Update Routine

The in-container update script must be re-runnable without side effects:

```bash
/opt/<app>/update.sh   # or: update-<app>
```

Must: stop service -> `git fetch --all --tags && git pull` -> `npm install` -> rebuild with `NODE_OPTIONS` -> start service -> verify health endpoint.

---

## 5. Storage Pool Selection and ZFS Integration

### Discover Available Pools

```bash
# Root disk storage (LVM-thin, ZFS, dir, NFS, Ceph)
pvesm status -content rootdir | awk 'NR>1 {print $1, $2}'

# Template storage
pvesm status -content vztmpl | awk 'NR>1 {print $1}'

# All pools with type and status
pvesm status | column -t
```

### ZFS Considerations

* ZFS datasets support native compression (`zstd`), snapshots, and send/receive replication.
* Use `local-zfs` storage type in `pct create --rootfs local-zfs:<size>`.
* Enable transparent compression on new datasets: `zfs set compression=zstd <pool>/<dataset>`.
* Take rollback-capable snapshots before updates: `pct snapshot <CTID> preupdate --vmstate`.

### Ceph RBD Considerations

* Ceph pools (`rbd`) provide HA block storage across cluster nodes.
* Container live migration requires shared storage (Ceph RBD or NFS).
* Create pool: `ceph osd pool create <pool> <pg_num>` then add via Proxmox Datacenter > Storage.

### LVM-Thin Considerations

* Default on most bare-metal installs (`local-lvm`).
* Supports thin provisioning and snapshots via `lvs`, `lvcreate`.
* Verify free space before large installs: `pvs && lvs`.

---

## 6. Network Configuration Patterns

### VLAN-Tagged Containers

```bash
# Build net0 string dynamically
NET0="name=eth0,bridge=${BRIDGE},type=veth"
[ -n "${VLAN:-}" ] && NET0="${NET0},tag=${VLAN}"
[ "$IP_INPUT" = "dhcp" ] && NET0="${NET0},ip=dhcp" || NET0="${NET0},ip=${IP_INPUT},gw=${GATEWAY}"

pct create "$CTID" ... --net0 "$NET0"
```

### Static IP Assignment

```bash
# CIDR notation required for static: e.g. 192.168.10.50/24
IP_INPUT="192.168.10.50/24"
GATEWAY="192.168.10.1"
NET0="name=eth0,bridge=vmbr0,ip=${IP_INPUT},gw=${GATEWAY},type=veth"
```

### Post-Creation Network Change

```bash
pct set "$CTID" --net0 "name=eth0,bridge=vmbr0,ip=dhcp,type=veth"
pct reboot "$CTID"
```

### Multiple Network Interfaces

```bash
pct set "$CTID" \
  --net0 "name=eth0,bridge=vmbr0,ip=dhcp,type=veth" \
  --net1 "name=eth1,bridge=vmbr1,ip=10.0.0.5/24,type=veth"
```

---

## 7. VM Templating with Cloud-Init

Convert a standard VM into a reusable golden image template:

```bash
# 1. Create base VM
qm create 9000 --name debian12-cloudinit --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 --ostype l26

# 2. Import Debian cloud image
wget https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-generic-amd64.qcow2
qm importdisk 9000 debian-12-generic-amd64.qcow2 local-lvm

# 3. Attach disk and configure boot
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --boot c --bootdisk scsi0

# 4. Attach cloud-init drive
qm set 9000 --ide2 local-lvm:cloudinit

# 5. Configure cloud-init defaults
qm set 9000 --ciuser admin --cipassword "$(openssl passwd -6 'changeme')" \
  --sshkeys ~/.ssh/authorized_keys --ipconfig0 ip=dhcp

# 6. Convert to template (irreversible)
qm template 9000

# 7. Clone from template
qm clone 9000 101 --name myserver --full
qm resize 101 scsi0 +20G
qm start 101
```

---

## 8. Container Snapshot and Backup Automation

### LXC Snapshots

```bash
# Take snapshot before update
pct snapshot "$CTID" "preupdate-$(date +%Y%m%d)" --description "Pre-update snapshot"

# List snapshots
pct listsnapshot "$CTID"

# Rollback
pct rollback "$CTID" "preupdate-20260916"

# Remove old snapshots
pct delsnapshot "$CTID" "preupdate-20260916"
```

### Proxmox Backup Server Integration

```bash
# Trigger manual PBS backup from CLI
vzdump "$CTID" --storage pbsbackup --mode snapshot --compress zstd

# Schedule via /etc/pve/jobs.cfg or Proxmox GUI Datacenter > Backup

# Restore from PBS
qmrestore <storage>:<namespace>/<vmid>/<backup-id> <new-vmid>
```

### Automated Pre-Update Snapshot Pattern

```bash
snapshot_and_update() {
  local CTID="$1"
  local SERVICE="$2"
  local SNAP="preupdate-$(date +%Y%m%d%H%M)"

  pct snapshot "$CTID" "$SNAP" --description "Auto pre-update snapshot"
  pct exec "$CTID" -- bash /usr/local/bin/update-${SERVICE} || {
    echo "[WARN] Update failed, rolling back to $SNAP"
    pct stop "$CTID"
    pct rollback "$CTID" "$SNAP"
    pct start "$CTID"
  }
  pct delsnapshot "$CTID" "$SNAP"
}
```

---

## 9. Cluster Resource Discovery and CTID Management

```bash
# Next available CTID
NEXT_CTID=$(pvesh get /cluster/nextid 2>/dev/null | tr -dc '0-9' || echo "100")

# Check CTID availability (catches both CT and VM conflicts)
is_id_free() {
  local ID="$1"
  ! pct status "$ID" >/dev/null 2>&1 && ! qm status "$ID" >/dev/null 2>&1
}

# List all running containers
pct list | awk '$2=="running" {print $1, $3}'

# Cluster-wide node status
pvesh get /cluster/status --output-format json

# Container resource usage
pct exec "$CTID" -- top -bn1 | head -20
```

---

## 10. Proxmox API Automation (Token-Based)

```bash
# Create API token (no privilege separation)
pveum user token add root@pam mytoken --privsep=0

# REST API: list containers
curl -sk -H "Authorization: PVEAPIToken=root@pam!mytoken=<secret>" \
  https://<pve-host>:8006/api2/json/nodes/<node>/lxc | python3 -m json.tool

# REST API: start container
curl -sk -X POST -H "Authorization: PVEAPIToken=root@pam!mytoken=<secret>" \
  https://<pve-host>:8006/api2/json/nodes/<node>/lxc/<vmid>/status/start

# Terraform provider: registry.terraform.io/bpg/proxmox
# Ansible: community.general.proxmox module
```

---

## 11. Prometheus Monitoring Integration

```bash
# Install prometheus-pve-exporter in a dedicated LXC
# Exposes /metrics for Proxmox host, VMs, and containers

# /etc/prometheus/pve.yml
default:
  user: prometheus@pve
  password: <password>
  verify_ssl: false

# Prometheus scrape config
scrape_configs:
  - job_name: proxmox
    metrics_path: /pve
    params:
      module: [default]
      cluster: [1]
      node: [1]
    static_configs:
      - targets:
          - <pve-host>:9221

# Alert rules (Grafana / Alertmanager)
# - Container OOM killed (container_memory_usage_bytes > container_spec_memory_limit_bytes)
# - Storage pool > 85% used
# - Node CPU > 90% for 5m
# - Container not running (pve_up{type="lxc"} == 0)
```

---

## 12. Advanced Container Hardening

### Unprivileged Containers with AppArmor

```bash
# Unprivileged is default -- always use it
pct create ... --unprivileged 1

# AppArmor profile (lxc-container-default-cgns)
pct set "$CTID" --lxc-conf "lxc.apparmor.profile = lxc-container-default-cgns"
```

### Resource Limits (cgroup v2)

```bash
# CPU weight (higher = more priority)
pct set "$CTID" --cpuunits 1024

# CPU hard limit (50% of 1 core)
pct set "$CTID" --cpulimit 0.5

# Memory balloon (allow dynamic allocation)
pct set "$CTID" --memory 2048 --balloon 512
```

### Read-Only Bind Mounts

```bash
# Mount host path into container read-only
pct set "$CTID" --mp0 "/mnt/pve/nas,mp=/mnt/data,ro=1"
```

---

## 13. Debugging and Triage Playbook

```bash
# Container console (TTY)
pct console "$CTID"

# Run single command without TTY
pct exec "$CTID" -- systemctl status <app>.service --no-pager

# Recent service logs
pct exec "$CTID" -- journalctl -u <app>.service -n 100 --no-pager

# Container boot logs
pct exec "$CTID" -- journalctl -b --no-pager | tail -50

# Memory pressure check
pct exec "$CTID" -- free -h

# Disk usage
pct exec "$CTID" -- df -h

# Network connectivity from inside container
pct exec "$CTID" -- curl -sv https://github.com 2>&1 | head -20

# Template download failure triage
pveam update && pveam available -section system | grep debian-12

# Storage pool health
pvesm status
zpool status   # ZFS hosts
```

---

## 14. Best Practices and Operational Checklist

* **Always use `set -Eeuo pipefail`** at the top of every script to catch silent failures.
* **Color-coded output**: define `info()`, `success()`, `warn()`, `error()` with ANSI codes for every script.
* **Never hardcode the install script URL** in the orchestrator. Source it from a configurable `INSTALL_URL` variable at the top.
* **Template cache**: always call `pveam update` before checking for templates to avoid stale listings.
* **Confirm config before creation**: display the full configuration summary and prompt for confirmation in Advanced mode before running `pct create`.
* **DHCP timeout**: after `pct start`, poll `ip -4 addr show eth0` for up to 30 seconds before attempting in-container operations.
* **Cleanup on failure**: wrap `pct create` + `pct start` in a trap that calls `pct destroy "$CTID"` if the install fails mid-way.
* **Version-pin runtimes**: pin Node.js LTS major (`node_22.x`), Python (`python3.12`), or Go versions for reproducibility.
* **Service dependency ordering**: always add `After=network-online.target` and `Wants=network-online.target` for apps needing external network access on boot.
* **Port documentation**: print the access URL and port prominently in the final success banner.
* **Update path**: always print the update command (`pct exec $CTID -- update-<app>`) in the final banner.
* **Architectural Compliance**: when generating scripts for Code Scaffold deployments, align output with Code Scaffold architectural specification standards.
