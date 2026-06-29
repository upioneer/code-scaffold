# Proxmox

**Version:** 2
**Target:** `.skills/proxmox`

## Description
Proxmox VE LXC toolbox for building reusable templates, baseline app deployments, and SSH hardening.

## Capabilities & Use Cases
* **LXC Template Creation & Standardization**: Implements methodologies for converting LXC containers into reusable templates (`NewCTTemplate.md`), including robust cleaning routines for machine IDs, apt caching, bash history, and SSH keys.
* **Automated Baseline Application Provisioning**: Automates the installation of essential base utility packages (e.g., `curl`, `wget`, `htop`, `git`, `qemu-guest-agent`) directly inside fresh Proxmox containers (`baselineApps.md`), accelerating deployment times.
* **Proxmox Hardening & Nag Removal**: Executes automated scripts to safely remove the enterprise "No Valid Subscription" nag screen (`NoValidSubscription.md`).
* **Secure Networking & Authentication**: Secures container networking by enforcing SSH key authentication and explicitly disabling password-based logins (`ssh_hardening.md`).
* **Samba Share Integration**: Facilitates the configuration and direct mounting of Samba (SMB) shares into Proxmox to expand storage capabilities (`SMBmap.md`).

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Initial creation
