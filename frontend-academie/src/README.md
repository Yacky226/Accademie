# Frontend Architecture

## Goal

This frontend uses a vertical, responsibility-first architecture:

- `app/`: Next.js routes, layouts and route-level composition only.
- `core/`: application-wide infrastructure.
- `entities/`: pure business contracts shared by several features.
- `features/`: vertical business slices.
- `shared/`: generic and reusable technical building blocks.
- `widgets/`: optional cross-feature compositions.

The rule is simple: each directory owns one kind of responsibility and avoids becoming a dumping ground.

## Directory Responsibilities

### `app/`

Owns:

- route files
- layout files
- route-level composition

Must not own:

- API calls
- Redux slices
- domain logic
- reusable UI components

### `core/`

Owns:

- HTTP transport
- app configuration
- Redux store setup
- providers
- route guards
- session infrastructure

Must not own:

- feature-specific business logic
- page-specific UI

### `entities/`

Owns:

- pure domain types
- reusable domain helpers
- cross-feature contracts

Must stay framework-light and UI-free when possible.

### `features/`

Each feature must prefer this structure:

- `api/`: backend calls and transport mapping for the feature
- `model/`: slice, selectors, feature hooks, state types, fixtures
- `ui/components/`: reusable UI inside the feature
- `ui/pages/`: page-level views of the feature
- `lib/`: feature-local pure helpers

A feature should not depend on another feature's UI. It may depend on:

- `core`
- `entities`
- `shared`
- another feature's public model or API only when really needed

Feature naming must stay explicit.
If several authenticated spaces reuse the same business shell behavior, create a named feature such as
`workspace-shell/` instead of a vague folder like `features/shared/`.

### `shared/`

Owns only technical or generic reuse:

- buttons
- cards
- generic hooks
- generic utils
- generic formatting helpers

Must not contain business-specific names like `Student`, `Auth`, `PaymentCheckout`, etc.
If the code depends on roles, auth session, workspace navigation or domain-specific actions,
it belongs in a feature, not here.

### `widgets/`

Use only when a block composes several features into one reusable section.
If a widget is not used, do not create it.

## Naming Rules

- Use names that describe responsibility: `authenticated-api.client.ts`, `app-store.ts`, `session-cookie-store.ts`.
- Use `...Controller` for form or orchestration hooks.
- Use `...catalog.ts` for local static fixtures or option lists.
- Use `...types.ts` or `...contracts.ts` for pure types.
- Use `...Page.tsx` for page views and place them in `ui/pages`.
- Avoid `index.ts` barrels unless they define a real and stable module boundary.

## Dependency Direction

Preferred direction:

`app -> features -> entities/shared -> core`

Infrastructure can be used anywhere:

`features -> core`

What we avoid:

- `feature A` importing random UI files from `feature B`
- `student-space` owning the model of `student-code-editor`
- routes importing files from ambiguous barrels

## Practical Conventions

- Mock fixtures stay in the owning feature's `model/`.
- Feature CSS modules stay close to the owning feature UI.
- Redux state stays in the owning feature's `model/`.
- Backend DTOs stay in the owning feature, not in `shared/`.

## Current Cleanup Direction

The repo is being aligned toward this structure incrementally:

- auth -> `api`, `model`, `ui`
- notification-center -> `api`, `model`, `ui`
- student-space -> workspace shell and student pages only
- student-code-editor -> owns its own editor types, fixtures and API logic
- workspace-shell -> reusable authenticated shell logic for student, teacher and admin
