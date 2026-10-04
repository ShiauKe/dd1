#!/bin/zsh
set -euo pipefail
REPO_URL="https://github.com/ShiauKe/dd1.git"
ROOT="${DD1_ROOT:-$HOME/dot/dd1}"
LABEL="com.dd1.runtime"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOGDIR="$HOME/Library/Logs/dd1"

command -v git >/dev/null || { echo "DD1 bootstrap blocked: git is required"; exit 1; }
command -v node >/dev/null || { echo "DD1 bootstrap blocked: node >=22 is required"; exit 1; }
MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$MAJOR" -ge 22 ]] || { echo "DD1 bootstrap blocked: node >=22 is required"; exit 1; }

mkdir -p "$(dirname "$ROOT")"
if [[ -e "$ROOT" && ! -d "$ROOT/.git" ]]; then echo "DD1 bootstrap blocked: $ROOT exists but is not a git repository"; exit 1; fi
if [[ ! -d "$ROOT/.git" ]]; then git clone "$REPO_URL" "$ROOT"; fi
cd "$ROOT"
ORIGIN="$(git remote get-url origin)"
[[ "$ORIGIN" == "$REPO_URL" || "$ORIGIN" == "git@github.com:ShiauKe/dd1.git" ]] || { echo "DD1 bootstrap blocked: unexpected origin $ORIGIN"; exit 1; }
git fetch origin main
git switch main
[[ -z "$(git status --porcelain)" ]] || { echo "DD1 bootstrap blocked: working tree has local changes"; exit 1; }
git merge --ff-only origin/main

mkdir -p "$LOGDIR" "$HOME/Library/LaunchAgents"
NODE="$(command -v node)"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>$LABEL</string>
<key>ProgramArguments</key><array><string>$NODE</string><string>$ROOT/bootstrap/bootstrap.js</string></array>
<key>WorkingDirectory</key><string>$ROOT</string>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>$LOGDIR/stdout.log</string>
<key>StandardErrorPath</key><string>$LOGDIR/stderr.log</string>
</dict></plist>
EOF
plutil -lint "$PLIST" >/dev/null
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"
echo "DD1 bootstrap installed at $ROOT. Routine operation is autonomous."
