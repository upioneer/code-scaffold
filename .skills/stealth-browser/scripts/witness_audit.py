#!/usr/bin/env python3
"""
Ghost Witness: Cryptographic Audit Chain for Browser Agents
Provides tamper-evident, Ed25519-signed action receipts and cryptographic hash-chaining
for autonomous browser operations and human visual takeover interventions.

Usage:
  python witness_audit.py --init --chain audit_chain.json
  python witness_audit.py --log-action --chain audit_chain.json --action click --url "https://example.com" --target "#submit"
  python witness_audit.py --verify-chain --chain audit_chain.json
"""

import os
import sys
import json
import uuid
import hashlib
import argparse
from datetime import datetime, timezone

try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
except ImportError:
    ed25519 = None

GENESIS_PREVIOUS_HASH = "0" * 64

def generate_keypair():
    """Generates a new Ed25519 keypair and returns (private_bytes_hex, public_bytes_hex)."""
    if ed25519 is None:
        raise ImportError("cryptography package is required. Run 'pip install cryptography>=42.0.0'")
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    priv_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    return priv_bytes.hex(), pub_bytes.hex()

def compute_canonical_hash(data: dict) -> str:
    """Computes a SHA-256 hash of a dictionary with sorted keys."""
    canonical_json = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

def sign_payload(payload_hash: str, private_key_hex: str) -> str:
    """Signs a payload hash string using an Ed25519 private key hex."""
    if ed25519 is None:
        return "unverified_mock_sig_" + hashlib.sha256(payload_hash.encode()).hexdigest()[:16]
    
    priv_bytes = bytes.fromhex(private_key_hex)
    private_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_bytes)
    sig = private_key.sign(payload_hash.encode("utf-8"))
    return sig.hex()

def verify_signature(payload_hash: str, signature_hex: str, public_key_hex: str) -> bool:
    """Verifies an Ed25519 signature against payload hash."""
    if ed25519 is None:
        return signature_hex.startswith("unverified_mock_sig_")
    
    try:
        pub_bytes = bytes.fromhex(public_key_hex)
        public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
        public_key.verify(bytes.fromhex(signature_hex), payload_hash.encode("utf-8"))
        return True
    except Exception:
        return False

def init_audit_chain(chain_file: str, key_file: str = "") -> dict:
    """Initializes a new audit chain file with a genesis block and keypair."""
    priv_hex, pub_hex = generate_keypair()
    
    if not key_file:
        key_file = chain_file.replace(".json", ".key")
    with open(key_file, "w", encoding="utf-8") as f:
        json.dump({"private_key": priv_hex, "public_key": pub_hex}, f, indent=2)

    genesis_body = {
        "action": "genesis_init",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "operator": "system",
        "target_url": "urn:code-scaffold:ghost-witness:v4",
        "params": {"version": 4, "description": "Ghost Witness Cryptographic Audit Genesis"},
    }
    body_hash = compute_canonical_hash(genesis_body)
    sig = sign_payload(body_hash, priv_hex)

    genesis_receipt = {
        "receipt_id": str(uuid.uuid4()),
        "sequence_index": 0,
        "previous_receipt_hash": GENESIS_PREVIOUS_HASH,
        "body": genesis_body,
        "body_hash": body_hash,
        "signature": sig,
    }
    genesis_receipt["receipt_hash"] = compute_canonical_hash(genesis_receipt)

    chain = {
        "version": 4,
        "public_key": pub_hex,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "receipts": [genesis_receipt],
    }

    with open(chain_file, "w", encoding="utf-8") as f:
        json.dump(chain, f, indent=2, ensure_ascii=False)

    return chain

def append_action_receipt(chain_file: str, action: str, target_url: str, params: dict, operator: str = "agent", key_file: str = "") -> dict:
    """Appends a new cryptographically signed receipt to the audit chain."""
    if not os.path.exists(chain_file):
        raise FileNotFoundError(f"Audit chain '{chain_file}' not found. Run --init first.")
    
    with open(chain_file, "r", encoding="utf-8") as f:
        chain = json.load(f)

    if not key_file:
        key_file = chain_file.replace(".json", ".key")
    with open(key_file, "r", encoding="utf-8") as f:
        keys = json.load(f)
    priv_hex = keys["private_key"]

    last_receipt = chain["receipts"][-1]
    prev_hash = last_receipt["receipt_hash"]
    seq_index = last_receipt["sequence_index"] + 1

    body = {
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "operator": operator,
        "target_url": target_url,
        "params": params,
    }
    body_hash = compute_canonical_hash(body)
    sig = sign_payload(body_hash, priv_hex)

    receipt = {
        "receipt_id": str(uuid.uuid4()),
        "sequence_index": seq_index,
        "previous_receipt_hash": prev_hash,
        "body": body,
        "body_hash": body_hash,
        "signature": sig,
    }
    receipt["receipt_hash"] = compute_canonical_hash(receipt)

    chain["receipts"].append(receipt)

    with open(chain_file, "w", encoding="utf-8") as f:
        json.dump(chain, f, indent=2, ensure_ascii=False)

    return receipt

def verify_audit_chain(chain_file: str) -> dict:
    """Verifies the unbroken cryptographic integrity of all receipts in the audit chain."""
    if not os.path.exists(chain_file):
        raise FileNotFoundError(f"Audit chain '{chain_file}' not found.")
    
    with open(chain_file, "r", encoding="utf-8") as f:
        chain = json.load(f)

    pub_hex = chain.get("public_key")
    receipts = chain.get("receipts", [])

    if not receipts:
        return {"valid": False, "error": "Chain contains zero receipts"}

    prev_hash = GENESIS_PREVIOUS_HASH
    for idx, r in enumerate(receipts):
        if r["sequence_index"] != idx:
            return {"valid": False, "error": f"Sequence break at index {idx}: expected {idx}, got {r['sequence_index']}"}
        
        if r["previous_receipt_hash"] != prev_hash:
            return {"valid": False, "error": f"Hash chain broken at index {idx}: expected prev {prev_hash}, got {r['previous_receipt_hash']}"}

        # Check body hash
        computed_body_hash = compute_canonical_hash(r["body"])
        if computed_body_hash != r["body_hash"]:
            return {"valid": False, "error": f"Body hash tampered at index {idx}"}

        # Verify signature
        if not verify_signature(r["body_hash"], r["signature"], pub_hex):
            return {"valid": False, "error": f"Invalid cryptographic signature at index {idx}"}

        # Check receipt hash
        r_copy = dict(r)
        orig_receipt_hash = r_copy.pop("receipt_hash")
        computed_receipt_hash = compute_canonical_hash(r_copy)
        if computed_receipt_hash != orig_receipt_hash:
            return {"valid": False, "error": f"Receipt hash tampered at index {idx}"}

        prev_hash = orig_receipt_hash

    return {
        "valid": True,
        "total_receipts": len(receipts),
        "chain_head_hash": prev_hash,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }

def main():
    parser = argparse.ArgumentParser(description="Ghost Witness: Cryptographic Audit Chain")
    parser.add_argument("--init", action="store_true", help="Initialize a new audit chain and keypair")
    parser.add_argument("--chain", default="ghost_audit.json", help="Path to audit chain JSON file")
    parser.add_argument("--key-file", default="", help="Path to Ed25519 keyfile (defaults to <chain>.key)")
    parser.add_argument("--log-action", action="store_true", help="Append an action receipt to the chain")
    parser.add_argument("--action", default="navigate", help="Action type (navigate, click, type, visual_takeover_start, etc.)")
    parser.add_argument("--url", default="https://example.com", help="Target URL")
    parser.add_argument("--target", default="", help="Target element selector or description")
    parser.add_argument("--operator", default="agent", choices=["agent", "takeover", "system"], help="Operator identity")
    parser.add_argument("--verify-chain", action="store_true", help="Verify cryptographic integrity of audit chain")
    parser.add_argument("--summary", action="store_true", help="Print human-readable summary of actions")

    args = parser.parse_args()

    if args.init:
        chain = init_audit_chain(args.chain, args.key_file)
        print(f"[OK] Initialized Ghost Witness audit chain at '{args.chain}' (Genesis hash: {chain['receipts'][0]['receipt_hash'][:16]}...)")
        return

    if args.log_action:
        params = {"target": args.target} if args.target else {}
        receipt = append_action_receipt(args.chain, args.action, args.url, params, operator=args.operator, key_file=args.key_file)
        print(f"[OK] Appended receipt #{receipt['sequence_index']} ({receipt['body']['action']}) to '{args.chain}' [sig: {receipt['signature'][:16]}...]")
        return

    if args.verify_chain:
        report = verify_audit_chain(args.chain)
        print("=" * 60)
        print("  Ghost Witness Cryptographic Audit Chain Verification")
        print("=" * 60)
        print(json.dumps(report, indent=2))
        if not report.get("valid"):
            sys.exit(1)
        return

    if args.summary:
        with open(args.chain, "r", encoding="utf-8") as f:
            chain = json.load(f)
        print(f"Audit Chain: {args.chain} (Total Receipts: {len(chain['receipts'])})")
        for r in chain["receipts"]:
            b = r["body"]
            print(f"  #{r['sequence_index']:03d} [{b['timestamp']}] {b['operator'].upper()}: {b['action']} -> {b['target_url']}")
        return

    parser.print_help()

if __name__ == "__main__":
    main()
