# Human Interventions

Every non-delegable human action is recorded here. The optimization target is to reduce routine human involvement to zero.

## HI-001 — Authorize a newly created repository
- Date: 2026-10-04
- Status: resolved
- Trigger: new repository was not included in GitHub integration repository access.
- Human action: GitHub Settings → Applications → Installed GitHub Apps → Configure → add the repository.
- Verified result: agent successfully wrote DD1.
- Current classification: trust-boundary onboarding step.

## HI-002 — First machine bootstrap
- Status: pending
- Desired human action: one initial command/install action on the Mac only.
- Success criterion: DD1 starts automatically after login/reboot, follows `origin/main`, publishes runtime state, and routine updates require no terminal/log copying.
- Design rule: do not ask the human to manually fetch, pull, restart, inspect logs, or relay runtime output if the system can perform or publish it itself.

## Onboarding target
```
create repo
  ↓
authorize repo in GitHub integration       [HUMAN / trust boundary]
  ↓
agent bootstraps repo                     [AUTOMATIC]
  ↓
bootstrap machine once                    [HUMAN / machine trust boundary]
  ↓
login/reboot persistence                  [AUTOMATIC]
  ↓
chat → commit → validate → activate       [AUTOMATIC]
  ↓
observe / diagnose / recover              [AUTOMATIC]
```
