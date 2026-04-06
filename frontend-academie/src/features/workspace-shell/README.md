# `workspace-shell/`

This feature owns reusable business UI for authenticated workspaces.

Use it for:

- sidebar collapse state shared by student, teacher and admin spaces
- authenticated profile badges for workspace shells
- workspace logout and shell-level actions

Do not place these files in `src/shared/` because they are not generic primitives.
They depend on business context such as authentication, roles and workspace navigation.
