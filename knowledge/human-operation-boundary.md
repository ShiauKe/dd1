# Human Operation Boundary

Status: Core design constraint

DD1 optimizes not only for correct automation, but for **minimum required human operation**.

## Governing rule

> Routine code/content change = zero human terminal interaction.

Any recurring human action is presumed to be an automation gap unless it crosses an external trust boundary that the agent/runtime cannot legitimately cross.

## Current boundary

| Action | Human required? | Owner / target |
|---|---:|---|
| Create a new GitHub repository | Yes | External creation action |
| Authorize a new repo to the GitHub integration | Yes, once | HI-001 / trust boundary |
| Bootstrap DD1 on a Mac | Yes, once | HI-002 / machine trust boundary |
| Approve OS-level permissions when required | At most once | HI-002 / OS trust boundary |
| Modify code or content through conversation | No | Agent |
| Commit / push | No | Agent |
| Fetch / update desired state | No | Controller |
| Validate candidate | No | Controller |
| Activate / restart application | No | Controller |
| Inspect routine runtime state | No | Observer |
| Relay terminal logs or running SHA | No | Observer |
| Recover from deployment failure | No | Controller |
| Restart after login / reboot | No | launchd target |
| Update the controller itself | No | supervised self-update target |

## Design test

For every new DD1 capability, ask:

1. Does this introduce a human operation?
2. If yes, is it an unavoidable trust boundary?
3. If no, treat it as a system defect or missing automation.
4. If unavoidable, record it in `human-interventions.md`.
5. Prefer one-time authorization over recurring operation.

## Desired interaction surface

```
Human intent
    ↓
Conversation
    ↓
Agent changes desired state
    ↓
Git
    ↓
Controller converges runtime
    ↓
Observer exposes evidence
    ↓
Recovery if needed
```

The human should normally interact only at the top of this chain.

## Optimization metric

Track:

- recurring human operations per routine change
- one-time human interventions per machine/repository onboarding
- unresolved human interventions
- interventions later eliminated by automation

Target for routine changes:

```
human operations = 0
```

The purpose of the intervention ledger is therefore not merely documentation. It is a backlog of automation boundaries to eliminate.
