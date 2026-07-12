---
name: Code Scaffold Harness
description: Agent harness for headlessly deploying Code Scaffold assets.
---

# Code Scaffold Agent Harness

This skill equips you with the instructions to interact with the Code Scaffold binary strictly from the CLI/headless interface. Code Scaffold is an advanced code-generation engine that outputs architecture assets for projects.

## Reference Website
https://code-scaffold.web.app/

## Installation & Availability
The Code Scaffold binary is typically provided natively via `code-scaffold.exe` on Windows or `code-scaffold` on Unix. If it is not immediately present in your PATH or working directory, you must acquire the precompiled binary from the project's official distributions or compile it from source via `cargo build --release`.

## Headless CLI Syntax

Code Scaffold supports a fully headless deployment mode that allows agents to bypass the TUI entirely.

To view the raw machine-readable JSON structure of available artifacts, personas, skills, and licenses, use the `/help` flag:
```bash
code-scaffold.exe /help
```

To execute a headless deployment, you must provide the `--headless` flag along with the absolute target directory. You can optionally comma-separate artifacts, skills, and personas:
```bash
code-scaffold.exe --headless --target "/absolute/path/to/target" --personas "Web Dev,AI Systems Engineer" --artifacts "readme.md,.gitignore" --skills "github,typescript" --license "MIT" --json-output
```

### Argument Details
* `--target` (Required): The absolute path to the directory where you want to scaffold the project.
* `--personas` (Optional): A comma-separated list of persona labels (e.g. `Web Dev`, `DBA`).
* `--artifacts` (Optional): A comma-separated list of core artifacts (e.g. `readme.md`, `apps/`, `packages/`, `.gitignore`).
* `--skills` (Optional): A comma-separated list of agent skills (e.g. `github`, `firebase`).
* `--license` (Optional): An open source license label (e.g. `MIT`).
* `--json-output` (Optional): Outputs execution results in a strictly machine-readable JSON payload, suppressing all standard TUI logs. Perfect for programmatic integration.
* `--dry-run` (Optional): Constructs the deployment manifest and outputs it as JSON (when combined with `--json-output`) without executing any file modifications.
* `--version-json` (Optional): Outputs the current Code Scaffold version as a JSON object (e.g. `{"version": "5.9.0"}`).

### Best Practices for Agents
1. Before deploying, always query `code-scaffold.exe /help` to ingest the absolute list of currently available labels. The labels are matched in a case-insensitive manner.
2. Ensure your `--target` path is fully resolved and absolute.
3. Monitor the stdout of the headless execution for realtime deployment logs and success confirmations.

## Scaffold Connect (OTA Bridging)

Code Scaffold features a zero-trust, ephemeral WebSocket bridge ("Scaffold Connect") that allows you (the agent) to securely tap into a user's local terminal and execute commands remotely. 

If a user prompts you with a connection URI like `scaffold://063238@6rkkIbQqN8In5UjNZ0ugnU4Hs86C3GKCX7zAomXY/H8=`, do NOT attempt to write your own custom bridge connection scripts from scratch. Instead, **strictly follow these steps**:

1. Ensure your environment has the required dependencies by running:
   ```bash
   pip install websockets cryptography
   ```

2. Save the following exact Python script to `/tmp/scaffold_client.py` (or a similar scratch directory):
   ```python
   import sys, json, base64, os, asyncio, websockets
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM

   async def run_command(uri, cmd):
       try:
           pin, b64key = uri.replace("scaffold://", "").split("@")
           key = base64.b64decode(b64key)
           aesgcm = AESGCM(key)
       except Exception as e:
           print(f"Error parsing URI: {e}")
           return

       url = f"wss://code-scaffold-relay.upioneer.deno.net/room/{pin}"
       
       async with websockets.connect(url) as ws:
           def send_msg(payload):
               nonce = os.urandom(12)
               ciphertext = aesgcm.encrypt(nonce, json.dumps(payload).encode('utf-8'), None)
               return ws.send(nonce + ciphertext)

           # 1. Initialize
           await send_msg({
               "jsonrpc": "2.0", 
               "id": 1, 
               "method": "initialize", 
               "params": {"clientInfo": {"name": "ScaffoldAgent"}}
           })
           
           # 2. Execute Command
           await send_msg({
               "jsonrpc": "2.0", 
               "id": 2, 
               "method": "execute_command", 
               "params": {"command": cmd}
           })
           
           # 3. Listen for response
           while True:
               msg = await ws.recv()
               nonce, ciphertext = msg[:12], msg[12:]
               try:
                   plaintext = aesgcm.decrypt(nonce, ciphertext, None)
                   data = json.loads(plaintext.decode('utf-8'))
                   if data.get("id") == 2 and "result" in data:
                       print(data["result"])
                       break
               except Exception:
                   pass

   if __name__ == "__main__":
       if len(sys.argv) < 3:
           print('Usage: python scaffold_client.py "scaffold://URI" "command"')
           sys.exit(1)
       asyncio.run(run_command(sys.argv[1], sys.argv[2]))
   ```

3. Execute remote commands on the user's machine by invoking the script with the exact URI and your desired command:
   ```bash
   python /tmp/scaffold_client.py "scaffold://063238@6rkk..." "cargo build"
   ```
   The script will securely connect, execute the command, print the `stdout`/`stderr` from the user's machine, and cleanly exit.
