#!/usr/bin/env bash
# Launch Claude Code backed by a local Ollama model.
#
# Usage:
#   ./ollama_launch_claude.sh [model] [extra claude args...]
#
# Examples:
#   ./ollama_launch_claude.sh
#   ./ollama_launch_claude.sh llama3
#   ./ollama_launch_claude.sh mistral --dangerously-skip-permissions

set -euo pipefail

MODEL="${1:-llama3}"
shift 2>/dev/null || true   # remaining args passed through to claude

OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

# ── 1. Check that ollama is installed ────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
    echo "Error: 'ollama' not found in PATH." >&2
    echo "Install it from https://ollama.com and try again." >&2
    exit 1
fi

# ── 2. Ensure the ollama daemon is running ───────────────────────────────────
if ! curl -sf "${OLLAMA_BASE_URL}/api/tags" -o /dev/null 2>/dev/null; then
    echo "Ollama daemon not running – starting it in the background..."
    ollama serve &>/dev/null &
    OLLAMA_PID=$!
    # Wait up to 10 s for the daemon to become ready
    for i in $(seq 1 20); do
        sleep 0.5
        curl -sf "${OLLAMA_BASE_URL}/api/tags" -o /dev/null 2>/dev/null && break
        if [ "$i" -eq 20 ]; then
            echo "Error: Ollama daemon did not start in time." >&2
            kill "$OLLAMA_PID" 2>/dev/null || true
            exit 1
        fi
    done
fi

# ── 3. Pull the model if it is not already present ───────────────────────────
if ! ollama list 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "${MODEL}"; then
    echo "Pulling model '${MODEL}' (this may take a while)..."
    ollama pull "${MODEL}"
fi

# ── 4. Launch Claude Code with Ollama as the API backend ─────────────────────
echo "Starting Claude Code with model '${MODEL}' via Ollama..."
export ANTHROPIC_BASE_URL="${OLLAMA_BASE_URL}/v1"
export ANTHROPIC_API_KEY="ollama"   # Ollama ignores the key; Claude Code requires one

exec claude --model "${MODEL}" "$@"
