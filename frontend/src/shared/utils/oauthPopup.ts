const OAUTH_HOSTS = new Set(['www.instagram.com', 'www.facebook.com']);

export function openOAuthPopup(): Window | null {
  const popup = window.open('about:blank', '_blank');
  if (!popup) return null;

  popup.document.title = 'Connecting account';
  popup.document.body.textContent = 'Preparing secure sign-in...';
  popup.document.body.style.cssText =
    'margin:0;padding:32px;background:#0a0a0a;color:#e5e5e5;font:16px system-ui,sans-serif';
  return popup;
}

export function navigateOAuthPopup(popup: Window, authorizationUrl: string): void {
  const destination = new URL(authorizationUrl);
  if (destination.protocol !== 'https:' || !OAUTH_HOSTS.has(destination.hostname)) {
    throw new Error('The identity provider returned an unsupported authorization URL.');
  }

  popup.opener = null;
  popup.location.replace(destination.href);
}
