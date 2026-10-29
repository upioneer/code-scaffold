# Ansible

**Version:** 3

**Target:** `.skills/ansible`

**Category:** DevOps & Infrastructure

**Keywords:** `ansible`, `configuration-management`, `playbooks`, `server-provisioning`, `devops`, `automation`, `yaml`, `ansible-playbook`, `ansible-roles`, `inventory-management`, `idempotent-deployment`, `infrastructure-as-code`, `ansible-galaxy`, `ansible-vault`, `jinja2-templates`, `ssh-orchestration`, `zero-touch-provisioning`

## Description
Infrastructure automation, configuration management, and application deployment orchestration using Ansible.

## Capabilities & Use Cases
* Automates infrastructure provisioning, configuration management, and application deployment orchestrations ensuring full execution readiness.
* Detects dependencies like Python3 and Pip, and natively installs Ansible Core via apt, brew, or pip.
* Validates Ansible installations by parsing versions for compatibility.
* Scaffolds standardized directory structures including roles, host_vars, and group_vars isolation.
* Generates hardened `ansible.cfg` profiles specifically tuned for automated/headless environments with host key checking disabled and explicit logging.
* Authors strict YAML playbooks and host inventory files enforcing explicit name directives and spacing rules.
* Performs baseline connectivity health checks using `ping` before executing mutating state changes.
* Provides operational wrappers for safe execution including syntax checking and dry-run preview layers.
* Engages deep troubleshooting via verbose executions and logs parsing to automatically remediate missing dependencies and unreachable hosts.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v2** : Expanded capability descriptions
* **v1** : Add ansible and terraform skills, fix apps/packages deployment pathing
