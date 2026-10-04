# Human Interventions

Human intervention is a first-class system event. Record every step that the agent cannot complete autonomously.

## HI-001 — Authorize a newly created repository

- Date: 2026-10-04
- Goal: allow ChatGPT/GitHub integration to manage DD1.
- Symptom: GitHub repository metadata reported push/admin permission, but Contents API writes returned `403 Resource not accessible by integration`.
- Human action: GitHub Settings → Applications → Installed GitHub Apps → Configure → add `dd1` to repository access.
- Result: resolved; agent successfully created the initial commit.
- Eliminable: currently no. Treat this as the onboarding step for a newly created repository unless the integration is configured for all repositories.

### Current repo onboarding contract

```
create repository
      ↓
configure GitHub integration repository access   [HUMAN]
      ↓
agent verifies write access
      ↓
agent bootstraps repository
      ↓
conversation-driven management
```

The goal is to keep this ledger shrinking as automation boundaries improve.
