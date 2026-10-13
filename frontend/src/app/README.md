# Application shell and navigation

This folder coordinates the frontend pages rather than implementing individual product features.

- `AppRouter.tsx` maps the active page identifier to its React page component.
- `AppLayout.tsx` renders the signed-in application navigation and shell.
- `routes.ts` defines URL-to-page helpers and route metadata.
- Profile subsections are independent routes (`/profile/details`, `/profile/preferences`, `/profile/channels`, `/profile/activity`, `/profile/usage`, and `/profile/security`) and are rendered inside their shared profile section navigation.

Top-level page state and the current demo authentication gate are owned by `../App.tsx`.
