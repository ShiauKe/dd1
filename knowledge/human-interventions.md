# Human Interventions

Every non-delegable human action is recorded here. The optimization target is to reduce routine human involvement to zero.

## HI-001 — Authorize a newly created repository
- Date: 2026-10-04
- Status: resolved
- Human action: add the new repository in GitHub integration Configure.
- Verified result: agent successfully wrote DD1.
- Classification: repository trust boundary.

## HI-002 — First machine bootstrap
- Status: ready for execution
- Human action: run the DD1 macOS bootstrap installer once.
- Why human is still required: installing a persistent process on the user's machine crosses the machine trust boundary.
- After completion: launchd starts DD1 after login/reboot; controller follows `origin/main`; observation publishes runtime state; controller updates use supervised handoff.
- Routine actions explicitly eliminated: manual fetch/pull, npm start, restart, terminal log relay, running-SHA relay.

## Target
```
repo authorization [HUMAN ONCE]
        ↓
machine bootstrap   [HUMAN ONCE]
        ↓
chat → Git → validate → health → activate → observe → recover
                    [AUTOMATIC]
```
