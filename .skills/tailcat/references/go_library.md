# Tailcat Go Library

Orientation for embedding Tailcat in custom programs. The library carries
no stability promise: pin versions and code against vendored source.

## Shape

* One side runs a listener and mints a short address. The other side dials
with that address. Traffic between them is end to end encrypted.
* Listeners serve TCP streams, UDP flows, and file or command services
depending on the program built atop them.
* Keysets persist identity across restarts. Ephemeral keysets die with the
process; saved keysets keep addresses stable with the same trust caveats
as CLI saved keys.

## When to Embed

* Custom TCP or UDP clients and servers that need NAT traversal without a
control plane.
* Products that mint per customer or per session addresses
programmatically.
* Test harnesses that need scripted tunnels with deterministic setup and
teardown.

## When to Stay on the CLI

* Human driven sharing, demos, and support sessions.
* File drops and directory shares without new code.
* Forced command automation where a shell script suffices.
* Anything where pinning a binary beats vendoring a moving API.

## Working Rules

* Vendor the exact version and read its source; never code from memory of
the API shape.
* Mirror CLI safety rules: ephemeral by default, allowlists for repeats,
tokens as secrets.
* Gate tests on direct paths where throughput matters, and tolerate relay
fallback everywhere else.
* Keep relay map configuration explicit in fleet deployments.
