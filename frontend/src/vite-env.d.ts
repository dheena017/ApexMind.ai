/// <reference types="vite/client" />

declare module 'lucide-react';

interface Window {
  FB?: {
    init: (options: { appId: string; xfbml: boolean; version: string }) => void;
    login: (
      callback: (response: { authResponse?: { accessToken: string } }) => void,
      options: { scope: string },
    ) => void;
  };
  fbAsyncInit?: () => void;
  google?: {
    accounts: {
      oauth2: any;
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (momentListener?: (notification: any) => void) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number | string;
          }
        ) => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
