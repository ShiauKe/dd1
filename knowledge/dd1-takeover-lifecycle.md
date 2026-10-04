# DD1 Takeover Lifecycle Contract v1

Status: Normative

## Purpose

DD1 defines when an agent has finished taking over a repository.

The canonical completion state of a takeover is **AUTONOMY_READY**.

**RUNTIME_READY is optional and MUST NOT be used as a prerequisite for takeover completion.**

## Lifecycle

```
TAKEOVER_REQUESTED
        |
        v
ACCESS_READY
        |
        v
DEVELOPMENT_READY
        |
        v
AUTONOMY_READY  <--- TAKEOVER COMPLETE
        |
        +---- optional ----> RUNTIME_READY
```

## 1. TAKEOVER_REQUESTED

The human has identified or selected a repository and expressed intent for the agent to take it over.

This is an intent state, not a readiness state.

## 2. ACCESS_READY

The agent can identify the intended repository and has sufficient repository permissions for the requested work.

Minimum evidence:
- repository identity is unambiguous;
- repository contents can be inspected;
- required write operations are available when modification is expected.

ACCESS_READY answers:

> Can the agent reach and control the repository?

## 3. DEVELOPMENT_READY

The agent has enough repository understanding to make a change without rediscovering basic operating instructions from the human.

Minimum evidence:
- repository structure has been inspected;
- relevant architecture / entrypoints are understood to the degree required for safe change;
- repository-local constraints and instructions have been discovered;
- a validation path is known, or the absence of one is explicitly recognized;
- the agent knows how changes should be committed or otherwise persisted.

DEVELOPMENT_READY answers:

> Can the agent make the next change safely?

It does **not** require a deployed or continuously running application.

## 4. AUTONOMY_READY

Normal repository evolution can proceed from human intent without recurring human infrastructure operations.

This is the canonical **TAKEOVER COMPLETE** state.

Acceptance criteria:
- the human can express a product / engineering intent directly;
- the agent can inspect, modify, validate, and persist the resulting repository change;
- failures are handled by evidence-first diagnosis at the earliest unproven gate;
- reusable discoveries and failure knowledge are sedimented when materially useful;
- routine work does not require the human to run Git, shell, deployment, or recovery commands merely to let the agent continue;
- any unavoidable human action is treated as an explicit external trust boundary or an automation gap, not normal workflow.

AUTONOMY_READY answers:

> Can the human stop operating repository infrastructure and return to expressing intent?

## 5. RUNTIME_READY — Optional

Use only when the repository's purpose requires a running system.

Examples:
- web application;
- daemon;
- local service;
- scheduled worker;
- deployed backend.

Its acceptance criteria are workload-specific and may include deployment, process ownership, health checks, rollback, observation, or restart behavior.

A library, documentation repository, design repository, or inactive prototype may never need RUNTIME_READY.

RUNTIME_READY answers:

> If this repository must execute somewhere, is that execution environment ready?

It does not answer whether takeover is complete.

## Human Operation Boundary

For a normal ChatGPT + GitHub takeover flow, the target interface is:

```
Human:
  create/select repository
  request takeover
             |
=============|================
             v
Agent:
  establish ACCESS_READY
  establish DEVELOPMENT_READY
  establish AUTONOMY_READY
  evolve repository from intent
```

Repository creation may itself become agent-operated when permissions permit; it is not intrinsic to the DD1 protocol.

## Failure rule

Readiness states are evidence-based.

If a required criterion is not proven, the repository remains at the earliest state whose exit criteria are unproven.

Do not compensate for an unproven upstream state by debugging downstream capabilities.

## Definition of Done

When the user says **"take over this repo"**, DD1 is done when:

```
state = AUTONOMY_READY
```

The practical user-facing test is:

> The user's next message can be a direct change request, and the agent can carry it through without asking the user to operate repository infrastructure.

That is the DD1 takeover completion contract.
