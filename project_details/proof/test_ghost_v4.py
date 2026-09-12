#!/usr/bin/env python3
"""
Test harness for Ghost Browser v4 upgrades:
- Auth Vault (Fernet encryption / decryption / inspection roundtrip)
- Text Perception (Semantic tree outline, context window search, PII scrubbing)
- Witness Audit (Ed25519 signature generation, hash chaining, tamper detection)
"""

import os
import sys
import json
import subprocess

def test_auth_vault():
    print("[*] Testing Ghost Vault...")
    key_out = subprocess.check_output([sys.executable, ".skills/stealth-browser/scripts/auth_vault.py", "--generate-key"]).decode("utf-8")
    key = [line.split(": ")[1].strip() for line in key_out.splitlines() if line.startswith("Key: ")][0]

    sample_state = {
        "cookies": [{"name": "session_token", "value": "secret_session_val_123", "domain": "example.com", "path": "/"}],
        "origins": []
    }
    with open("project_details/proof/temp_session.json", "w", encoding="utf-8") as f:
        json.dump(sample_state, f)

    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/auth_vault.py", "--export", "project_details/proof/temp_session.json", "--output", "project_details/proof/temp_profile.ghostvault", "--key", key])
    
    inspect_out = subprocess.check_output([sys.executable, ".skills/stealth-browser/scripts/auth_vault.py", "--inspect", "project_details/proof/temp_profile.ghostvault", "--key", key]).decode("utf-8")
    assert "total_cookies" in inspect_out, "Inspect output missing total_cookies"
    
    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/auth_vault.py", "--import", "project_details/proof/temp_profile.ghostvault", "--output", "project_details/proof/temp_restored.json", "--key", key])
    with open("project_details/proof/temp_restored.json", "r", encoding="utf-8") as f:
        restored = json.load(f)
    assert restored["cookies"][0]["value"] == "secret_session_val_123", "Restored cookie value mismatch"

    for p in ["project_details/proof/temp_session.json", "project_details/proof/temp_profile.ghostvault", "project_details/proof/temp_restored.json"]:
        if os.path.exists(p):
            os.remove(p)

    print("  [OK] Ghost Vault export, inspect, and import roundtrip succeeded.")

def test_text_perception():
    print("[*] Testing Ghost Perception & PII Scrubber...")
    sample_html = """
    <html><body>
      <nav><a href='/home'>Home</a><a href='/about'>About</a></nav>
      <h1>Welcome to Portal</h1>
      <form action='/login'>
        <label for='user'>Username</label>
        <input id='user' name='username' type='text' placeholder='Enter username' />
        <label for='pwd'>Password</label>
        <input id='pwd' name='password' type='password' value='supersecretpass' />
        <button type='submit'>Sign In</button>
      </form>
    </body></html>
    """
    html_path = "project_details/proof/temp_page.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(sample_html)

    outline_out = subprocess.check_output([sys.executable, ".skills/stealth-browser/scripts/text_perception.py", "--file", html_path, "--outline"]).decode("utf-8")
    assert "Sign In" in outline_out, "Outline missing 'Sign In'"
    assert "[SCRUBBED_PASSWORD]" in outline_out, "PII scrubber did not redact password value"

    query_out = subprocess.check_output([sys.executable, ".skills/stealth-browser/scripts/text_perception.py", "--file", html_path, "--query", "Sign In", "--context", "2"]).decode("utf-8")
    assert "Context Before" in query_out, "Context search missing 'Context Before'"

    if os.path.exists(html_path):
        os.remove(html_path)

    print("  [OK] Ghost Perception semantic outline and context query succeeded.")

def test_witness_audit():
    print("[*] Testing Ghost Witness Cryptographic Audit Chain...")
    chain_file = "project_details/proof/temp_audit.json"
    key_file = "project_details/proof/temp_audit.key"

    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--init", "--chain", chain_file, "--key-file", key_file])
    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--log-action", "--chain", chain_file, "--key-file", key_file, "--action", "navigate", "--url", "https://example.com"])
    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--log-action", "--chain", chain_file, "--key-file", key_file, "--action", "click", "--url", "https://example.com", "--target", "#checkout", "--operator", "agent"])
    subprocess.check_call([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--log-action", "--chain", chain_file, "--key-file", key_file, "--action", "visual_takeover_start", "--url", "https://example.com/2fa", "--operator", "takeover"])

    verify_out = subprocess.check_output([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--verify-chain", "--chain", chain_file]).decode("utf-8")
    report = json.loads(verify_out[verify_out.find("{"):])
    assert report.get("valid") is True, f"Audit chain verification failed: {report}"
    assert report.get("total_receipts") == 4, f"Expected 4 receipts, got {report.get('total_receipts')}"

    # Verify tamper resistance: modify one byte in receipt body
    with open(chain_file, "r", encoding="utf-8") as f:
        chain_data = json.load(f)
    chain_data["receipts"][1]["body"]["action"] = "tampered_action"
    with open(chain_file, "w", encoding="utf-8") as f:
        json.dump(chain_data, f)

    res = subprocess.run([sys.executable, ".skills/stealth-browser/scripts/witness_audit.py", "--verify-chain", "--chain", chain_file], capture_output=True, text=True)
    assert res.returncode != 0, "Tampered chain should have failed verification!"
    print("  [OK] Ghost Witness Ed25519 signatures, hash chaining, and tamper detection asserted.")

    for p in [chain_file, key_file]:
        if os.path.exists(p):
            os.remove(p)

if __name__ == "__main__":
    test_auth_vault()
    test_text_perception()
    test_witness_audit()
    print("\n=======================================================")
    print("  ALL GHOST V4 ENGINE ARCHITECTURES VALIDATED 100% OK")
    print("=======================================================")
