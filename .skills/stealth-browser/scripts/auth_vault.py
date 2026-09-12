#!/usr/bin/env python3
"""
Ghost Vault - Encrypted Persistent Auth Profiles for Stealth Browser
Implements 'Login Once, Reuse Everywhere' encrypted session storage using Fernet symmetric encryption.
Stores cookies, localStorage, session storage, and origin states securely at rest.

Usage:
  python auth_vault.py --generate-key
  python auth_vault.py --export session.json --output profile.ghostvault --key KEY
  python auth_vault.py --import profile.ghostvault --output session.json --key KEY
  python auth_vault.py --inspect profile.ghostvault --key KEY
"""

import os
import sys
import json
import base64
import argparse
from datetime import datetime, timezone

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    Fernet = None

VAULT_MAGIC_HEADER = b"GHOSTVAULT_V4:"

def generate_key() -> str:
    """Generate a high-entropy Fernet symmetric encryption key."""
    if Fernet is None:
        raise ImportError("cryptography package is required. Run 'pip install cryptography>=42.0.0'")
    return Fernet.generate_key().decode("utf-8")

def derive_key_from_passphrase(passphrase: str, salt: bytes = b"ghost_vault_static_salt_v4") -> bytes:
    """Derives a 32-byte URL-safe base64 Fernet key from a string passphrase."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase.encode("utf-8")))

def get_fernet_cipher(key_or_pass: str) -> Fernet:
    """Initializes Fernet cipher from key string or passphrase."""
    if Fernet is None:
        raise ImportError("cryptography package is required. Run 'pip install cryptography>=42.0.0'")
    
    key_str = key_or_pass.strip()
    try:
        raw_key = base64.urlsafe_b64decode(key_str)
        if len(raw_key) == 32:
            return Fernet(key_str.encode("utf-8"))
    except Exception:
        pass
    
    derived = derive_key_from_passphrase(key_str)
    return Fernet(derived)

def encrypt_storage_state(storage_state: dict, key: str, domain_hint: str = "") -> bytes:
    """Encrypts a Playwright/CDP storage state dictionary into an encrypted vault payload."""
    cipher = get_fernet_cipher(key)
    
    cookies = storage_state.get("cookies", [])
    origins = storage_state.get("origins", [])
    
    payload = {
        "format": "ghost_vault_v4",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "domain_hint": domain_hint or (cookies[0].get("domain") if cookies else "unknown"),
        "cookie_count": len(cookies),
        "origin_count": len(origins),
        "data": storage_state,
    }
    
    raw_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    encrypted_bytes = cipher.encrypt(raw_bytes)
    return VAULT_MAGIC_HEADER + encrypted_bytes

def decrypt_storage_state(vault_data: bytes, key: str) -> dict:
    """Decrypts a vault payload and returns the original storage state dictionary."""
    if not vault_data.startswith(VAULT_MAGIC_HEADER):
        raise ValueError("Invalid vault header: file is not a valid Ghost Vault archive.")
    
    cipher = get_fernet_cipher(key)
    encrypted_bytes = vault_data[len(VAULT_MAGIC_HEADER):]
    decrypted_bytes = cipher.decrypt(encrypted_bytes)
    payload = json.loads(decrypted_bytes.decode("utf-8"))
    return payload

def inspect_vault(vault_data: bytes, key: str) -> dict:
    """Inspects metadata of the vault without returning sensitive cookies or credentials."""
    payload = decrypt_storage_state(vault_data, key)
    cookies = payload.get("data", {}).get("cookies", [])
    
    cookie_summary = []
    for c in cookies[:10]:
        cookie_summary.append({
            "name": c.get("name"),
            "domain": c.get("domain"),
            "path": c.get("path"),
            "secure": c.get("secure", False),
            "httpOnly": c.get("httpOnly", False),
            "expires": c.get("expires", -1),
        })
    
    return {
        "format": payload.get("format"),
        "created_at": payload.get("created_at"),
        "domain_hint": payload.get("domain_hint"),
        "total_cookies": payload.get("cookie_count", len(cookies)),
        "total_origins": payload.get("origin_count", 0),
        "sample_cookies": cookie_summary,
    }

def main():
    parser = argparse.ArgumentParser(description="Ghost Vault: Encrypted Persistent Auth Profiles")
    parser.add_argument("--generate-key", action="store_true", help="Generate a new high-entropy vault key")
    parser.add_argument("--export", metavar="SESSION_JSON", help="Path to raw storage_state JSON file to encrypt")
    parser.add_argument("--output", metavar="OUTPUT_FILE", help="Destination path for encrypted vault or decrypted JSON")
    parser.add_argument("--import", dest="import_file", metavar="VAULT_FILE", help="Path to encrypted .ghostvault file to decrypt")
    parser.add_argument("--inspect", metavar="VAULT_FILE", help="Inspect vault metadata without exposing credentials")
    parser.add_argument("--key", default=os.environ.get("GHOST_VAULT_KEY"), help="Vault key or passphrase (or via GHOST_VAULT_KEY env)")
    parser.add_argument("--domain", default="", help="Optional domain tag for metadata")

    args = parser.parse_args()

    if args.generate_key:
        new_key = generate_key()
        print("=" * 60)
        print("  Ghost Vault Encryption Key Generated")
        print("=" * 60)
        print(f"Key: {new_key}")
        print("\nStore this key safely or set it in your environment:")
        print(f'export GHOST_VAULT_KEY="{new_key}"')
        return

    if args.export:
        if not args.key:
            print("Error: --key or GHOST_VAULT_KEY environment variable is required.")
            sys.exit(1)
        if not args.output:
            args.output = args.export.replace(".json", ".ghostvault")
        
        with open(args.export, "r", encoding="utf-8") as f:
            raw_state = json.load(f)
        
        vault_bytes = encrypt_storage_state(raw_state, args.key, domain_hint=args.domain)
        with open(args.output, "wb") as f:
            f.write(vault_bytes)
        
        print(f"[OK] Successfully encrypted '{args.export}' into Ghost Vault '{args.output}'")
        return

    if args.import_file:
        if not args.key:
            print("Error: --key or GHOST_VAULT_KEY environment variable is required.")
            sys.exit(1)
        if not args.output:
            args.output = args.import_file.replace(".ghostvault", "_restored.json")
        
        with open(args.import_file, "rb") as f:
            vault_bytes = f.read()
        
        payload = decrypt_storage_state(vault_bytes, args.key)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(payload.get("data", {}), f, indent=2, ensure_ascii=False)
        
        print(f"[OK] Successfully decrypted '{args.import_file}' into storage state '{args.output}'")
        return

    if args.inspect:
        if not args.key:
            print("Error: --key or GHOST_VAULT_KEY environment variable is required.")
            sys.exit(1)
        
        with open(args.inspect, "rb") as f:
            vault_bytes = f.read()
        
        info = inspect_vault(vault_bytes, args.key)
        print("=" * 60)
        print("  Ghost Vault Profile Inspection")
        print("=" * 60)
        print(json.dumps(info, indent=2))
        return

    parser.print_help()

if __name__ == "__main__":
    main()
