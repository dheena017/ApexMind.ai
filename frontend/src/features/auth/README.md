# Authentication feature

Contains the sign-in experience and API integration for email/password, Google, Facebook, and Instagram professional accounts. Facebook and Instagram sign-in use a backend authorization-code exchange; app secrets are kept on the backend.

Configure one shared `META_APP_ID`, `META_APP_SECRET`, and `META_AUTH_REDIRECT_URI` in the backend environment. Register the configured `/login` redirect URI for both Facebook Login and Instagram Business Login in the same Meta app.

The social fleet uses the same Meta app credentials to connect publishing destinations. Set `META_REDIRECT_URI` to the app's `/channels` URL and register it as a valid OAuth redirect URI. Facebook connects managed Pages through Facebook Login. Instagram connects professional accounts directly through Instagram Business Login, requesting `instagram_business_basic` and `instagram_business_content_publish`; it does not require a linked Facebook Page. Enable Instagram API with Instagram Login and configure the redirect URI in the Meta app dashboard. A personal Instagram profile or a typed handle is not a publishing destination.
