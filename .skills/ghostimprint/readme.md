# GhostImprint Engine

**Version:** 5

**Target:** `.skills/ghostimprint`

**Category:** Security & Cryptography

**Keywords:** `ghostimprint`, `ghost-imprint`, `code-provenance`, `steganography`, `copyright-protection`, `digital-forensics`, `functional-entanglement`, `anti-tamper`, `zero-knowledge-proof`, `key-ceremony`, `entropy-meter`, `stylometry`, `ast-invariants`, `statistical-distribution`, `remote-oracle`, `daubert-standard`, `courtroom-admissible`, `dmca-evidence`

## Description
GhostImprint Engine is an industrial grade cryptographic code provenance and steganographic entanglement system engineered to protect proprietary software from unauthorized copying, automated AI refactorings, and closed-source SaaS exfiltration. It enables software authors to deterministically support authorship claims over stolen codebases in DMCA disputes and legal proceedings through measured multi-layer verification and digital forensics.

## Capabilities & Use Cases
* **Nine Layer Steganographic Defense in Depth**: Implements an adversarial gradient spanning sacrificial honeypot decoys, cryptographic pre-image constants, poly-algorithmic functional entanglement, multi-channel Unicode steganography, linguistic stylometry lexicon binding, abstract syntax tree (AST) topological invariants, soft constant statistical distribution signatures, remote runtime behavioral oracles, and temporal proof anchoring:
  * **Layer 0 (Sacrificial Honeypot Decoy)**: Deliberately visible copyright banners and watermarks placed in obvious configuration files. Functions as a psychological decoy for amateur adversaries and automated scrapers. Once removed, adversaries assume the codebase is sanitized, lowering their guard while eight invisible layers remain fully active.
  * **Layer 1 (Cryptographic Pre-Image Constants)**: Public pseudo-random constants derived from the author root seed that act as legitimate cryptographic salts, hash seeds, or lookup table seeds. Demonstrates mathematical pre-image generation with coincidence probability p < 2^-128.
  * **Layer 2 (Poly-Algorithmic Functional Entanglement)**: Cryptographic watermark constants interwoven directly into mission-critical runtime algorithms (spatial 3D camera jitter vectors, perceptual cubic-bezier easing curves, cache ring distribution offsets, and exponential backoff timers). Tampering with or stripping these constants destabilizes runtime execution or causes subtle operational degradation.
  * **Layer 3 (Multi-Channel Unicode & Whitespace Steganography)**: Invisible zero-width character streams (U+200B, U+200C, U+200D), homoglyphic lexical mappings, and trailing whitespace bit-encoding embedded across documentation, template literals, and code comments, providing instantaneous verification even in raw text diffs.
  * **Layer 4 (Linguistic Stylometry & Lexicon Binding)**: Subtly structured syntactic phrasing, distinctive code commentary idioms, and deterministic identifier naming cadences derived from author linguistic profiles, confirming authorship via computational stylometry and NLP.
  * **Layer 5 (AST Topological Invariants)**: Fingerprinted abstract syntax tree structural invariants, cyclic dependency node counts, and deterministic branching geometries that remain completely invariant across automated code formatters, variable renamers, and AST transpilers.
  * **Layer 6 (Soft Constant Statistical Distribution Signatures)**: Seeds 40 or more soft discretionary constants (timeouts, debounce intervals, buffer chunk thresholds, batch sizes, retry multipliers) with pseudo-random floats whose collective joint probability distribution yields astronomical uniqueness (coincidence probability p < 10^-50), surviving complete variable renamings and AI refactorings.
  * **Layer 7 (Remote Black-Box Behavioral Oracles)**: Covert operational side-channels embedded into public HTTP interfaces, response header metadata, sub-millisecond network timing jitter, precision floating-point delta curves, and synthetic edge-case error responses, enabling authors to audit and prove theft in closed SaaS backends without requiring source code access.
  * **Layer 8 (Temporal Proof & Public Ledger Anchoring)**: Cryptographic anchoring of Git tree SHAs, RFC-3161 trusted timestamping authorities, and public commit trees establishing definitive legal priority of creation prior to the infringing party creation date.
* **Kerckhoffs Steganographic Invariant**: Engineered according to Kerckhoffs principle so that even an adversary or automated AI agent possessing the full GhostImprint engine source code cannot detect, isolate, or sanitize all embedded fingerprints without possessing the author private root passphrase.
* **Hierarchical Deterministic (HD) Ratchet Key Tree**: Single sovereign master root passphrase (12 to 24 words) deterministically derives distinct, polymorphic layer constants for every project release version via HKDF-SHA256, eliminating key sprawl and preserving permanent historical auditability across all past and future releases.
* **Spectral Cyan Key Ceremony**: Interactive terminal user interface featuring real-time dynamic entropy calculation, live animated progress meters, and selectable security profiles up to 24 words benchmarked against hardware supercomputer compute times and cosmic universe lifespans:
  * 9 Words (99-bit): 20 Million Years (1,500 × all of recorded human history).
  * 12 Words (128-bit): 17 Sextillion Years (1.2 Trillion × the age of the universe).
  * 15 Words (160-bit): 140 Nonillion Years (100 Quintillion × the age of the universe: fully resistant to quantum Grover search).
  * 18 Words (192-bit): 1.2 Undecillion Years (80 Nonillion × the age of the universe).
  * 21 Words (224-bit): 10 Tredecillion Years (700 Undecillion × the age of the universe).
  * 24 Words (256-bit): 93 Quindecillion Years (Effectively infinite: exceeds the estimated heat death of the cosmos).
* **Cryptographic Wordlist Optimization**: Built upon a standardized 2,048-word lexicon where every word is uniquely identifiable by its first four letters, contains zero homophones or visually ambiguous lookalikes, and provides optimal Hamming distance for human error detection and transcription reliability (11 bits of entropy per word).
* **Anti-Correlation Policy Gatekeeper**: Audits repository metadata in real time (git configuration, remote URLs, package names, author handles, directory names) and enforces a mandatory 75% external dictionary word threshold, actively blocking authors from establishing vulnerable keys composed of public project terms and defeating targeted dictionary attacks.
* **Automated README Badge Generation**: Automatically asserts a Shields.io [GhostImprint Protected] badge directly beneath the primary repository header in README.md upon project protection, with dedicated CLI inspection and manual opt-out support (--no-badge).
* **Project-Segmented Vault Topology**: Automatically segments credentials into isolated project vaults (`~/.ghostimprint/projects/<slug>.vault.json.enc`) protected by authenticated AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations), ensuring client and personal repositories remain completely segregated with zero cross-contamination.
* **Universal Git Slug Auto-Routing**: Automatically inspects git remote origin URLs and resolves them into canonical filesystem slugs (e.g. `organization-project-slug`, `core-infrastructure-repo`), enabling seamless single-command vault access and contextual configuration.
* **Master Portfolio Key Reuse**: Allows authors to use a single 24-word sovereign master passphrase across 50 independent repositories while HKDF automatically derives 100% uncorrelated layer constants for each project using repository URLs as cryptographic salt, guaranteeing that the compromise of one repository yields zero knowledge about any other codebase.
* **Project Registry Dashboard**: Centralized management command (`ghostimprint list`) displaying all enrolled repositories, their canonical slugs, vault encryption statuses, sealed release versions, and active protection layers in an intuitive CLI dashboard.
* **Forensic Repository Auditor (`ghostimprint-audit.js`)**: Deep inspection engine that scans suspect repositories and reports measured layer evidence with explicit UNMEASURED labels. Fails closed without a project vault or passphrase. Verdicts derive from measured layers only.
* **Court Admissible Digital Forensics Dossier (`ghostimprint-export.js`)**: Automatically generates sealed forensic evidence reports detailing derivation trees and measured audit findings with unmeasured layers labeled as such. Makes no standalone admissibility claim. Includes independent sandbox reproduction scripts for judicial expert examiners.
* **Remote Black-Box Oracle Probing (`ghostimprint-oracle.js`)**: Audits closed-source cloud deployments and private SaaS applications over public HTTP interfaces by measuring response timing baselines against derived constants without requiring source code access. Timing alone is not proof of infringement.
* **Authoritative Architectural Contract Card**: Interactive specification card presenting the ASCII branding banner, CLI installation syntax, programmatic import code, YAML frontmatter schemas, domain constraints, and security permissions on code-scaffold.com.
* **Natural Language Intent Engine**: Provides conversational CLI dispatch allowing developers and AI agents to invoke commands naturally (e.g. `ghostimprint "list my registered projects"`, `ghostimprint "audit ../competitor-app"`, `ghostimprint "probe https://suspect-site.com"`).
* **Multi-Domain Entanglement Archetypes**: Production-ready reference patterns across six core domains: State and Cache Mechanics, Spatial and 3D Engines, Scientific and Color Science, Networking and Rate Limiting, UI and Animation Design Systems, and Data/ML Pipelines.
* **Zero External Dependencies**: Operates 100% offline across Windows, macOS, and Linux using the native Node.js standard runtime and built-in crypto module with zero npm package requirements.
* **Application Receipt Ground Truth**: Every applied decision is logged per release and layer (`record`), oracle probe triggers are bound per release (`record-plan`), and releases are sealed to git commits and trees (`anchor`). The auditor compares suspect code against the receipt. Layers without recordings report UNMEASURED with the command that would make them measurable.
* **Durable Selftest**: Ships `scripts/ghostimprint-selftest.js`, a zero-dependency suite covering fail-closed identity, planted-fixture verdicts, receipt round-trips, anchor verification, and oracle verdict logic.

## Roadmap (In Development)
Planned items are not claimed as capabilities until delivered:
* Population error rates via a corpus baselining study. Until published, dossiers make no admissibility claim on their own.
* Layer 1 multi-word and multi-release matching (currently first word, one release).
* Layer 2 quotient verification of co-located operand pairs (currently literal presence).
* Layer 3 marker-sequence payload decoding against the child key (currently counts).
* Layer 6 rarity weighting by per-value range width and co-occurrence.
* Sovereign anchoring: OpenTimestamps plus optional on-chain attestation (future iteration). The notarized tier (RFC 3161 plus Rekor) is implemented; live interop passes stay supervised.
* An automated applier that places constants and writes the receipt in one step. Until then, agents apply by hand and log with `record`.
* Lexicon growth beyond the bundled 24 conditions.

## Usage
AI agents and developers invoke the GhostImprint Engine via conversational natural language commands or structured CLI flags:

* Interactive Setup & Key Ceremony: `node .skills/ghostimprint/scripts/ghostimprint.js init` or `ghostimprint "generate a new 15-word passphrase for this repo"`
* Record Applied Decision: `node .skills/ghostimprint/scripts/ghostimprint.js record --release 1.0.0 --layer l4 --site src/net.js:41 --value "..."`
* Anchor Release to Git: `node .skills/ghostimprint/scripts/ghostimprint.js anchor --release 1.0.0 --tag v1.0.0`
* Notarized Anchor (RFC 3161 plus Rekor): `node .skills/ghostimprint/scripts/ghostimprint.js anchor --release 1.0.0 --tier notarized`
* Privacy Recommendation: stay on the default local tier unless public proof of priority is worth a permanent public record. Notarized publishes only the commitment hash plus a derived public key, never source, and always asks for explicit consent first.
* Receipt Summary: `node .skills/ghostimprint/scripts/ghostimprint.js receipt`
* Assert Shields.io README Protection Badge: `node .skills/ghostimprint/scripts/ghostimprint.js badge` or `ghostimprint "add ghostimprint badge to readme"`
* Project Registry Dashboard: `node .skills/ghostimprint/scripts/ghostimprint.js list` or `ghostimprint "list my registered projects"`
* Key Rotation with Epoch Succession: `node .skills/ghostimprint/scripts/ghostimprint.js rotate` or `ghostimprint "rotate master key but preserve old releases"`
* Multi-Layer Repository Infringement Audit: `node .skills/ghostimprint/scripts/ghostimprint.js audit --target /path/to/suspect-repo`
* Remote Cloud SaaS Oracle Probe: `node .skills/ghostimprint/scripts/ghostimprint.js probe --url https://suspect-saas.com`
* Sealed Legal Dossier Generation: `node .skills/ghostimprint/scripts/ghostimprint.js export --target /path/to/suspect-repo --format all`

## Changelog
* **v5** : Renamed GhostPrint to GhostImprint. Audit and oracle report only measured evidence with explicit UNMEASURED labels. Audit fails closed without a vault. Added one way street warning to the key ceremony. Added application receipt workflow (record, record-plan, anchor, receipt commands), real Layer 4 stylometry matching against a bundled 24-condition lexicon, Layer 5 construct-choice agreement, Layer 8 git-tree anchor verification, receipt-driven oracle probe plans, tiered temporal anchors (local git plus notarized RFC 3161 and Rekor witnesses), and a durable zero-dependency selftest suite.
* **v4** : Added automatic GhostImprint README badge generation on project protection with dedicated CLI inspection and manual opt-out support.
* **v3** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v2** : Corrected box-drawing table column alignment for Layer 0 steganographic gradient in SKILL.md.
* **v1** : Initial release of the GhostImprint Engine featuring the 9-layer steganographic defense-in-depth architecture, Hierarchical Deterministic (HD) Ratchet Key Tree, interactive Spectral Cyan Key Ceremony with real-time entropy progress bar, Anti-Correlation Gatekeeper, Project-Segmented Vault Topology, Forensic Infringement Auditor, Remote Black-Box Oracle Probes, and court-admissible legal dossier generator.
