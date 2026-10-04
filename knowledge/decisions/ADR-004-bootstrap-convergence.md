# ADR-004 — Bootstrap is the convergence entrypoint

Status: Accepted

DD1 does not create a new manual recovery procedure for each onboarding or startup failure.

## Invariant

> Any known local machine state should converge toward `DD1_READY` by replaying the same bootstrap entrypoint.

Examples include:
- repository absent or already cloned;
- LaunchAgent absent or already installed;
- launchd loaded but controller dead;
- controller previously failed;
- desired repository version newer than local version.

The bootstrap must be idempotent, replayable, self-validating, self-diagnosing and progressively self-repairing.

## Failure learning loop

```
bootstrap
  ↓
failure
  ↓
identify earliest failed gate
  ↓
encode missing transition into bootstrap
  ↓
replay bootstrap from the beginning
```

A failure should improve the convergence program rather than create a permanent human SOP.

Human intervention remains legitimate only for proven external trust boundaries that software cannot cross. Those actions are recorded in `human-interventions.md`.

## Operational consequence

There is one machine entrypoint:

```
scripts/bootstrap-macos.zsh
```

Recovery commands are considered design debt. When a recovery command is discovered, prefer absorbing it into the bootstrap transition logic.
