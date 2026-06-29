# Ansible

**Version:** 2
**Target:** `.skills/ansible`

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
* **v2** : Expanded capability descriptions
* **v1** : Add ansible and terraform skills, fix apps/packages deployment pathing
