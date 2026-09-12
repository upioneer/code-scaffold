#!/usr/bin/env python3
"""
Ghost Perception: Zero-Token Text Perception & Context Inspector
Extracts dense semantic accessibility trees and interactive element outlines from web pages
without taking vision screenshots, slashing agent LLM token consumption by up to 90%.
Includes context-windowed element search and automated PII scrubbing.

Usage:
  python text_perception.py --file page.html --outline
  python text_perception.py --file page.html --query "Login" --context 2
  python text_perception.py --file page.html --scrub-pii
"""

import os
import re
import sys
import json
import argparse
from bs4 import BeautifulSoup, Comment

INTERACTIVE_TAGS = {"button", "input", "select", "textarea", "a", "details", "summary", "dialog"}
INTERACTIVE_ROLES = {
    "button", "link", "checkbox", "radio", "textbox", "searchbox",
    "combobox", "menuitem", "tab", "switch", "slider", "option"
}

# Regex patterns for automated PII scrubbing
PII_PATTERNS = [
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", "[SCRUBBED_EMAIL]"),
    (r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b", "[SCRUBBED_PHONE]"),
    (r"\b\d{3}-\d{2}-\d{4}\b", "[SCRUBBED_SSN]"),
    (r"\b(?:\d[ -]*?){13,19}\b", "[SCRUBBED_CARD]"),
    (r"bearer\s+[A-Za-z0-9\-_.]+", "bearer [SCRUBBED_TOKEN]"),
    (r"(?:api[_-]?key|access[_-]?token|auth[_-]?token)[\"'\s:=]+[A-Za-z0-9\-_]{16,}", "api_key: [SCRUBBED_SECRET]"),
    (r"(?:password|passwd|pwd)[\"'\s:=]+[^\s,\"']+", "password: [SCRUBBED_PASSWORD]"),
]

def scrub_pii(text: str) -> str:
    """Scrub PII, credentials, tokens, and sensitive identifiers from text or HTML."""
    scrubbed = text
    for pattern, replacement in PII_PATTERNS:
        scrubbed = re.sub(pattern, replacement, scrubbed, flags=re.IGNORECASE)
    return scrubbed

def clean_html(html_content: str) -> BeautifulSoup:
    """Parses HTML and strips non-semantic elements (scripts, styles, SVGs, comments)."""
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Remove useless tags for perception
    for tag in soup(["script", "style", "noscript", "svg", "path", "iframe"]):
        tag.decompose()
    
    # Remove HTML comments
    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()
        
    return soup

def is_element_visible_and_interactive(tag) -> bool:
    """Heuristic check for interactive accessibility tree candidates."""
    if tag.name in INTERACTIVE_TAGS:
        return True
    
    role = tag.get("role", "")
    if role in INTERACTIVE_ROLES:
        return True
    
    if tag.get("onclick") or tag.get("tabindex"):
        return True
        
    return False

def extract_perception_tree(html_content: str, scrub: bool = True) -> list:
    """
    Extracts a zero-token semantic perception list containing interactive controls,
    headings, landmarks, and inputs with their computed labels and attributes.
    """
    soup = clean_html(html_content)
    nodes = []
    node_id = 1

    for el in soup.find_all(True):
        interactive = is_element_visible_and_interactive(el)
        is_heading = el.name in {"h1", "h2", "h3", "h4", "h5", "h6"}
        is_landmark = el.name in {"main", "nav", "header", "footer", "section", "article", "form"}
        
        if not (interactive or is_heading or is_landmark):
            continue
            
        text = el.get_text(strip=True, separator=" ")
        aria_label = el.get("aria-label") or el.get("placeholder") or el.get("title") or ""
        tag_name = el.name
        role = el.get("role") or tag_name
        
        # Attribute summary
        attrs = {}
        if el.get("type"):
            attrs["type"] = el.get("type")
        if el.get("name"):
            attrs["name"] = el.get("name")
        if el.get("id"):
            attrs["id"] = el.get("id")
        if el.get("href"):
            attrs["href"] = el.get("href")
        if el.get("value") and el.name in {"input", "button"}:
            val = el.get("value")
            is_pwd = el.get("type") == "password" or any(s in (el.get("name") or "").lower() for s in ["password", "passwd", "pwd", "secret"])
            if scrub and is_pwd:
                val = "[SCRUBBED_PASSWORD]"
            elif scrub:
                val = scrub_pii(val)
            attrs["value"] = val
            
        label = aria_label or (text[:80] if text else "")
        if scrub:
            label = scrub_pii(label)
        
        nodes.append({
            "id": f"@p{node_id}",
            "tag": tag_name,
            "role": role,
            "label": label,
            "interactive": interactive,
            "attrs": attrs,
            "parent_tag": el.parent.name if el.parent else None,
        })
        node_id += 1

    return nodes

def find_elements_with_context(html_content: str, query: str, context_window: int = 2, is_regex: bool = False, scrub: bool = True) -> list:
    """
    Finds interactive elements matching query and returns them along with preceding
    and succeeding sibling context elements to eliminate brittle CSS selectors.
    """
    nodes = extract_perception_tree(html_content, scrub=scrub)
    matches = []
    
    if is_regex:
        pattern = re.compile(query, re.IGNORECASE)
        match_fn = lambda label: bool(pattern.search(label))
    else:
        q_lower = query.lower()
        match_fn = lambda label: q_lower in label.lower()

    for idx, node in enumerate(nodes):
        target_str = f"{node['label']} {json.dumps(node['attrs'])}"
        if match_fn(target_str):
            start = max(0, idx - context_window)
            end = min(len(nodes), idx + context_window + 1)
            
            context_before = nodes[start:idx]
            context_after = nodes[idx + 1:end]
            
            matches.append({
                "target": node,
                "context_before": context_before,
                "context_after": context_after,
            })
            
    return matches

def format_outline_text(nodes: list) -> str:
    """Formats perception nodes into human/LLM readable concise text outline."""
    lines = []
    for n in nodes:
        badge = "[ACTION]" if n["interactive"] else "[STRUCT]"
        attr_str = " ".join([f"{k}='{v}'" for k, v in n["attrs"].items()])
        if attr_str:
            attr_str = f" ({attr_str})"
        label_str = f' "{n["label"]}"' if n["label"] else ""
        lines.append(f"{n['id']} {badge} <{n['tag']}>{label_str}{attr_str}")
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Ghost Perception: Zero-Token Text Perception Pipeline")
    parser.add_argument("--file", metavar="HTML_FILE", help="Path to local HTML file to inspect")
    parser.add_argument("--html", metavar="RAW_HTML", help="Raw HTML string")
    parser.add_argument("--outline", action="store_true", help="Output compact semantic accessibility outline")
    parser.add_argument("--query", metavar="SEARCH_QUERY", help="Search for element by natural query or label")
    parser.add_argument("--regex", action="store_true", help="Treat query as regular expression")
    parser.add_argument("--context", type=int, default=2, help="Number of sibling nodes for context window (default: 2)")
    parser.add_argument("--no-scrub", action="store_true", help="Disable automated PII scrubbing")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    html_content = ""
    if args.file:
        with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()
    elif args.html:
        html_content = args.html
    else:
        # Check stdin
        if not sys.stdin.isatty():
            html_content = sys.stdin.read()

    if not html_content:
        parser.print_help()
        sys.exit(1)

    scrub = not args.no_scrub

    if args.query:
        matches = find_elements_with_context(
            html_content,
            args.query,
            context_window=args.context,
            is_regex=args.regex,
            scrub=scrub,
        )
        if args.json:
            print(json.dumps(matches, indent=2))
        else:
            print(f"=== Found {len(matches)} match(es) for '{args.query}' ===\n")
            for i, m in enumerate(matches, 1):
                t = m["target"]
                print(f"Match #{i}: {t['id']} <{t['tag']}> \"{t['label']}\" attrs={t['attrs']}")
                if m["context_before"]:
                    print("  [Context Before]:")
                    for b in m["context_before"]:
                        print(f"    - {b['id']} <{b['tag']}> \"{b['label']}\"")
                if m["context_after"]:
                    print("  [Context After]:")
                    for a in m["context_after"]:
                        print(f"    - {a['id']} <{a['tag']}> \"{a['label']}\"")
                print()
        return

    # Default: outline
    nodes = extract_perception_tree(html_content, scrub=scrub)
    if args.json:
        print(json.dumps(nodes, indent=2))
    else:
        print(f"=== Ghost Perception Tree ({len(nodes)} semantic nodes) ===\n")
        print(format_outline_text(nodes))

if __name__ == "__main__":
    main()
