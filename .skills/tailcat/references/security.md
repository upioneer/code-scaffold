# Tailcat Security

Threat model, key handling, and hardening rules. Read before publishing
anything or fencing anything valuable.

## Token Secrecy

* A token address is a capability: knowledge plus network reach equals
access on unrestricted servers. Treat tokens like passwords everywhere:
generation, transit, storage, logs, transcripts.
* Share tokens through private channels only. Expire the share by killing
the server for ephemeral keys, or by rotating keys plus allowlists for
saved ones.
* Redact tokens before pasting commands anywhere shared. Use `TOKEN`
placeholders in docs, tickets, and runbooks.
* Address inspection output (`parse`, `resolve`, full addresses) is secret
material with the same handling.

## Ephemeral Versus Saved Keys

* Ephemeral keys die with the process. One run, one address, zero future
reach. The safe default for demos, support sessions, and one off shares.
* Saved keys persist addresses across restarts and across everyone ever
given them. Assume every past recipient can knock.
* The CLI announces saved versus ephemeral at startup. Read that line every
time before sharing the address.
* Name saved keys per purpose (`deploy`, `support-alice`), audit with the
list command, delete deliberately when the purpose ends.
* Client and server defaults load automatically by role. Know which
identity is active before consequential commands.

## Pre-shared Keys

* PSKs stay enabled. They add post-quantum protection and shield peer
public keys from relay operators.
* The off switch exists only for ancient peers. Downgrading is a conscious
compatibility call with a named version pair, never a default.

## Allowlists and Auth

* Persistent or sensitive services restrict callers with `--allow` client
key rules. Unrestricted plus saved equals open door.
* Built-in SSH requires authorized keys from files or hosted accounts.
* Forced commands scope SSH to one operation; prefer them over full shells
for automation identities.
* Unauthenticated SSH is a lab tool: ephemeral key, tight allowlist,
short lifetime, never published, never on valuable hosts.

## DNS Exposure

* DNS TXT records are public, world readable, and actively scanned.
Publishing `tailcat=TOKEN` hands the address to the internet.
* Only publish behind allowlists or key auth. Never publish trusting
servers, especially unauthenticated SSH: that is a public shell.
* Keep the DNS safety probe on. It refuses connections when a DNS named
server accepts empty logins, which signals missing auth.
* Fixed regions stabilize published addresses across restarts.

## Surface Notes

* Served ports, ranges, and `all` widen reach linearly. Serve the minimum
set per task.
* Exit nodes expose whole networks, not single ports. Scope clients and
lifetimes accordingly.
* Write shares accept bytes from anyone holding the token. Fence with
allow lists and prune aggressively.
* Drop boxes hide contents but accept writes; directory mode additionally
reveals name existence through stat.
* SFTP rides built-in SSH unless a forced command replaces it. Forced
commands close the file surface.
* The browser demo relays through shared infrastructure only, with no
direct paths. Treat it as convenience, not capacity.

## Relay Trust

* Default relays are free, rate limited, best effort, and revocable. They
bootstrap connections and relay when NAT traversal fails.
* All traffic stays end to end encrypted; relays see ciphertext plus
metadata, never plaintext.
* Throughput tests refuse shared relays by design. Heavy or sensitive
traffic wants direct paths or private relays.
* Private relay fleets with pinned identities are the production shape for
teams.

## Stability Caveats

* No API or CLI stability promises: flags, output, and wire format may
change between versions. Pin versions and verify both peers.
* Shared relays carry no uptime or throughput targets. Design automation
with retries and direct path gating.
