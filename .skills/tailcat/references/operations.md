# Tailcat Operations

Installs, automation, fleets, and the troubleshooting matrix.

## Install Matrix

* Static binaries for Linux and Windows, plus Debian and RPM packages.
* Homebrew on macOS, Scoop on Windows, Snap on Linux.
* Container images for Linux workers, Nix and Arch and conda-forge for
managed environments.
* Build from source with a Go toolchain for the rest, including BSDs and
the browser demo target.
* Android runs the Linux binary for the device architecture under Termux
or an adb shell, using Android DNS and certificates.
* After install: `tailcat version` on both peers, then `tailcat readme`
for the embedded manual of that exact build.

## Version Discipline

* The CLI makes no stability promises. Verify both peer versions before
every consequential session.
* Read the installed `--help` for the command in use. Never trust recalled
flags across versions.
* Pin versions in automation and fleets. Mixed fleets get the lowest
common flag set.
* When syntax surprises appear, suspect version skew before suspecting the
network.

## Automation Patterns

* Emit `--json` addresses and hand them to files or TCP listeners for
downstream steps.
* Gate scripts on `ping --until-direct` with explicit timeouts before
throughput sensitive work.
* Collect `perf --json` into dashboards; alert on relay fallback where
direct is required.
* Wrap servers in process supervisors with restarts, and rotate ephemeral
shares on a schedule.
* Keep tokens in memory or secret stores, never in argv visible files,
filenames, or logs.

## Relay Fleets

* Start on default relays for bootstrap and light use.
* Graduate teams to private relays with pinned identities on both sides
and a custom relay map URL.
* Monitor relay versus direct ratios; a fleet stuck on relays has a NAT
or firewall story to fix.
* Throughput tests against private relays use the relayed flag; shared
relays stay off limits for load tests.

## Troubleshooting Matrix

* **Handshake hangs:** relay or firewall block. Try verbose, another
region, then a private relay.
* **Stuck on relay:** NAT traversal failed. Still encrypted, just slower.
Check UDP egress and try `--until-direct` with patience.
* **Syntax surprise:** version skew. Compare `version` output and read the
older peer help.
* **Red refused connection:** wrong token, dead ephemeral server, or
allowlist mismatch. Reissue or fix rules.
* **SSH prompts unexpectedly:** forwarded daemon auth versus built-in keys
confusion. Confirm which SSH answers and which keys it wants.
* **`cp` failures:** system `scp` missing or ancient. Modern OpenSSH
selects SFTP automatically; older stacks need attention.
* **Browser hostname fails:** browsers lowercase token hostnames. CLI tools
only for token URLs.
* **DNS name fails:** missing TXT, propagation lag, or the safety probe
refusing an unauthenticated server. Fix auth, keep the probe on.
* **Slow transfers:** relay path or compressed already data. Confirm
direct path, compress first, parallelize.
* **Port busy on forward:** local collision. Use `0:` auto select or pick
another local port.
* **Dropped sessions:** either side exited. Both processes must live for
the session lifetime; supervise them.

## Safety Checks Before Sharing

* Ephemeral key for one offs, named saved key plus allowlist for repeats.
* Minimum ports, tightest share mode, shortest lifetime that fits the task.
* Token moves over a private channel; never in group chat, tickets, or DNS
without auth behind it.
* State who can connect and what they reach before starting the server.
