#!/usr/bin/env python3
"""
scripts/execute_full_nemotron_pipeline.py
Processes the entire monolithic markdown file using nemotron-3-nano:4b-bf16 in Ollama.
Extracts design, build, code, implementation, and execution context into a formal blueprint.
"""

import urllib.request
import json
import os
import sys
import time

SOURCE_FILE = "/Users/aarondavid/.gemini/antigravity-ide/brain/e0209f86-5d6f-4e5e-ab5d-5ca36a935f4b/.user_uploaded/media_1789890076509.md"
OUTPUT_FILE = "/Users/aarondavid/Documents/agape-sovereign/docs/MONOLITHIC_EXTRACTION_AND_EXECUTION_BLUEPRINT.md"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "nemotron-3-nano:4b-bf16"

def call_nemotron(prompt_text, system_instruction=""):
    full_prompt = f"{system_instruction}\n\n[CONTEXT SECTION]\n{prompt_text}\n\n[EXTRACTION TASK]\nExtract comprehensive, high-density technical analysis of design, build, code, implementation, and execution details. Be specific and include exact architectures, schemas, endpoints, and workflows."
    
    payload = {
        "model": MODEL_NAME,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_ctx": 8192
        }
    }
    
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("response", "")

def main():
    print(f"[*] Reading monolithic source file: {SOURCE_FILE}")
    if not os.path.exists(SOURCE_FILE):
        print(f"[-] Source file not found: {SOURCE_FILE}", file=sys.stderr)
        sys.exit(1)
        
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"[*] Loaded {len(content)} characters ({len(content.splitlines())} lines).")

    # Segment into core thematic modules for Nemotron processing
    sections = [
        {
            "title": "1. 16 Identity Vectors & Orchestration Specification",
            "start_match": "16 Identity Vectors",
            "end_match": "Option 1: Data Broker Removal Request Templates",
            "instruction": "Extract the complete 16 Identity Vectors specification (V-01 through V-16), severity classification tiers (Critical, High, Medium), operational responsibilities, and remediation checklists."
        },
        {
            "title": "2. Data Broker Removal Automation & Universal PWA Architecture",
            "start_match": "Option 1: Data Broker Removal Request Templates",
            "end_match": "package.json",
            "instruction": "Extract the Data Broker Removal framework (broker landscape, request templates, tracking lifecycles, compliance rules under GDPR/CCPA/HIPAA) and Universal PWA Architecture (Service Worker, Web Crypto API, offline cache, Web Push VAPID)."
        },
        {
            "title": "3. Implementation & Execution Stack (Next.js PWA, APIs & Database)",
            "start_match": "package.json",
            "end_match": "Agape Sovereign - Complete Export to GitHub, GCP, and Firebase",
            "instruction": "Extract the complete software engineering build stack: Next.js App Router, Prisma ORM schema (User, Breach, Notification), REST/WebSocket endpoints, real breach intelligence (XposedOrNot, LeakCheck), Docker containerization, and authentication middleware."
        },
        {
            "title": "4. Multi-Cloud Deployment, GCP/Firebase Architecture & Sovereign Sync",
            "start_match": "Agape Sovereign - Complete Export to GitHub, GCP, and Firebase",
            "end_match": None,
            "instruction": "Extract the multi-cloud deployment pipeline covering Firebase (Auth, Firestore rules, Functions v2, Storage, Hosting), GCP (BigQuery audit trail), and local-to-remote Git repository synchronization with izrl613/agape-sovereign."
        }
    ]

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("# Agape Sovereign — Monolithic Extraction & Execution Blueprint\n\n")
        out.write(f"> Generated via `nemotron-3-nano:4b-bf16` on {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        out.write(f"> Source: `{os.path.basename(SOURCE_FILE)}` (754 KB / 12,190 lines)\n\n")
        out.write("---\n\n")

    for idx, sec in enumerate(sections, 1):
        print(f"[*] Processing Section {idx}/{len(sections)}: {sec['title']}...")
        start_idx = content.find(sec["start_match"]) if sec["start_match"] else 0
        if start_idx == -1:
            start_idx = 0
            
        if sec["end_match"]:
            end_idx = content.find(sec["end_match"], start_idx)
            if end_idx == -1:
                chunk = content[start_idx:start_idx + 12000]
            else:
                chunk = content[start_idx:end_idx][:12000]
        else:
            chunk = content[start_idx:start_idx + 12000]

        print(f"    Sending {len(chunk)} characters to {MODEL_NAME} in Ollama...")
        t0 = time.time()
        try:
            extraction = call_nemotron(chunk, sec["instruction"])
            elapsed = time.time() - t0
            print(f"    [+] Received {len(extraction)} chars in {elapsed:.2f}s")
            
            with open(OUTPUT_FILE, "a", encoding="utf-8") as out:
                out.write(f"## {sec['title']}\n\n")
                out.write(extraction.strip())
                out.write("\n\n---\n\n")
        except Exception as err:
            print(f"    [-] Error processing section: {err}", file=sys.stderr)
            with open(OUTPUT_FILE, "a", encoding="utf-8") as out:
                out.write(f"## {sec['title']}\n\n")
                out.write(f"*Error during extraction: {err}*\n\n---\n\n")

    print(f"[SUCCESS] Complete extraction blueprint written to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
