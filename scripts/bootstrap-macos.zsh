#!/bin/zsh
set -euo pipefail
REPO_URL="https://github.com/ShiauKe/dd1.git"
ROOT="${DD1_ROOT:-$HOME/dot/dd1}"
LABEL="com.dd1.runtime"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOGDIR="$HOME/Library/Logs/dd1"
UID_NOW="$(id -u)"

say(){ print -- "DD1 bootstrap: $*"; }
die(){ print -u2 -- "DD1 bootstrap blocked: $*"; exit 1; }

command -v git >/dev/null || die "git is required"
command -v node >/dev/null || die "node >=22 is required"
MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$MAJOR" -ge 22 ]] || die "node >=22 is required"

mkdir -p "$(dirname "$ROOT")"
if [[ -e "$ROOT" && ! -d "$ROOT/.git" ]]; then die "$ROOT exists but is not a git repository"; fi
if [[ ! -d "$ROOT/.git" ]]; then say "cloning"; git clone "$REPO_URL" "$ROOT"; fi
cd "$ROOT"
ORIGIN="$(git remote get-url origin)"
[[ "$ORIGIN" == "$REPO_URL" || "$ORIGIN" == "git@github.com:ShiauKe/dd1.git" ]] || die "unexpected origin $ORIGIN"

say "converging repository"
git fetch origin main
git switch main
[[ -z "$(git status --porcelain)" ]] || die "working tree has local changes"
git merge --ff-only origin/main

say "validating desired state"
node runtime/validator.js .

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
<key>ThrottleInterval</key><integer>5</integer>
<key>StandardOutPath</key><string>$LOGDIR/stdout.log</string>
<key>StandardErrorPath</key><string>$LOGDIR/stderr.log</string>
</dict></plist>
EOF
plutil -lint "$PLIST" >/dev/null

say "converging launchd"
launchctl bootout "gui/$UID_NOW/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NOW" "$PLIST"
launchctl kickstart -k "gui/$UID_NOW/$LABEL"

say "waiting for controller readiness"
READY=0
for i in {1..30}; do
  if [[ -f "$LOGDIR/stdout.log" ]] && tail -n 120 "$LOGDIR/stdout.log" | grep -q "DD1_CONTROL_READY "; then READY=1; break; fi
  sleep 0.25
done
if [[ "$READY" -ne 1 ]]; then
  say "controller not ready; running gate diagnosis"
  node scripts/doctor.js || true
  exit 2
fi

say "READY — convergence complete"
node scripts/doctor.js || true
