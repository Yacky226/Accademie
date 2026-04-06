# `features/`

Each feature should own one business capability.

Preferred internal structure:

- `api/`
- `model/`
- `ui/components/`
- `ui/pages/`
- `lib/`

If a feature grows, split by responsibility before adding more root files.

Rules that matter in this repo:

- do not create a fake `shared` feature for convenience
- if a capability is reused across several business spaces, give it a business name
- example: `workspace-shell/` is acceptable, `features/shared/` is not
- a feature may expose UI only inside itself; cross-feature reuse should prefer model/API contracts
