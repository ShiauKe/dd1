# Deployment Closure Acceptance

Status: Active acceptance contract

Deployment Closure is accepted only when both success and failure paths are proven by runtime evidence.

## Success path

```
desired
  → candidate_found
  → validated
  → candidate healthy
  → activated
  → deployed
  → desired_sha == validated_sha == running_sha
```

Required invariants:
- accepted runtime remains available until candidate validation and health pass;
- activation is automatic;
- observation reports the resulting running SHA;
- routine human operations = 0.

## Failure path

```
bad desired
  → candidate_found
  → validation/health failure
  → deploy_failed
  → accepted runtime remains running and healthy
```

Required observation:
- `desired_sha` identifies the rejected desired state;
- `validated_sha` is null when validation did not pass;
- `running_sha` remains the accepted runtime;
- `health = healthy`;
- `last_result = deploy_failed`;
- `error` contains bounded diagnostic evidence.

## Recovery path

When a repaired desired state is published after failure, the controller must detect, validate and deploy it without human runtime operation.

## Evidence from 2026-10-04

Intentional invalid JavaScript candidate `abe96b7` was rejected while accepted runtime `9dded811` remained healthy. Repaired candidate `cb3fc99` was subsequently detected, validated and deployed automatically.

This proved reject → preserve → recover with zero human runtime operations.

One schema defect was discovered: failed observation lost `desired_sha`. The controller was updated so future failure observations preserve the rejected desired SHA.
