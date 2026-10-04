# Failure Pattern: Branch-Coupled Observation Transport

Date observed: 2026-10-04
Status: reproduced, fixed, verified

## Context

A local message channel published structured runtime observations to a dedicated Git branch.

The first publication succeeded. A later publication appeared to run locally, but the receiver still observed the old message.

## Failure

The implementation wrote the new observation into the application's current working tree and then switched from the development branch to the observation branch before committing and pushing.

Conceptually:

    write observation on development worktree
        -> switch branch
        -> commit observation
        -> push

This accidentally worked on the first run because the observation file was initially untracked. Once the observation branch tracked that path, later branch switching introduced state coupling: the transport's branch state could overwrite, block, or preserve stale observation state.

The dangerous symptom was:

    sender command ran
        !=
    receiver obtained fresh message

## Why this is a general trap

First-run success can hide a state-transition bug.

An operation may have different semantics across:

    ABSENT -> CREATED

and:

    EXISTS -> UPDATED

A bootstrap path that works only while an artifact is untracked is not evidence that the steady-state path works.

This pattern is especially dangerous when transport state shares a mutable working tree with development state.

## Invariants learned

### 1. Separate state machines

Development state and observation/transport state are distinct state machines.

They SHOULD NOT depend on branch switching in the same mutable working tree.

### 2. Verify steady state, not only bootstrap

A channel is not proven by one successful message.

At minimum test:

    first publish
    -> second publish with changed message identity
    -> receiver observes second identity

### 3. Sender success is not delivery

Use unique message identity and receiver-visible acknowledgement:

    CREATED -> SENT -> DELIVERED

DELIVERED requires evidence at the receiving boundary.

### 4. Prefer branch-safe transport

When Git is used as a transport, construct/update the observation commit independently of the application working tree (for example through Git object/index plumbing, a separate worktree, or another isolated transport mechanism).

## Fix applied in reference implementation

The Darkest Dungeon manager local channel was changed to:

    build structured observation
        -> assign unique messageId
        -> construct Git blob/tree/commit without switching application branch
        -> push commit directly to observation ref
        -> query remote ref
        -> require remote SHA == pushed commit SHA

The application working tree remains on its development branch.

## Verification evidence

After the fix, a second observation arrived with a new message identity and fresh timestamp, and the receiver independently observed the updated Steam profile discovery.

The channel advanced from:

    save-root-found

to:

    profile-found

and exposed the real Darkest Dungeon roster path:

    profile_0/persist.roster.json

## Reusable review question

Whenever a local channel or deployment mechanism succeeds once, ask:

> Does the second state transition follow the same semantics as the first, or did the first run only succeed because the destination did not yet exist?

Treat this as a standard DD1 steady-state validation check.
