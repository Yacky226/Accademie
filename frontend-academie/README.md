# Architect Academy Frontend

Next.js frontend for the Architect Academy platform.

## Stack

- Next.js App Router
- TypeScript
- Redux Toolkit
- CSS Modules
- Monaco Editor for the coding workspace

## Commands

```bash
npm run dev
npm run build
npm run lint
```

The local frontend runs by default on `http://localhost:3000`.

## Source Layout

The real application architecture lives in [src/README.md](./src/README.md).

Short version:

- `src/app/`: routes and layouts only
- `src/core/`: infrastructure
- `src/entities/`: shared business contracts
- `src/features/`: business capabilities
- `src/shared/`: generic technical reuse only
- `src/widgets/`: optional cross-feature compositions

## Architecture Rules

- UI stays separated from business state and API transport.
- Feature state lives in `model/`.
- Backend calls live in `api/`.
- Page-level views live in `ui/pages/` when the feature uses the full structure.
- Avoid ambiguous names and convenience barrels.
- If code is business-specific, do not place it in `src/shared/`.

## Current Named Cross-Space Feature

`src/features/workspace-shell/` owns the authenticated shell pieces reused by student, teacher and admin spaces:

- profile badge
- sidebar toggle state
- logout shell actions

This keeps `src/shared/` free from role-aware business logic.
