#!/usr/bin/env python3
"""
Ghost Graph Autonomous Search CLI
Autonomous multi-source search and knowledge synthesis.

Usage:
  python search.py --query "Latest releases in Rust web frameworks 2026" --max-results 5
"""

import os
import sys
import json
import argparse
from scrape import get_graph_config

def main():
    parser = argparse.ArgumentParser(description="Ghost Graph Autonomous Search")
    parser.add_argument("--query", "-q", required=True, help="Search query or research question")
    parser.add_argument("--max-results", "-n", type=int, default=3, help="Maximum search results to scrape and synthesize")
    parser.add_argument("--model", "-m", default="auto", choices=["auto", "gemini", "openai", "anthropic", "groq", "ollama"], help="LLM Provider to use")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON to stdout")

    args = parser.parse_args()

    try:
        from scrapegraphai.graphs import SearchGraph
    except ImportError:
        print("[Error] Ghost Graph engine dependencies are not installed in the current environment.", file=sys.stderr)
        print("Please install via: pip install -r requirements.txt", file=sys.stderr)
        sys.exit(1)

    try:
        graph_config = get_graph_config(args.model, headless=True)
        graph_config["max_results"] = args.max_results

        if not args.json:
            print(f"[*] Initializing SearchGraph for query: {args.query}", file=sys.stderr)
            print(f"[*] Maximum results: {args.max_results}", file=sys.stderr)

        search_graph = SearchGraph(
            prompt=args.query,
            config=graph_config
        )
        result = search_graph.run()

        if args.json or isinstance(result, (dict, list)):
            print(json.dumps(result, indent=2))
        else:
            print(result)

    except Exception as e:
        print(f"[Error] SearchGraph execution failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
