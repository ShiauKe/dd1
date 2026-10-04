#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec zsh "$ROOT/scripts/bootstrap-macos.zsh"
