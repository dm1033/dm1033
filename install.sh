#!/usr/bin/env bash
# Install prerequisites for ollama_launch_claude.sh:
#   1. Ollama  (https://ollama.com)
#   2. Claude Code CLI  (npm: @anthropic-ai/claude-code)

set -euo pipefail

OS="$(uname -s)"

# ── 1. Install Ollama ─────────────────────────────────────────────────────────
if command -v ollama &>/dev/null; then
    echo "✓ ollama already installed: $(ollama --version 2>/dev/null || echo 'unknown version')"
else
    echo "Installing Ollama..."
    case "$OS" in
        Linux)
            curl -fsSL https://ollama.com/install.sh | sh
            ;;
        Darwin)
            if command -v brew &>/dev/null; then
                brew install ollama
            else
                echo "  Homebrew not found – downloading macOS app instead..."
                curl -fsSL -o /tmp/Ollama.dmg \
                    "$(curl -fsSL https://ollama.com/api/latest | python3 -c \
                        "import sys,json; d=json.load(sys.stdin); print(d['mac'])")"
                echo "  Open /tmp/Ollama.dmg to complete installation, then re-run this script."
                exit 1
            fi
            ;;
        *)
            echo "Unsupported OS: $OS" >&2
            exit 1
            ;;
    esac
    echo "✓ ollama installed."
fi

# ── 2. Install Claude Code CLI ────────────────────────────────────────────────
if command -v claude &>/dev/null; then
    echo "✓ claude already installed: $(claude --version 2>/dev/null || echo 'unknown version')"
else
    echo "Installing Claude Code CLI..."
    if command -v npm &>/dev/null; then
        npm install -g @anthropic-ai/claude-code
        echo "✓ claude installed."
    else
        echo "Error: npm not found. Install Node.js (https://nodejs.org) first." >&2
        exit 1
    fi
fi

echo ""
echo "All prerequisites installed."
echo "Run:  ./ollama_launch_claude.sh [model]"
