---
name: Terraform
description: Infrastructure as Code (IaC) provisioning and state management using Terraform or OpenTofu.
---

# Terraform Engineering Skill

You are equipped with the Terraform engineering skill. Your objective is to automate Infrastructure as Code (IaC) provisioning, ensuring full configuration, validation, and execution readiness.

## 1. Installation Verification & Setup

Before executing any Terraform workflows, you must verify the environment:
1. **Detect Binary:** Detect the system presence of the `terraform` binary (or the `tofu` OpenTofu alternative).
2. **Path Verification:** Verify the execution path accessibility.
3. **Validate:** Validate version compatibility by running `terraform version` (or `tofu version`).

## 2. Directory & Configuration Structure

When initializing Terraform for a project, build the following strict structure:
- **`terraform/`**: The root directory for all Terraform configurations, located in the main project root.
- **`terraform/main.tf`**: The primary entrypoint for infrastructure resources.
- **`terraform/variables.tf`**: Explicit definitions for all input variables.
- **`terraform/outputs.tf`**: Explicit definitions for all state outputs.
- **`terraform/providers.tf`**: Dedicated file for provider blocks and version constraints.
- **`terraform/terraform.tf`**: Dedicated file configuring the local or remote backend block.
- **`.gitignore`**: Ensure the project `.gitignore` (or a nested one within the `terraform/` directory) is tailored to exclude:
  - `terraform.tfstate`
  - `terraform.tfstate.backup`
  - `.terraform/`
  - `.terraform.lock.hcl` (optional depending on team conventions, but usually committed)

## 3. Syntax & HCL Requirements

When generating Terraform configurations, enforce the following standards:
1. **HCLv2 Compliance:** Ensure all generated files conform strictly to HashiCorp Configuration Language (HCL) version 2 standards.
2. **Provider Constraints:** Define explicit provider blocks with exact or pessimistic (`~>`) version constraints inside `providers.tf`.
3. **Resource Structure:** Structure all resource blocks with explicit labels, avoiding hardcoded strings by utilizing explicit variable references (`var.xyz`).
4. **Formatting:** Automatically format all files by executing the `terraform fmt` command after any scaffolding or code generation.

## 4. Engagement & Execution Commands

When operating Terraform, use the following execution wrappers:
- **Initialization:** Automate the initialization phase using `terraform init` before any other commands.
- **Planning:** Provide wrappers to generate execution strategies using the `terraform plan` command. Review the plan output to ensure intended resource mutations.
- **Application:** Implement strict safety checks for `terraform apply`. When fully automated, require explicit `-auto-approve` flags, but ONLY after a plan has been verified or when explicitly instructed by the user.

## 5. Troubleshooting & Logging

When encountering execution errors or state locks:
1. **Debug Logging:** Expose configuration for the `TF_LOG` environment variable (e.g., `TF_LOG=DEBUG` or `TF_LOG=TRACE`) to control debugging levels when tracing failures.
2. **Validation:** Provide mechanisms to parse validation failures using the `terraform validate` command prior to planning.
3. **State Locking:** Handle common state locking errors (e.g., when a previous run crashed) by implementing `terraform force-unlock` routines. Always ensure it is safe to unlock the state before doing so.
