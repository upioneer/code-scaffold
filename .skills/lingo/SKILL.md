---
name: Lingo
description: Deterministic shorthand glossary that maps user lingo, acronyms, and abbreviations to their full meanings for faster, unambiguous communication.
version: 4
---

# Lingo: Shorthand Decoder & Communication Accelerator

This skill serves as a deterministic glossary for interpreting shorthand, acronyms, slang, and abbreviations commonly used by users when communicating with AI agents. By internalizing this mapping, the agent eliminates guesswork, reduces user typing effort, and guarantees correct interpretation on the first pass.

## Agent Directives

1. **Initialization Prompt**: Immediately upon loading this skill or starting a new conversation, you MUST explicitly prompt the user: *"Would you like Lingo to apply only to your inputs (Input-Only Mode), or to both our inputs and my outputs (Bidirectional Mode)?"* Wait for their preference before proceeding.
2. **Bidirectional Mode**: If the user selects Bidirectional Mode, you MUST aggressively use the shorthand terms from the glossary in your own responses to compress token count and speed up delivery. (e.g., instead of "I definitely recommend a database for the backend", say "I def recommend a db for the be").
3. **Passive Decoding**: When the user's message contains any term from the glossary below, silently expand it to its full meaning in your internal reasoning. Do NOT echo back the expansion to the user or ask for clarification on recognized terms.
4. **Context-Aware Resolution**: Some abbreviations have multiple meanings depending on context (e.g., `rc` can mean "release candidate" or "run commands file", `fb` can mean "Firebase" or "Facebook"). Use surrounding context to select the correct expansion. If genuinely ambiguous, ask the user.
3. **Case Insensitivity**: All glossary terms are case insensitive. `ATM`, `atm`, and `Atm` all resolve identically.
4. **Composability**: Users may chain multiple abbreviations in a single message (e.g., "can u check the pr deps rn"). Expand all of them independently.
5. **Passthrough**: If a term is not in the glossary, treat it normally. Do not attempt to guess abbreviations that are not explicitly listed.
6. **User Extensibility**: If the user explicitly defines a new abbreviation during the conversation (e.g., "when I say X, I mean Y"), honor it for the remainder of the session and treat it with the same priority as glossary terms.

---

## Glossary

### Conversational & General

| Shorthand | Expansion |
| :--- | :--- |
| `abt` | about |
| `afaik` | as far as I know |
| `afk` | away from keyboard |
| `aight` | alright |
| `approx` | approximately |
| `asap` | as soon as possible |
| `atm` | at the moment |
| `b/c` or `bc` | because |
| `bet` | I agree / confirmed |
| `brb` | be right back |
| `btw` | by the way |
| `cob` | close of business |
| `convo` | conversation |
| `def` | definitely |
| `diff` | different / difference |
| `dm` | direct message |
| `dw` | don't worry |
| `eod` | end of day |
| `eom` | end of message |
| `eow` | end of week |
| `esp` | especially |
| `eta` | estimated time of arrival |
| `fr` | for real |
| `fwiw` | for what it's worth |
| `fyi` | for your information |
| `gl` | good luck |
| `gotcha` | I understand |
| `gtg` | got to go |
| `hmu` | hit me up / let me know |
| `idc` | I don't care |
| `idk` | I don't know |
| `iirc` | if I recall correctly |
| `imo` | in my opinion |
| `imho` | in my humble opinion |
| `info` | information |
| `lmk` | let me know |
| `mb` | my bad |
| `misc` | miscellaneous |
| `msg` | message |
| `ngl` | not gonna lie |
| `np` | no problem |
| `nvm` | never mind |
| `nw` | no worries |
| `obv` | obviously |
| `ofc` | of course |
| `ooo` | out of office |
| `perf` | perfect (conversational) / performance (technical) |
| `ping` | send a quick message / check in |
| `pls` or `plz` | please |
| `pov` | point of view |
| `prev` | previous |
| `prob` or `prolly` | probably |
| `pto` | paid time off |
| `rn` | right now |
| `smh` | shaking my head (expressing frustration) |
| `smth` or `sth` | something |
| `sot` | source of truth |
| `sync` | synchronize / sync meeting |
| `tba` | to be announced |
| `tbd` | to be determined |
| `tbf` | to be fair |
| `tbh` | to be honest |
| `tho` | though |
| `thx` or `ty` | thank you |
| `tldr` | too long; didn't read (give me the summary) |
| `u` | you |
| `ur` | your / you're |
| `w/` | with |
| `w/o` | without |
| `wdyt` | what do you think |
| `wfh` | working from home |
| `wym` | what do you mean |
| `ymmv` | your mileage may vary |
| `yolo` | you only live once, meaning hold nothing back in this moment |
| `bussin` | exceptionally good or delicious |
| `cap` | a lie |
| `crash out` | clear display of frustration, losing self control |
| `drip` | stylish clothing or excellent fashion sense |
| `full send` | 100 percent or more |
| `ghost` | to completely stop communicating with someone without warning |
| `mid` | below average or mediocre quality |
| `no cap` | not a lie |
| `rizz` | charisma |
| `salty` | feeling bitter or upset about a situation |
| `slaps` | exceptionally good quality, mostly referring to music or audio |
| `sus` | suspicious or questionable behavior |
| `tea` | gossip or exclusive news |

### Technical & Development

| Shorthand | Expansion |
| :--- | :--- |
| `alloc` | allocation |
| `api` | application programming interface |
| `arg` / `args` | argument / arguments |
| `auth` | authentication |
| `authn` | authentication |
| `authz` | authorization |
| `be` | backend |
| `bin` | binary |
| `bool` | boolean |
| `cdn` | content delivery network |
| `cfg` | configuration |
| `ci` | continuous integration |
| `cd` | continuous deployment |
| `cli` | command line interface |
| `creds` | credentials |
| `db` | database |
| `dealloc` | deallocation |
| `dep` / `deps` | dependency / dependencies |
| `dev` | development |
| `devex` or `dx` | developer experience |
| `devops` | development operations |
| `dir` / `dirs` | directory / directories |
| `dns` | domain name system |
| `e2e` | end to end |
| `env` | environment |
| `enviro` | environment |
| `fe` | frontend |
| `fmt` | format / formatter |
| `fn` or `func` | function |
| `fs` | file system |
| `gc` | garbage collection |
| `gui` | graphical user interface |
| `iam` | identity and access management |
| `impl` | implementation / implement |
| `infra` | infrastructure |
| `int` | integration |
| `js` | JavaScript |
| `k8s` | Kubernetes |
| `lib` | library |
| `lint` | linter / linting |
| `mem` | memory |
| `mvp` | minimum viable product |
| `oom` | out of memory |
| `os` | operating system |
| `param` / `params` | parameter / parameters |
| `pkg` | package |
| `poc` | proof of concept |
| `prod` | production |
| `py` | Python |
| `qa` | quality assurance |
| `rb` | Ruby |
| `rc` | release candidate |
| `refactor` or `refac` | restructure code without changing behavior |
| `regex` | regular expression |
| `repo` | repository |
| `req` / `res` | request / response |
| `repro` | reproduce / reproduction |
| `rs` | Rust |
| `sdk` | software development kit |
| `segfault` | segmentation fault |
| `sg` | security group |
| `ssl` | secure sockets layer |
| `stderr` | standard error |
| `stdin` | standard input |
| `stdout` | standard output |
| `stg` | staging |
| `tf` | Terraform |
| `tls` | transport layer security |
| `ts` | TypeScript |
| `ui` | user interface |
| `ux` | user experience |
| `var` / `vars` | variable / variables |
| `vm` | virtual machine |
| `vpc` | virtual private cloud |

### Platforms & Services

| Shorthand | Expansion |
| :--- | :--- |
| `aws` | Amazon Web Services |
| `az` | Azure |
| `cf` | Cloudflare / CloudFormation (context dependent) |
| `do` | DigitalOcean |
| `fb` | Firebase / Facebook (context dependent) |
| `fly` | Fly.io |
| `gcp` | Google Cloud Platform |
| `gh` | GitHub |
| `hf` | Hugging Face |
| `mongo` | MongoDB |
| `ng` | Nginx |
| `pg` | PostgreSQL |
| `rw` | Railway |
| `sb` | Supabase |
| `vsc` or `vscode` | Visual Studio Code |

### Infrastructure & Enterprise

| Shorthand | Expansion |
| :--- | :--- |
| `alb` | Application Load Balancer |
| `asg` | Auto Scaling Group |
| `capex` | capital expenditure |
| `cdk` | Cloud Development Kit |
| `cft` | CloudFormation Template |
| `cidr` | classless inter-domain routing |
| `coe` | center of excellence |
| `cogs` | cost of goods sold |
| `dc` | data center |
| `dr` | disaster recovery |
| `ec2` | Elastic Compute Cloud |
| `ecr` | Elastic Container Registry |
| `ecs` | Elastic Container Service |
| `eks` | Elastic Kubernetes Service |
| `fw` | firewall |
| `ha` | high availability |
| `iac` | infrastructure as code |
| `iops` | input/output operations per second |
| `kpi` | key performance indicator |
| `lb` | load balancer |
| `mtbf` | mean time between failures |
| `mttf` | mean time to failure |
| `mttr` | mean time to recovery |
| `nat` | network address translation |
| `nic` | network interface controller |
| `nlb` | Network Load Balancer |
| `okr` | objectives and key results |
| `opex` | operational expenditure |
| `rds` | Relational Database Service |
| `roi` | return on investment |
| `rpo` | recovery point objective |
| `rto` | recovery time objective |
| `s3` | Simple Storage Service (AWS) |
| `sla` | service level agreement |
| `sli` | service level indicator |
| `slo` | service level objective |
| `sns` | Simple Notification Service (AWS) |
| `sqs` | Simple Queue Service (AWS) |
| `vlan` | virtual local area network |
| `waf` | Web Application Firewall |

### Architecture & Design Patterns

| Shorthand | Expansion |
| :--- | :--- |
| `bdd` | behavior driven development |
| `bff` | backend for frontend |
| `cqrs` | command query responsibility segregation |
| `crud` | create, read, update, delete |
| `dao` | data access object |
| `di` | dependency injection |
| `ddd` | domain driven design |
| `dry` | don't repeat yourself |
| `dto` | data transfer object |
| `faas` | functions as a service |
| `gql` | GraphQL |
| `grpc` | gRPC remote procedure call |
| `iaas` | infrastructure as a service |
| `ioc` | inversion of control |
| `kiss` | keep it simple, stupid |
| `mq` | message queue |
| `orm` | object relational mapping |
| `paas` | platform as a service |
| `pub/sub` | publish / subscribe |
| `rest` | representational state transfer |
| `saas` | software as a service |
| `solid` | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion |
| `sse` | server-sent events |
| `tdd` | test driven development |
| `ws` | WebSocket |
| `yagni` | you ain't gonna need it |

### Security

| Shorthand | Expansion |
| :--- | :--- |
| `2fa` | two factor authentication |
| `abac` | attribute based access control |
| `cert` / `certs` | certificate / certificates |
| `cors` | cross origin resource sharing |
| `csp` | content security policy |
| `csrf` | cross site request forgery |
| `cve` | Common Vulnerabilities and Exposures |
| `gdpr` | General Data Protection Regulation |
| `jwt` | JSON web token |
| `mfa` | multi factor authentication |
| `oauth` | open authorization |
| `owasp` | Open Web Application Security Project |
| `pen test` | penetration test |
| `pii` | personally identifiable information |
| `phi` | protected health information |
| `rbac` | role based access control |
| `soc2` | Service Organization Control 2 |
| `sqli` | SQL injection |
| `sso` | single sign on |
| `xss` | cross site scripting |

### Data, AI & Analytics

| Shorthand | Expansion |
| :--- | :--- |
| `ai` | artificial intelligence |
| `bi` | business intelligence |
| `cv` | computer vision |
| `dl` | deep learning |
| `elt` | extract, load, transform |
| `etl` | extract, transform, load |
| `ft` | fine tuning |
| `gpu` | graphics processing unit |
| `llm` | large language model |
| `ml` | machine learning |
| `nlp` | natural language processing |
| `rag` | retrieval augmented generation |
| `rl` | reinforcement learning |
| `rlhf` | reinforcement learning from human feedback |
| `tpu` | tensor processing unit |

### Code Review & Workflow

| Shorthand | Expansion |
| :--- | :--- |
| `ack` | acknowledged |
| `cr` | code review |
| `ff` | fast-forward (merge) |
| `ga` | general availability / GitHub Actions (context dependent) |
| `gha` | GitHub Actions |
| `hf` | hotfix (git context) / Hugging Face (platform context) |
| `lgtm` | looks good to me |
| `mr` | merge request |
| `nack` or `nak` | not acknowledged |
| `nit` | minor nitpick (code review) |
| `p0` / `p1` / `p2` | priority 0 / priority 1 / priority 2 (severity levels) |
| `pr` | pull request |
| `ptal` | please take a look |
| `rca` | root cause analysis |
| `retro` | retrospective |
| `rfr` | ready for review |
| `sev1` / `sev2` | severity 1 / severity 2 |
| `sgtm` | sounds good to me |
| `sha` | commit hash |
| `standup` | daily standup meeting |
| `wip` | work in progress |
| `1:1` or `1on1` | one on one meeting |

### Code Scaffold Project Specific

| Shorthand | Expansion |
| :--- | :--- |
| `cs` | Code Scaffold |
| `sc` | Scaffold Connect |
| `tui` | terminal user interface |

---

## Ambiguity Resolution Rules

When a term has multiple possible expansions, apply these resolution rules in order:

1. **Surrounding Technical Context**: If the message discusses code, infrastructure, or development workflows, prefer the technical expansion (e.g., `perf` → "performance", `dev` → "development", `rc` → "release candidate").
2. **Surrounding Conversational Context**: If the message is casual or non-technical, prefer the conversational expansion (e.g., `perf` → "perfect", `dev` → a person/developer).
3. **Platform Context**: If the message discusses a specific cloud provider, framework, or service, prefer the platform expansion (e.g., `fb` near "hosting" or "auth" → "Firebase", `fb` near "social" or "ads" → "Facebook"; `cf` near "DNS" or "tunnel" → "Cloudflare", `cf` near "AWS" or "stack" → "CloudFormation").
4. **Project Context**: If the message is clearly about Code Scaffold internals, prefer project-specific expansions (e.g., `cs` → "Code Scaffold").
5. **Ask**: If context is insufficient to disambiguate, ask the user once. Cache their answer for the session.

## Non-Goals

* This skill does NOT auto-correct spelling errors. It only maps explicitly listed abbreviations.
* This skill does NOT translate between natural languages. It operates exclusively on English shorthand.
