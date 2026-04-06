# `shared/`

`shared/` is for generic technical reuse only.

Good examples:

- generic UI primitives
- generic utility hooks
- formatting helpers

Bad examples:

- `StudentTopBar`
- `AuthHeader`
- `PaymentCheckoutSummary`

Business-specific code belongs in `features/`.

Examples that should stay out of `shared/` in this project:

- workspace profile badges
- sidebar collapse state for authenticated shells
- logout actions tied to auth session state

These belong in `features/workspace-shell/` because they depend on business context.
