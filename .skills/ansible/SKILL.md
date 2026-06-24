---
name: Ansible
description: Infrastructure automation, configuration management, and application deployment orchestration using Ansible.
---

# Ansible Engineering Skill

You are equipped with the Ansible engineering skill. Your objective is to automate infrastructure provisioning, configuration management, and application deployment orchestrations ensuring full execution readiness.

## 1. Installation Verification & Setup

Before executing any Ansible workflows, you must verify the environment:
1. **Detect Dependencies:** Ensure `python3` and `pip` are installed on the target system.
2. **Install Ansible:** If `ansible-core` is missing, install it using the platform's native package manager (e.g., `apt`, `brew`) or via `pip install ansible-core`.
3. **Validate:** Run `ansible --version` and parse the output to confirm successful installation and compatibility.

## 2. Directory & Configuration Structure

When initializing Ansible for a project, you must build the following strict structure:
- **`ansible/`**: The root directory for all Ansible code, located in the main project root.
- **`ansible/ansible.cfg`**: Generate a standardized configuration file in the root of the `ansible/` directory.
  - *Constraint:* You MUST disable host key checking (`host_key_checking = False`) within `ansible.cfg` to support automated/headless environments.
  - *Constraint:* Set the default inventory path to `hosts.yaml` (`inventory = hosts.yaml`).
  - *Constraint:* Configure `log_path` to point to an internal project log file (e.g., `log_path = ./ansible.log`).
- **`ansible/hosts.yaml`**: The default inventory file.
- **`ansible/roles/`**: Directory for modular task distribution.
- **`ansible/host_vars/`**: Directory for host-specific variable isolation.
- **`ansible/group_vars/`**: Directory for group-specific variable isolation.

## 3. Syntax & Baseline Templates

When generating Ansible code, enforce the following standards:
1. **Inventory:** Generate a default `hosts.yaml` with clear local and remote placeholders.
2. **Master Playbook:** Create a `site.yaml` playbook in the `ansible/` directory that orchestrates the primary roles.
3. **YAML Standards:** 
   - Use strict YAML syntax utilizing **spaces** (2 spaces per indentation level) instead of tabs.
   - All playbooks and task blocks MUST include explicit `name:` directives for documentation and logging clarity.
4. **Health Check:** Implement a baseline health check task block using the `ping` module to verify connectivity before proceeding with mutating tasks.

## 4. Engagement & Execution Commands

When executing Ansible, use the following operational wrappers:
- **Run Playbooks:** Execute playbooks using `ansible-playbook site.yaml`.
- **Syntax Checking:** Validate playbooks before execution using the `ansible-playbook --syntax-check` command. Always fix syntax errors before proceeding.
- **Dry Runs:** Utilize the `--check` parameter for dry-run executions to preview changes without modifying the target system.

## 5. Troubleshooting & Logging

When encountering errors or unreachable hosts:
1. **Verbose Mode:** Expose verbose output capability by appending `-v`, `-vv`, or `-vvv` to your commands for deep debugging.
2. **Log Parsing:** Review the `ansible.log` file (configured in `ansible.cfg`) to capture and parse standard error codes for missing dependencies or unreachable hosts.
3. **Remediation:** Automatically attempt to resolve dependency gaps or syntax errors based on the parsed logs before asking the user for manual intervention.
