#!/bin/zsh
set -euo pipefail
REPO_URL="https://github.com/ShiauKe/dd1.git"
ROOT="$HOME/dd1"
LABEL="com.dd1.runtime"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOGDIR="$HOME/Library/Logs/dd1"

command -v git >/dev/null || { echo "git is required"; exit 1; }
command -v node >/dev/null || { echo "node is required"; exit 1; }

if [[ ! -d "$ROOT/.git" ]]; then git clone "$REPO_URL" "$ROOT"; fi
cd "$ROOT"
git fetch origin main
git switch main
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
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"
echo "DD1 bootstrap installed. Routine operation is now autonomous."
