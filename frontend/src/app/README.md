# Application shell and navigation

This folder coordinates the frontend pages rather than implementing individual product features.

- `AppRouter.tsx` maps the active page identifier to its React page component.
- `AppLayout.tsx` renders the signed-in application navigation and shell.
- `routes.ts` defines URL-to-page helpers and route metadata.

Top-level page state and the current demo authentication gate are owned by `../App.tsx`.
