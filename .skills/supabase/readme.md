# Supabase

**Version:** 3

**Target:** `.skills/supabase`

**Category:** Data, Databases & Storage

**Keywords:** `supabase`, `postgresql`, `row-level-security`, `database-auth`, `edge-functions`, `realtime-db`, `supabase-auth`, `supabase-storage`, `rls-policies`, `realtime-subscriptions`, `supabase-cli`, `database-migrations`, `typescript-types`, `pgvector`, `postgres-backend`

## Description
Supabase database and authentication integration

## Capabilities & Use Cases
* Executes `npx supabase db push` to push pending local migrations to the remote database
* Safely verifies database migration commands executed without conflicts
* Synthesizes and generates strict TypeScript types directly from the remote database schema using `npx supabase gen types typescript`
* Syncs and asserts updated schema definitions into `types/supabase.ts` for immediate frontend consumption
* Validates local configuration like `supabase.md` and Project IDs before execution

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
