# Version 4.1.0 Walkthrough

## Summary of Changes
This release introduces the **Proxmox** skill, allowing agents to configure Proxmox VE servers and provision LXC templates efficiently using baseline homelab standards.

## Skill Additions
1. **Proxmox Skill:**
   * Built the `.skills/proxmox` module and populated its architecture.
   * Leveraged the official `upioneer/homelab` documentation for standardizing baseline app deployments, LXC template creation, SMB sharing, and SSH hardening logic.
   * Defined the GitHub Reference URL directly within the `SKILL.md` to ensure agents always pivot to the live master source of truth (`https://github.com/upioneer/homelab/tree/main/Proxmox`) when executing Proxmox tasks.
   * Retrofitted the `/.skills/readme.md` index generator script to fully map the new skill and clean up semantic versions into whole numbers across the index table.
