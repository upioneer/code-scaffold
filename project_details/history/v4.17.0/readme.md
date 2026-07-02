# Version 4.17.0

## Features
* **Massive SAST Coverage Expansion**: The CyberSecurity Toolkit (`.skills/cybersecurity-toolkit`) was heavily upgraded to explicitly enforce credential detection across a precisely verified list of **160+ enterprise and financial services**. The engine now explicitly targets API keys, tokens, and secrets across major cloud providers (AWS, Azure, GCP, OCI), databases (Snowflake, Databricks, PostgreSQL, ClickHouse), orchestration (Kubernetes, Docker), message brokers (Kafka, RabbitMQ), CI/CD pipelines (GitHub, GitLab, Jenkins), security appliances (CrowdStrike, Palo Alto, F5 BIG IP), and 15 distinct financial/crypto exchanges (Coinbase, Kraken, Interactive Brokers, Fidelity, etc.).

## Refactors & Enforcements
* **Skill Version Sync**: Bumped the CyberSecurity Toolkit bundle to `v5` across `meta.json`, the deployment manifest, local readme architectures, and the global skill registry.
