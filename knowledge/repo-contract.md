# DD1 Runtime Contract v0.1

Git `origin/main` is canonical desired state.

The controller distinguishes `desired_sha`, `validated_sha`, `running_sha`, `last_good_sha`, and health.

A remote commit is a candidate until validation succeeds. Validation must happen without corrupting the accepted runtime. Activation requires candidate health evidence. Failed candidates must leave the previous accepted version recoverable.

Observation is best-effort telemetry and must not determine deployment correctness.

Bootstrap/control-plane lifecycle is separate from application payload lifecycle.
