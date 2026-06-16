# Version 3.7.0 Walkthrough

## Overview
This update introduces clerk authentication perimeter, upstash redis management, and vercel deployment routines as core architectural capabilities of the project bootstrapper.

## Changes
* **Scaffolding Injection**:
    * Integrated templates for vercel.json and GitHub Actions deploy.yml.
    * Added Next.js App Router middleware, layout, and rate limiting libraries.
    * Enforced dynamic path routing inside scaffold.ps1 to resolve these templates under target root or src folder.
* **Environment Provisioning**:
    * Created env.example template with Clerk and Upstash config placeholders.
    * Injected foundational runtime definitions into manifest.json.
* **New Agent Skills**:
    * Provisioned Clerk Authentication Perimeter skill.
    * Provisioned Upstash Redis Management skill.
    * Provisioned Vercel Deployment Routine skill.
* **Documentation**:
    * Updated readme.md files to include and document these new capabilities.
