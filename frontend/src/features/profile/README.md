# Profile feature

The profile area is split into distinct routed screens, each with its own page module:

- `/profile` — overview and profile setup checklist.
- `/profile/details` — public creator details and social links.
- `/profile/preferences` — content generation defaults.
- `/profile/channels` — connected YouTube channels.
- `/profile/activity` — recent scripts, Shorts, and milestones.
- `/profile/usage` — creation counts from saved studio activity.
- `/profile/security` — sign-in status and supported security controls.

`api/profileApi.ts` stores editable profile details and generation preferences in browser storage scoped to the signed-in user ID. These details are browser-local and do not sync across devices. Channel, activity, and usage data use the existing studio APIs. Billing, two-factor authentication, and session-management controls are not currently provided by the backend.
