# ADR-003 — One-time Mac bootstrap and supervised controller handoff

Status: Accepted

DD1 uses macOS launchd as the machine-level supervisor. The human performs one explicit bootstrap installation. launchd then starts DD1 at login and keeps the bootstrap process alive.

The bootstrap process supervises the controller. Controller/observer changes request exit code 75 only after the new repository version has passed candidate validation, payload health probing and activation. Bootstrap then starts the controller from the new files and requires a matching readiness artifact. If readiness fails before acceptance, bootstrap can run its last-good controller snapshot.

This separates three lifecycles:

```
launchd → bootstrap → controller → payload
```

Routine changes must not require terminal interaction.
