# DD1 Closure Strategy

Status: Active

DD1 development proceeds by closure layers, not opportunistic patching.

## A — Bootstrap closure

Question: does the local control plane exist and stay alive?

```
Mac → launchd → bootstrap → controller
```

Required evidence:
- launchd loaded
- bootstrap ready
- controller ready

No deployment feature work should be used to compensate for a missing bootstrap signal.

## B — Communication closure

Question: can the controller communicate in both required directions?

```
controller → GitHub main
controller → runtime-observation → agent
```

Required evidence:
- GitHub read succeeds
- GitHub write succeeds
- observation is readable remotely

Credential authorization is treated as a trust boundary only after evidence proves it is the blocker.

## C — Deployment closure

Question: can desired state become running state without sacrificing the accepted runtime?

```
desired → candidate → validated → healthy → activated → running
```

Failure path:

```
candidate/activation failure → FAILED
accepted/last-good runtime → RUNNING
```

Deployment failure must not imply human intervention.

## D — Autonomy closure

Question: can a routine change complete with no human runtime operation?

```
human intent
  → conversation
  → agent commit
  → controller detects
  → validates
  → activates
  → observes
  → agent verifies
```

Target: the human stops interacting after expressing intent.

## Working rule

When a failure appears:

1. identify the earliest unproven gate;
2. gather evidence for that gate;
3. classify the blocker;
4. choose a strategy;
5. patch only if the blocker is an implementation defect;
6. request human action only if the blocker is a proven trust boundary;
7. record unavoidable human action in `human-interventions.md`.

This prevents DD1 from becoming a sequence of reactive patches.
