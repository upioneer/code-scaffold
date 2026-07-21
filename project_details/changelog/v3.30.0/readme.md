# Version 3.30.0 Walkthrough

## Summary of Changes
This release significantly expands the project provisioning capabilities of the scaffolding engine by introducing complete, automated engineering skills for two of the most robust Infrastructure-as-Code platforms: **Ansible** and **Terraform**. 

Additionally, this minor version bundles the previously pending hygiene updates addressing artifact target pathing and root directory deployments.

## Feature Enhancements
1. **Ansible Skill Registration:**
   * Introduced the `.skills/ansible` module targeting infrastructure automation, configuration management, and deterministic deployment orchestration.
   * Built an intelligent schema instructing the coding agent to verify core dependencies (`python3`, `pip`), install `ansible-core`, and generate standard configuration baselines including `ansible.cfg` and `hosts.yaml`.
   * Included strict guidelines on yaml syntaxing, baseline ping connectivity task blocks, role layouts, and logging verification mechanisms.
2. **Terraform Skill Registration:**
   * Introduced the `.skills/terraform` module targeting declarative Infrastructure-as-Code (IaC) architectures and deterministic state management.
   * Instructed the coding agent to parse the execution environment for valid `terraform` or `tofu` binaries before bootstrapping standard module blocks (`main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`).
   * Hardcoded safeguards on state file tracking `.gitignore` inclusions and strict HashiCorp Configuration Language (HCLv2) formatting.

## Bug Fixes (Rolled forward from v3.29.2 candidate)
1. **Monorepo Directory Pathing:**
   * Adjusted `scaffold.ps1` and `scaffold-tui` target extraction schemas to explicitly recognize physical folder artifacts (`apps/` and `packages/`).
   * Prevented these monorepo roots from being erroneously collapsed and deployed into `project_details/`, ensuring they correctly mirror directly to the provisioned directory root.
