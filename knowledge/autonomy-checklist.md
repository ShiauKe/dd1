# DD1 Autonomy Checklist

Status: Active governance artifact

Goal: minimize required human operation. Routine change target: **human operations = 0**.

A stage is not considered complete because code exists. It is complete only when runtime evidence proves the state.

## Checklist

| # | Stage | Desired state | Current state | Human operation target | Evidence / strategy |
|---|---|---|---|---:|---|
| 1 | Repository creation | repo exists | done | one-time | external trust boundary |
| 2 | Agent repository authorization | agent can write GitHub | done | one-time/repo | HI-001 |
| 3 | Mac clone | machine has DD1 | executed | one-time/machine | installer |
| 4 | Node/Git dependency | bootstrap verifies prerequisites | partial | 0 routine | preflight + classified failure |
| 5 | launchd installation | starts after login | executed, unverified | one-time/machine | HI-002 + evidence |
| 6 | Bootstrap startup | supervisor ready | unverified | 0 | readiness evidence |
| 7 | Controller startup | watches origin/main | unverified | 0 | heartbeat/evidence |
| 8 | GitHub read | controller can fetch main | unverified | 0 | read probe |
| 9 | GitHub write | observer can publish | unverified | at most one trust grant | first successful observation |
| 10 | Candidate discovery | automatic | implemented | 0 | desired != running |
| 11 | Validation | isolated, accepted runtime preserved | implemented | 0 | worktree validation |
| 12 | Candidate health | candidate proves live before activation | implemented | 0 | probe port |
| 13 | Activation | automatic | partial | 0 | activation evidence |
| 14 | Payload rollback | failed candidate preserves/restores last good | partial | 0 | recovery test |
| 15 | Controller update | self-update without human restart | partial | 0 | supervised handoff |
| 16 | Observer update | update without human restart | partial | 0 | controller handoff |
| 17 | Runtime observation | agent can inspect machine state | not closed | 0 | runtime-observation |
| 18 | Error observation | agent can diagnose failure | partial | 0 | structured error state |
| 19 | Login/reboot recovery | automatic | unverified | 0 | launchd recovery test |
| 20 | Network interruption | catches up after recovery | unverified | 0 | bounded retry + poll |
| 21 | Observation push race | converges without force push | partial | 0 | refetch/reapply |
| 22 | Dirty working tree | routine runtime never needs manual cleanup | partial | 0 | isolate mutable state |
| 23 | Routine conversation change | conversation is the only human interface | target | **0** | end-to-end proof |

## Gate rule

Do not debug downstream stages while an upstream gate lacks evidence.

Current critical path:

```
dependency readiness
  → launchd
  → bootstrap
  → controller
  → GitHub read
  → GitHub write
  → observation
```

Only after this path is closed should deployment/autonomy claims be accepted.
