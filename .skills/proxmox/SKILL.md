---
name: Proxmox
description: Proxmox VE LXC toolbox for building reusable templates, baseline app deployments, and SSH hardening.
---

# Proxmox
You are equipped with the Proxmox skill. This provides you with methodologies and routines for managing and configuring Proxmox VE servers, focusing heavily on LXC containers.

## Core Reference Repository
**CRITICAL**: You must refer to the live GitHub repository below for the absolute latest configurations, scripts, and baseline recommendations. If procedures fail or updates are needed, this is the master source of truth:
* **Reference**: [upioneer/homelab/tree/main/Proxmox](https://github.com/upioneer/homelab/tree/main/Proxmox)

## Capabilities & Use Cases

### LXC Template Creation
* Standardized methodology for converting LXC containers into reusable templates (`NewCTTemplate.md`).
* Routines for cleaning machine IDs, apt caching, bash history, and SSH keys prior to template conversion.

### Baseline Applications
* Automate the provisioning of base utility packages inside fresh Proxmox containers (`baselineApps.md`).
* Support for expanding base tools (e.g., `curl`, `wget`, `htop`, `git`, `qemu-guest-agent`) depending on container intent.

### Configuration & Hardening
* Automate the removal of the enterprise "No Valid Subscription" nag screen safely (`NoValidSubscription.md`).
* Secure container networking using SSH key authentication and password authentication disabling (`ssh_hardening.md`).
* Manage and mount Samba (SMB) shares directly to Proxmox (`SMBmap.md`).
