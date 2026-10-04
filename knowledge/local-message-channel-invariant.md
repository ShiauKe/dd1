# DD1 Invariant: Local Message Channel

Status: normative

## Principle

When a DD1-managed task depends on state that exists outside the agent's directly observable environment, the system MUST provide a machine-readable message channel across that boundary.

Human copy/paste is diagnostic fallback, not a steady-state transport.

## Why this is an invariant

Repository access proves only that the agent can control repository state. It does not prove that the agent can observe or affect the local world in which the repository executes.

Examples include:

- local files and application data;
- runtime stdout/stderr and process health;
- localhost services;
- device state;
- Steam save data;
- credentials or permissions that intentionally remain local.

If such state is required for the next decision, AUTONOMY_READY is not satisfied until the required boundary is bridged or explicitly declared outside the automation scope.

## Minimum observation contract

A local message MUST be:

1. **Observable** — the agent can retrieve it without asking the human to relay routine output.
2. **Attributable** — the message identifies its source/capability sufficiently to avoid confusing one runtime or machine with another.
3. **Fresh** — it carries observation time or another freshness signal.
4. **Machine-readable** — stable structured data is preferred over prose/stdout scraping.
5. **Evidence-bearing** — it reports observed facts and failures rather than silently substituting assumptions.

A transport MAY be a Git branch, file sync, API, socket, queue, connector, or another mechanism. DD1 specifies the contract, not the transport.

## Command extension

If autonomous work also requires agent-to-local actions, the channel SHOULD additionally be:

6. **Commandable** — an authorized command can cross into the local environment.
7. **Acknowledged** — the local side emits structured evidence of acceptance, completion, or failure.

Command capability MUST be narrower than arbitrary remote execution unless arbitrary execution is explicitly required and authorized.

## Canonical shape

    Agent-visible world
            ^
            | observation
            |
    LOCAL MESSAGE CHANNEL
            |
            | command (optional)
            v
        Local world

## Readiness rule

For every task dependency, ask:

> Does the next autonomous decision require state the agent cannot directly observe?

If no, continue.

If yes, either establish a local message channel or remain at the earliest readiness state whose evidence is incomplete.

Do not make recurring human copy/paste part of the normal operating path.

## Relation to takeover lifecycle

- ACCESS_READY concerns repository reachability and control.
- DEVELOPMENT_READY concerns safe repository evolution.
- AUTONOMY_READY requires all message boundaries needed for normal evolution to be closed.
- RUNTIME_READY may introduce additional local message channels, but runtime is not itself required for takeover.

Therefore:

    local dependency + no channel => not autonomous for that dependency

The invariant is capability-scoped, not machine-scoped: one local channel does not imply the agent can observe every resource on that machine.

## Reference transport pattern

For environments where GitHub is already trusted:

    local capability
        -> structured observation artifact
        -> dedicated observation branch
        -> agent reads artifact

This is a reference implementation only. Repositories MUST NOT depend on DD1 itself as a runtime merely to satisfy the invariant.


## Delivery invariant

A sender-side execution is not evidence of delivery.

Every message SHOULD carry a unique message identity. When delivery matters, the transport MUST distinguish at least:

    CREATED -> SENT -> DELIVERED

SENT means the local transport attempted publication.
DELIVERED means the agent-visible endpoint independently reflects the same message identity (or an equivalent verifiable receipt).

Freshness MUST be evaluated at the receiving boundary. A successful command with a stale remote observation is a failed delivery, not a successful observation.

Transport implementations SHOULD avoid coupling message publication to the application's mutable working tree. Observation state and development state are separate state machines and SHOULD NOT overwrite or block each other.
