# DD1 Rule: Reuse Mechanism, Own Boundary

Status: normative guidance

When a task reaches a proprietary or external format, protocol, device, or service boundary, perform capability discovery before implementing the mechanism.

Preferred order:

    discover existing capability
        -> evaluate trust / license / interface / platform fit
        -> isolate behind adapter
        -> own the domain projection
        -> replace only if evidence requires it

## Invariant

DD1-managed systems SHOULD own their boundary and domain contract, not unnecessarily own third-party mechanism internals.

A reused parser, CLI, SDK, driver, or service MUST remain replaceable behind a local adapter.

## Decision evidence

Record at least:

- provider/project;
- license when relevant;
- invocation/API contract;
- platform/runtime dependency;
- output contract;
- why reuse is preferable to reimplementation.

## Escalation

Reimplement only when an existing capability fails a material requirement such as correctness, security, licensing, maintainability, platform support, observability, or required performance.

Do not use reverse engineering as the default merely because the external format is unfamiliar.

## Short form

    Reuse mechanism.
    Own boundary.
    Own projection.
