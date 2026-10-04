# Activation Failure — 2026-10-04

Status: Open failure case

## Evidence

Desired control candidate `aaf477e` passed repository validation while accepted runtime `a743174` remained healthy.

Activation then failed with:

```
activated candidate failed health
```

Observed state preserved the accepted runtime:

- desired: `aaf477e`
- running: `a743174`
- health: healthy
- result: deploy_failed

## Gate consequence

The earliest unclosed gate moves back to activation / rollback (#13–#14). Reboot and network-resilience testing must wait until activation is explainable and repeatably convergent.

## Missing evidence

A boolean health result is insufficient. Activation diagnostics must distinguish at least:

- process exited before readiness;
- port bind / old-port release failure;
- HTTP connection failure or timeout;
- non-2xx health response;
- malformed health payload;
- running SHA mismatch.

## Invariant

A failed activation must never sacrifice the accepted runtime.

A failure is not considered closed merely because a later retry succeeds. The causal class must become observable, and reusable recovery logic should be encoded in the controller.
