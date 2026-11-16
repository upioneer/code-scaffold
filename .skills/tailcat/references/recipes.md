# Tailcat Recipes

Goal indexed server plus client pairs. `TOKEN` stands for the served
address; substitute the real value at run time and keep it out of logs.
Every pair assumes checked versions on both peers.

## Show a local app

App listens on server port 3000.

```sh
# Server: serve and share the printed token.
tailcat serve --key=new 3000
# Client: forward to a free local port and open it.
tailcat forward --open-browser TOKEN 0:3000
```

Headless clients omit `--open-browser` and open the printed listener
manually. Ctrl-C ends both sides.

## Reach several services

```sh
# Server: expose two ports at once.
tailcat serve 8080,3306
# Client: map each to a chosen local port.
tailcat forward TOKEN 18080:8080 3306
```

## Send text or bytes one shot

```sh
# Server: accept a single connection, print bytes, exit.
tailcat
# Client: pipe anything in.
printf 'hello\n' | tailcat TOKEN
```

## Collect files into a drop box

```sh
# Server: receive only, stay available.
tailcat recv ~/inbox
# Client: send one file.
tailcat cp report.pdf TOKEN:
```

Senders cannot list, download, or overwrite. Accept trees with
`recv --accept-dirs ~/inbox` on the server and `cp -r` on the client.

## Share a directory read only

```sh
# Server: offer the current directory.
tailcat serve files
# Client: list, then fetch.
tailcat ls -l TOKEN
tailcat cp TOKEN:report.pdf .
```

## Run a two way share

```sh
# Server: explicit path with read write mode.
tailcat serve --files=/srv/share:rw files
# Client: recursive upload and download.
tailcat cp -r photos TOKEN:photos
tailcat cp TOKEN:shared.zip .
```

## Shell through an existing daemon

```sh
# Server: expose SSH, keeping its own auth.
tailcat serve 22
# Client: shell or one command.
tailcat ssh TOKEN
tailcat ssh TOKEN uname -a
```

Username and alternate ports: `ssh user@TOKEN`, `ssh -p 2222 TOKEN`.

## Serve built-in SSH with keys

```sh
# Server: authorized keys from a file plus a hosted account.
tailcat serve --ssh-authorized-keys=~/.ssh/authorized_keys,alice@github ssh
# Client: connect normally.
tailcat ssh TOKEN
```

Hosted keys fetch at startup. Restrictions like `command=` are ignored;
use forced commands for scoping instead.

## Run one remote operation

```sh
# Server: every session runs the deploy script, no shell.
tailcat serve --ssh-authorized-keys=alice@github ssh -- ./deploy.sh
# Client: invoking anything runs the forced program.
tailcat ssh TOKEN
```

Client requested commands arrive in `SSH_ORIGINAL_COMMAND` for the forced
program to inspect, never auto executed.

## Disposable unauthenticated shell

```sh
# Server: lab only, fenced to one known client key.
tailcat serve --key=new --allow=Nodekey:CLIENT_PUBLIC_KEY no-auth-ssh
# Client: connect directly.
tailcat ssh TOKEN
```

Anyone with the token connects unless `--allow` fences it. Never publish
this shape.

## Browse through the tunnel

```sh
# Server: serve the target port.
tailcat serve 8081
# Client: wrap one command in SOCKS.
tailcat socks TOKEN curl http://server.tailcat:8081/
```

Standalone proxy: bare `socks TOKEN` with a selectable listener. Token
hostnames work for CLI tools, not browsers.

## Reach the far LAN

```sh
# Server: exit node mode.
tailcat serve exit-node
# Client: pick the access shape.
tailcat socks TOKEN curl https://internal.example/
tailcat forward TOKEN 0:192.168.1.10:3000
tailcat ssh -p 192.168.1.10:22 TOKEN
```

Mapping shape is `LOCAL:REMOTE_IP:REMOTE_PORT`. UDP rides SOCKS ASSOCIATE
plus exit node; plain forward stays TCP.

## Publish a repeatable address

```sh
# Client: mint an identity and share the public key.
tailcat genkey --client --key=client-default
tailcat printpub
# Server: stable identity, fixed region, fenced callers.
tailcat genkey --key=default --fixed-region
tailcat serve --allow=Nodekey:CLIENT_PUBLIC_KEY 3000
```

Publish `tailcat=TOKEN` as a DNS TXT record, then use the name anywhere a
token goes: `tailcat ssh my-server.example.com`. DNS is public, so the
allowlist or key auth is mandatory, and the DNS safety probe stays on.

## Automate a share

```sh
# Server: emit JSON and hand the address to a file.
tailcat serve --json --key=new 3000
TAILCAT_ADDR_FILE=/run/tailcat.addr tailcat serve 3000
# Client: read the address and connect.
tailcat forward --open-browser "$(cat /run/tailcat.addr)" 0:3000
```

Resolve short addresses once for clients that should skip relay lookups,
or serve with the full address flag directly.

## Prove the path

```sh
# Server: throughput service.
tailcat serve perf
# Client: connectivity first, then load.
tailcat ping --until-direct --timeout=30s TOKEN
tailcat perf TOKEN
```

Perf needs a direct path and refuses shared relays. JSON output feeds
dashboards and gates.

## Pipe raw TCP

```sh
# Server: byte stream on a chosen remote port.
tailcat
# Client: pipe without a local listener.
tailcat TOKEN 8080 < input.bin > output.bin
```

Use for database tunnels, test fixtures, and protocol debugging where no
local port should exist.
