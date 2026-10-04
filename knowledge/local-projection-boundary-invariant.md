# DD1 Invariant: Local Projection Boundary

Status: normative

## Principle

Raw local state SHOULD remain local by default.

When an agent needs facts derived from local files, applications, devices, credentials, or runtime state, a local capability SHOULD project that state into the minimum structured domain representation required for the autonomous decision.

    raw local state
        -> local decoder / adapter
        -> safe domain projection
        -> local message channel
        -> agent-visible state

The message channel is not permission to export the underlying local source.

## Invariants

1. **Local-first decoding** — decode native/private formats on the local side when practical.
2. **Minimum projection** — expose only fields required by the receiving capability.
3. **Stable schema** — projections carry a versioned machine-readable schema.
4. **No accidental raw fallback** — decoder failure MUST NOT silently replace the projection with raw bytes, file prefixes, full stdout, or arbitrary file content.
5. **Evidence without source leakage** — report decoder state, schema version, counts, hashes, error classes, or other bounded evidence when debugging.
6. **Capability-scoped authority** — permission to observe one projection does not imply permission to read unrelated local state.

## Readiness implication

A local message channel can be transport-ready while a domain capability remains not ready.

Example:

    CHANNEL_DELIVERED
    + SAVE_LOCATED
    + DECODER_PENDING
    !=
    ROSTER_READY

This distinction prevents transport success from being mistaken for domain understanding.

## Reference example

For a game roster:

    native save
        -> local game-save decoder
        -> { heroes: [{ class, level, stress, skills, ... }] }
        -> observation channel

The agent receives the roster model, not the native save file.
