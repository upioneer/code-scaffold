#!/usr/bin/env python3
"""
Stealth Browser & Ghost Graph Environment Setup & Diagnostics
Checks Python version, installs virtual environment dependencies, installs Playwright browsers, and tests API keys.

Usage:
  python setup.py [--install]
"""

import os
import sys
import shutil
import subprocess

def run_cmd(cmd):
    print(f"-> Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd)
    return res.returncode == 0

def check_environment():
    print("=" * 60)
    print("  Stealth Browser MCP & Ghost Graph Environment Check")
    print("=" * 60)

    # 1. Python Version
    py_version = sys.version_info
    print(f"* Python Version: {py_version.major}.{py_version.minor}.{py_version.micro}")
    if py_version < (3, 10):
        print("  [!] WARNING: Python 3.10+ is recommended for Ghost Graph and modern FastMCP.")
    else:
        print("  [OK] Python version compatible.")

    # 2. Chrome / Edge Detection
    chrome_found = shutil.which("google-chrome") or shutil.which("chrome") or shutil.which("msedge")
    if chrome_found:
        print(f"  [OK] System Browser detected: {chrome_found}")
    else:
        print("  [!] System browser not detected in PATH. Playwright Chromium will be used.")

    # 3. API Keys Verification
    keys = {
        "GEMINI_API_KEY / GOOGLE_API_KEY": os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"),
        "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY"),
        "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY"),
        "GROQ_API_KEY": os.environ.get("GROQ_API_KEY"),
    }
    print("\n* LLM Provider Credentials:")
    active_keys = 0
    for name, val in keys.items():
        if val:
            print(f"  [OK] {name}: Configured ({val[:4]}...{val[-4:] if len(val) > 8 else ''})")
            active_keys += 1
        else:
            print(f"  [-] {name}: Not set")

    if active_keys == 0:
        print("  [NOTE] No cloud LLM keys found. Local Ollama (http://localhost:11434) will be used as default fallback.")

    # 4. Package Import Checks
    print("\n* Dependency Checks:")
    deps = ["scrapegraphai", "playwright", "nodriver", "fastmcp", "pydantic"]
    missing = []
    for dep in deps:
        try:
            __import__(dep)
            print(f"  [OK] {dep} is installed")
        except ImportError:
            print(f"  [MISSING] {dep}")
    # 5. Ghost Core Native CDP Daemon Check
    print("\n* Ghost Core Micro-Engine:")
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            is_active = s.connect_ex(('127.0.0.1', 9222)) == 0
        if is_active:
            print("  [OK] Ghost Core CDP Daemon listening on port 9222 (ws://127.0.0.1:9222)")
        else:
            print("  [NOTE] Ghost Core CDP Daemon offline (run 'python scripts/ghost_core.py --serve' to start)")
    except Exception as e:
        print(f"  [!] Daemon check error: {e}")

    print("=" * 60)
    return missing

def main():
    missing = check_environment()
    if "--install" in sys.argv and missing:
        print("\n[*] Installing missing dependencies from requirements.txt...")
        req_file = os.path.join(os.path.dirname(__file__), "..", "requirements.txt")
        if run_cmd([sys.executable, "-m", "pip", "install", "-r", req_file]):
            print("[*] Installing Playwright Chromium browser binaries...")
            run_cmd([sys.executable, "-m", "playwright", "install", "chromium"])
            print("[*] Environment setup complete!")
        else:
            print("[!] Installation failed. Please run manually: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
