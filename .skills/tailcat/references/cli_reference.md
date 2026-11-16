# Tailcat CLI Reference

Command and flag catalog with roles. Flags evolve without stability
promises, so confirm against the installed `tailcat COMMAND --help` before
relying on any entry here.

## Top Level

* `tailcat`: bare server accepting one byte stream connection on stdin and
stdout, then exits. The simplest possible pipe.
* `tailcat TOKEN`: raw client piping stdin and stdout to the server. No
local listener.
* `tailcat TOKEN REMOTE`: raw client with a remote port or host colon port
target instead of the default stream.
* `tailcat version`: print versions of both peers when diagnosing; mismatch
explains most syntax surprises.
* `tailcat readme`: full embedded manual for the installed version.
* `tailcat --verbose <command>`: diagnostics for hangs and path problems.
* `tailcat --json <command>`: JSON output where the command supports it
(address emission, perf results).

## serve (server side)

* `serve PORTS`: expose local TCP ports. Accepts single ports, comma
lists, ranges (`8000-8999`), and `all`. Prefer the minimum set.
* `serve files`: offer the current directory read only over SFTP.
* `serve --files=PATH:MODE files`: share an explicit path with a mode:
`:ro` read only default, `:rw` read write, `:wo` flat write only,
`:wo+` recursive write only.
* `serve ssh`: built-in SSH server. Pair with
`--ssh-authorized-keys=...` for key auth; supports SFTP unless a forced
command is set.
* `serve no-auth-ssh`: built-in SSH with no authentication. Disposable
labs only, always fenced with `--allow`, never published.
* `serve ssh -- ./command args`: forced command replacing the shell for
every session. Client commands arrive in `SSH_ORIGINAL_COMMAND`.
* `serve perf`: throughput test service for `perf` clients.
* `serve exit-node`: expose the server network for SOCKS, mapped forward,
and mapped SSH clients.
* `serve --key=new ...`: force an ephemeral identity for one off shares.
* `serve --key=NAME ...`: serve under a saved identity.
* `serve --allow=RULE ...`: restrict callers, e.g.
`Nodekey:CLIENT_PUBLIC_KEY`. Required for persistent or sensitive shares.
* `serve --full-address ...`: print the long self contained address with
embedded relay info.
* `serve --ssh-authorized-keys=SOURCES ssh`: key sources accept local
paths, `user@github` fetched at startup, and comma combinations.
* `serve --psk=false ...`: compatibility with ancient clients. Weakens
protection; never a default.

## forward and browse (client side)

* `forward TOKEN REMOTE`: map a remote port to local `localhost:REMOTE`.
The remote side is required.
* `forward TOKEN LOCAL:REMOTE`: pin the local port.
* `forward TOKEN 0:REMOTE`: pick a free local port automatically.
* `forward TOKEN LOCAL:HOST:REMOTE`: reach a far LAN host through an exit
node server.
* Multiple mappings in one call serve multi service sessions.
* `forward --bind=ADDR ...`: listener interface, loopback by default.
Binding all interfaces exposes the forward to the client LAN.
* `forward --open-browser TOKEN 0:REMOTE`: open the app when the listener
is ready. Exactly one mapping.
* `browse TOKEN`: shorthand for remote port 80 with browser open.

## Files

* `recv DIR`: drop box receiver staying available. Clients can only add
files, never list, read back, or overwrite.
* `recv --accept-dirs DIR`: allow directory trees, which permits creation
plus stat and reveals name existence.
* `cp FILE TOKEN:`: send a file into a drop box.
* `cp -r DIR TOKEN:PATH`: recursive upload to a writeable share.
* `cp TOKEN:FILE .`: download from a readable share.
* `ls TOKEN`: list a readable share. Drop boxes refuse listing.

## Shells

* `ssh TOKEN`: shell through forwarded or built-in SSH.
* `ssh TOKEN command args`: one remote command.
* `ssh user@TOKEN`: explicit username.
* `ssh -p PORT TOKEN`: alternate SSH port.
* `ssh -p HOST:PORT TOKEN`: far LAN host through an exit node server.

## Proxies

* `socks TOKEN <command>`: run one proxy aware command through SOCKS5 over
the tunnel.
* `socks TOKEN`: standalone SOCKS proxy with selectable listener.
* `socks curl http://TOKEN:PORT/`: token as URL hostname for CLI tools.
Browsers lowercase hostnames and fail.
* SOCKS carries UDP ASSOCIATE for apps that speak it. Plain proxy env vars
do not tunnel arbitrary UDP.

## Diagnostics

* `ping TOKEN`: pong per attempt with relay versus direct path noted.
* `ping --until-direct --timeout=30s TOKEN`: gate on a direct path, nonzero
exit when none appears.
* `perf TOKEN`: TCP throughput for 10 seconds with per second progress and
loaded latency stats. Refuses shared relays; needs a direct path.
* `perf --reverse`, `--bidir`, `--udp`, `--parallel`, `--bitrate`: direction,
protocol, and stream controls for deeper tests.

## Addresses and keys

* `parse TOKEN`: offline decode to public key plus relay info as JSON.
* `resolve TOKEN`: expand a short address to self contained form so clients
skip the relay map lookup. Treat output as secret.
* `genkey`: create a saved identity.
* `genkey --client`: create a client identity for allowlists.
* `genkey --key=NAME`: name the identity. `default` auto loads once it
exists; `--key=new` forces ephemeral.
* `genkey --fixed-region`, `--region=NAME`, `--region=list`: pin or list
bootstrap regions for stable published addresses.
* `genkey --list`: audit saved keys.
* `genkey --delete --key=NAME`: deliberate removal.
* `genkey --region=derp.example.com`: bind an identity to a private relay.
* `printpub`: show the effective client public key for sharing with server
operators.
* `--derpmap-url=URL` and `TAILCAT_DERPMAP_URL`: fleet relay map on both
sides.

## Automation

* `--json`: address and result JSON for scripts.
* `TAILCAT_ADDR_FILE=/path`: write the served address to a file.
* `TAILCAT_ADDR_FILE=tcp:host:port`: deliver the address to a listener.
* DNS TXT `tailcat=TOKEN` under a name lets every command take the name
instead of the token. Pair with allowlists or key auth, never with
trusting servers.
* `--skip-dns-safety-check`: bypasses the unauthenticated login probe for
DNS named SSH. Fix server auth instead.
