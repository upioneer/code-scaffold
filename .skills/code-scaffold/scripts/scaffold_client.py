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
