#!/usr/bin/env python3
"""
Ghost Graph & Stealth Browser Scraper CLI
High-performance AI extraction pipeline for websites, SPAs, and documents.

Usage:
  python scrape.py --url https://news.ycombinator.com --prompt "Extract top 10 articles with title, points, and url"
  python scrape.py --url https://example.com --prompt "Summarize main offerings" --model gemini --json
"""

import os
import sys
import json
import argparse

def get_graph_config(model_provider="auto", headless=True):
    """
    Constructs graph configuration dictionary based on detected API keys.
    """
    config = {
        "headless": headless,
        "verbose": True
    }

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")

    if model_provider == "gemini" or (model_provider == "auto" and gemini_key):
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required for Gemini.")
        config["llm"] = {
            "api_key": gemini_key,
            "model": "google_genai/gemini-1.5-flash",
        }
    elif model_provider == "openai" or (model_provider == "auto" and openai_key):
        if not openai_key:
            raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI.")
        config["llm"] = {
            "api_key": openai_key,
            "model": "openai/gpt-4o-mini",
        }
    elif model_provider == "anthropic" or (model_provider == "auto" and anthropic_key):
        if not anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required for Anthropic.")
        config["llm"] = {
            "api_key": anthropic_key,
            "model": "anthropic/claude-3-5-sonnet-20241022",
        }
    elif model_provider == "groq" or (model_provider == "auto" and groq_key):
        if not groq_key:
            raise ValueError("GROQ_API_KEY environment variable is required for Groq.")
        config["llm"] = {
            "api_key": groq_key,
            "model": "groq/llama3-70b-8192",
        }
    else:
        # Fallback to local Ollama
        config["llm"] = {
            "model": "ollama/llama3",
            "model_tokens": 8192,
            "base_url": ollama_url,
        }

    return config

def main():
    parser = argparse.ArgumentParser(description="Ghost Graph & Stealth Browser Smart Scraper")
    parser.add_argument("--url", "-u", required=True, help="Target URL or local HTML file path to scrape")
    parser.add_argument("--prompt", "-p", required=True, help="Extraction instruction / prompt for the LLM")
    parser.add_argument("--model", "-m", default="auto", choices=["auto", "gemini", "openai", "anthropic", "groq", "ollama"], help="LLM Provider to use")
    parser.add_argument("--schema", "-s", help="Optional JSON schema string or file path for strict output structure")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser in headless mode")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="Run browser in visible mode")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON to stdout")

    args = parser.parse_args()

    try:
        from scrapegraphai.graphs import SmartScraperGraph
    except ImportError:
        print("[Error] Ghost Graph engine dependencies are not installed in the current environment.", file=sys.stderr)
        print("Please install via: pip install -r requirements.txt", file=sys.stderr)
        sys.exit(1)

    try:
        graph_config = get_graph_config(args.model, args.headless)
        if not args.json:
            print(f"[*] Initializing SmartScraperGraph for: {args.url}", file=sys.stderr)
            print(f"[*] Model Provider: {graph_config['llm']['model']}", file=sys.stderr)

        schema = None
        if args.schema:
            if os.path.isfile(args.schema):
                with open(args.schema, 'r', encoding='utf-8') as f:
                    schema = json.load(f)
            else:
                schema = json.loads(args.schema)

        scraper_kwargs = {
            "prompt": args.prompt,
            "source": args.url,
            "config": graph_config
        }
        if schema:
            scraper_kwargs["schema"] = schema

        scraper = SmartScraperGraph(**scraper_kwargs)
        result = scraper.run()

        if args.json or isinstance(result, (dict, list)):
            print(json.dumps(result, indent=2))
        else:
            print(result)

    except Exception as e:
        print(f"[Error] Scraping failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
