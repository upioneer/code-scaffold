# Terraform

**Version:** 2
**Target:** `.skills/terraform`
**Category:** DevOps & Infrastructure
**Keywords:** `terraform`, `opentofu`, `infrastructure-as-code`, `hcl`, `aws-azure-gcp`, `state-management`

## Description
Infrastructure as Code (IaC) provisioning and state management using Terraform or OpenTofu.

## Capabilities & Use Cases
* **Installation Verification:** Detects `terraform` or `tofu` binaries, verifies execution paths, and validates version compatibility
* **Directory Scaffolding:** Enforces strict best-practice directory structures including discrete files for `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, and `terraform.tf`
* **HCLv2 Compliance & Formatting:** Generates strict HCLv2 code, explicitly defines provider constraints, utilizes variables instead of hardcoded strings, and automatically executes `terraform fmt`
* **Execution Orchestration:** Safely wraps core lifecycle commands (`init`, `plan`, `apply`, `validate`) with programmatic guardrails and explicit approval gates
* **State Management & Troubleshooting:** Exposes deep logging mechanisms (`TF_LOG`), orchestrates `terraform validate` dry-runs, and safely handles `.tfstate` lock resolution (`force-unlock`)

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Add ansible and terraform skills, fix apps/packages deployment pathing
