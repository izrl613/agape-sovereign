#!/usr/bin/env bash
set -euo pipefail

SAFE_MODEL_NAME="gemma4-e4b-m5air"
EXPERIMENTAL_MODEL_NAME="gemma4-e4b-m5air-16k"
BASE_MODEL="gemma4:e4b"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Install it first:"
  echo "curl -fsSL https://ollama.com/install.sh | sh"
  exit 1
fi

mkdir -p "$HOME/ollama-gemma4-e4b-m5air"

cat > "$HOME/ollama-gemma4-e4b-m5air/Modelfile.8k" <<'MODEL'
FROM gemma4:e4b

PARAMETER num_ctx 8192
PARAMETER num_predict -1
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.08

SYSTEM """
You are Gemma4-E4B-M5Air, optimized for a 13-inch M5 MacBook Air with 16 GB unified memory. Be helpful, thorough, practical, and do not impose artificial short-answer limits. Continue in chunks when needed. Prioritize stability, local privacy, and efficient resource use. Ask for confirmation before destructive, private, financial, publishing, messaging, account-changing, or system-modifying actions.
"""
MODEL

cat > "$HOME/ollama-gemma4-e4b-m5air/Modelfile.16k" <<'MODEL'
FROM gemma4:e4b

PARAMETER num_ctx 16384
PARAMETER num_predict -1
PARAMETER temperature 0.65
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.08

SYSTEM """
You are Gemma4-E4B-M5Air-16K, optimized for long text-only sessions on a 13-inch M5 MacBook Air with 16 GB unified memory. Be helpful, thorough, and practical. Continue in chunks when needed. Warn the user if memory pressure, swap, heat, or slowdowns appear. Do not claim unlimited tokens or unlimited computer use. Ask for confirmation before destructive, private, financial, publishing, messaging, account-changing, or system-modifying actions.
"""
MODEL

ollama pull "$BASE_MODEL"
ollama create "$SAFE_MODEL_NAME" -f "$HOME/ollama-gemma4-e4b-m5air/Modelfile.8k"
ollama create "$EXPERIMENTAL_MODEL_NAME" -f "$HOME/ollama-gemma4-e4b-m5air/Modelfile.16k"

echo "Done."
echo "Run safe 8K:"
echo "ollama run gemma4-e4b-m5air"
echo
echo "Run experimental 16K:"
echo "ollama run gemma4-e4b-m5air-16k"
