# DD1 Runtime Contract v0.2

Git `origin/main` is canonical desired state.

Explicit state: `desired_sha`, `validated_sha`, `running_sha`, `last_good_sha`, `health`.

A remote commit is a candidate, not a release. Validation and a live health probe happen while the accepted runtime remains serving. Activation starts only after both succeed. If activation fails, the controller attempts to restore `last_good_sha`.

Runtime observation is best-effort telemetry on `runtime-observation`; telemetry failure never changes deployment correctness. The branch is concurrent shared state: publishers refetch/reapply/retry and never force-push.

Bootstrap/control-plane lifecycle is separate from application payload lifecycle. A future supervised bootstrap must make controller self-update transactional.

## Human minimization invariant

A routine code/content change must require zero human terminal interaction. Human intervention is reserved for trust-boundary operations such as first repository authorization, first machine bootstrap, or OS-level permissions that cannot be delegated.
