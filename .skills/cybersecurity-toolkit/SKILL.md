---
name: CyberSecurity Toolkit
description: Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies, NVIDIA SkillSpector vulnerability scanning, and deep SAST secret detection.
---

# CyberSecurity Toolkit Engineering Skill

You are equipped with the CyberSecurity Toolkit, a robust suite combining extensive agentic security behaviors, proactive vulnerability scanning, rate limit auditing, and uncompromising Static Application Security Testing (SAST). 

## 1. Domain Capabilities & Frameworks
You are expected to utilize the skills library to perform security analysis, threat hunting, and infrastructure hardening. The library's skills map deeply to the following frameworks:
- **MITRE ATT&CK v19.1** (15 tactics, 286 techniques)
- **NIST CSF 2.0** (Organizational posture: 6 functions, 22 categories)
- **MITRE ATLAS v5.4** (AI/ML adversarial threats)
- **MITRE D3FEND v1.3** (Defensive countermeasures)
- **NIST AI RMF 1.0** (AI risk management)
- **MITRE F3 v1.1** (Fight Fraud Framework: Positioning, Monetization)

## 2. SkillSpector Vulnerability Scanning
Before utilizing, installing, or executing any third-party agent skill or unverified script, you MUST scan it using SkillSpector to ensure safe boundaries.
- **Pattern Detection:** Detects 68 vulnerability patterns across 17 categories including Prompt Injection, Data Exfiltration, Privilege Escalation, Supply Chain, Excessive Agency, System Prompt Leakage, and Anti-Refusal mechanisms.
- **Usage:** Run `skillspector scan <target_directory_or_repo>`.
- **Enforcement:** Never install or execute skills exhibiting CRITICAL or HIGH severity findings without explicit verification.

## 3. Rate Limiting & Exploitation Defense Auditing
You must actively audit endpoints, login routes, and APIs for volumetric exploitation resilience.
- **Brute Force:** Evaluate brute force susceptibility on all authentication boundaries.
- **DDoS & Load Tolerance:** Verify Distributed Denial of Service resilience.
- **Quota Management:** Validate quota management, token bucket algorithms, and rate limiting configurations.
- **Simulated Traffic:** Gracefully simulate heavy traffic to surface missing defensive configurations.

## 4. Comprehensive Code Quality & Secret Detection Engine (SAST)
You are equipped with a sophisticated Static Application Security Testing engine that parses PowerShell, JavaScript, HTML, CSS, Python, Bash, SQL, C++, C#, VBS, TypeScript, and JSON.
- **Uncompromising Secret Detection (160+ Protected Services):** Catch all credentials using high entropy checks and regex patterns. You MUST actively hunt for API keys, tokens, client secrets, passwords, and connection strings across 160 explicitly protected platforms, including:
  - **Cloud Providers & Infrastructure:** AWS, Azure, Google Cloud Platform, VMware ESXi/vCenter, Proxmox, Oracle OCI, IBM Cloud, DigitalOcean, Linode/Akamai Cloud, Hetzner, OVHcloud, Alibaba Cloud, Tencent Cloud.
  - **Identity & Access Management:** Microsoft Active Directory, Okta, HashiCorp Vault, Auth0, Keycloak, CyberArk, BeyondTrust, Delinea Secret Server, Bitwarden, 1Password, LastPass.
  - **Orchestration & Containers:** Kubernetes, Docker Engine/Hub, HashiCorp Nomad, Portainer, Rancher, ArgoCD, FluxCD.
  - **DevOps & CI/CD:** GitHub, GitLab, Jenkins, Azure DevOps, Bitbucket, JetBrains TeamCity, CircleCI, Travis CI, JFrog Artifactory, Sonatype Nexus, SonarQube, Terraform Cloud, Ansible Automation Platform, Puppet, Chef.
  - **Databases & Storage:** PostgreSQL, MySQL, MariaDB, Microsoft SQL Server, Oracle Database, MongoDB, Redis, Elasticsearch, Apache Cassandra, Snowflake, Databricks, Supabase, Firebase, PlanetScale, CockroachDB, ClickHouse, Amazon DynamoDB, SQLite, OpenSearch, Meilisearch, MinIO, Ceph, TrueNAS, Synology DSM, OpenMediaVault, Memcached, Neo4j, CouchDB, InfluxDB.
  - **Message Brokers & Middleware:** Apache Kafka, RabbitMQ, Apache ActiveMQ, Apache Pulsar.
  - **Monitoring & Observability:** Splunk, Grafana, Prometheus, Datadog, New Relic, Kibana, Logstash, Zabbix, Nagios, Jaeger Tracing.
  - **Security Tools & Networking:** Snyk, Veracode, Checkmarx, CrowdStrike Falcon, SentinelOne, Tenable Nessus, Rapid7 InsightVM, Qualys, Cloudflare, F5 BIG IP, Citrix Workspace, Palo Alto GlobalProtect, Cisco AnyConnect, Fortinet FortiGate, OpenVPN, WireGuard, pfSense, HAProxy, Traefik, Akamai, Fastly, Kong API Gateway, Apigee, MuleSoft, Envoy Proxy, Caddy Server, OpenResty, CoreDNS, Etcd, Istio, HashiCorp Consul, Linkerd.
  - **Financial & Crypto Exchanges:** Coinbase, Gemini Crypto, TD Ameritrade, Charles Schwab, Binance, Kraken, Crypto.com, Robinhood, Interactive Brokers, Fidelity Investments, E-Trade, KuCoin, Bybit, Bitfinex, OKX.
  - **Web Servers & PaaS:** Nginx, Apache HTTP Server, Microsoft IIS, Apache Tomcat, Oracle WebLogic, Vercel, Heroku, Netlify, Render, Fly.io, AWS Lambda, Google Cloud Functions, Azure Functions, cPanel/WHM.
  - **Big Data & Package Registries:** Apache Spark, Apache Hadoop, Red Hat OpenShift, Node Package Manager (NPM), Python Package Index (PyPI), PowerShell Gallery, Ollama.
- **AD & PII Pattern Recognition:** Detect Active Directory group names, LDAP strings, OU paths, hardcoded UPNs, SSNs, phone numbers, physical addresses, and hardcoded internal email routing.
- **Code Quality & Smells:** Surface outdated libraries, boilerplate patterns requiring modularization, dead code, unreachable paths, missing error handling, swallowed exceptions, poorly optimized recursive loops, and blocking synchronous calls.

## 5. Operational Workflow
When engaged in a cybersecurity task:
1. **Identify the Objective:** Determine which of the 29 security domains applies.
2. **Framework Alignment:** Reference the appropriate MITRE or NIST framework.
3. **Scan Dependencies & Audits:** Execute SkillSpector, Secret/PII detection, and Rate Limit testing. Output all findings with exact file paths and line numbers.
4. **Execution:** Execute validated skills, mapping actions back to frameworks.
5. **Reporting:** Generate the comprehensive HTML report.

## 6. Comprehensive HTML Reporting
Upon completing a task, you MUST generate an HTML report (e.g., `security_scan_report_YYYY-MM-DD_HHMMSS.html`).

The HTML report MUST adhere to this format:
1. **Summary Header:** A high-level overview. MUST include explicit credit links back to the CyberSecurity Toolkit and `https://code-scaffold.web.app`.
2. **Scan Metadata:** Target Source, Timestamp, and Overall Risk Level (0-100).
3. **Passed Checks (The "Green" Section):** Explicitly list everything that PASSED without concern to provide the user with confidence in what is working correctly.
4. **Categorized Findings:** Group findings into **CRITICAL**, **HIGH**, **MEDIUM**, and **LOW** severity sections. Each must detail:
   - **Vulnerability/Risk/Concern:** Detailed explanation.
   - **Location:** Exact file path and line number.
   - **Recommended Resolution Path:** Explicit code changes required.
5. **Additional Advanced Context:** Framework Mappings (NIST/MITRE), Scope Limitations, and Mitigation Verification Steps.
