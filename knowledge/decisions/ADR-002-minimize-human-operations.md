# ADR-002 — Minimize human operations

Status: Accepted

DD1 treats human interaction as a scarce control-plane dependency. Routine deployment, update, health inspection, log/state relay, restart and recovery must be automated where technically possible. Human actions are reserved for external trust boundaries and are recorded in `knowledge/human-interventions.md`.
