# Authentication feature

Contains the sign-in experience and API integration for email/password, Google, Facebook, and Instagram professional accounts. Facebook and Instagram sign-in use a backend authorization-code exchange; app secrets are kept on the backend.

Configure one shared `META_APP_ID`, `META_APP_SECRET`, and `META_AUTH_REDIRECT_URI` in the backend environment. Register the configured `/login` redirect URI for both Facebook Login and Instagram Business Login in the same Meta app.
