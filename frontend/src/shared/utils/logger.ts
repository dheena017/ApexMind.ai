/**
 * ApexMind Studio - Client-Side Styled Console Logger
 * Provides rich, color-coded DevTools logging with CSS styles, module badges,
 * latency metrics, and API tracing.
 */

const BADGE_STYLES: Record<string, string> = {
  default: 'background: #2563EB; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  API: 'background: #0284C7; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Studio: 'background: #4F46E5; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  YouTube: 'background: #DC2626; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Gemini: 'background: #9333EA; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Auth: 'background: #0D9488; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Router: 'background: #6366F1; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Dashboard: 'background: #2563EB; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Settings: 'background: #475569; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Profile: 'background: #7C3AED; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Notifications: 'background: #EA580C; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Success: 'background: #16A34A; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Warn: 'background: #D97706; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  Error: 'background: #B91C1C; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
};

const TEXT_STYLES: Record<string, string> = {
  info: 'color: #93C5FD; font-size: 11px;',
  action: 'color: #C084FC; font-weight: 600; font-size: 11px;',
  success: 'color: #86EFAC; font-weight: 600; font-size: 11px;',
  warn: 'color: #FDE047; font-weight: 600; font-size: 11px;',
  error: 'color: #FCA5A5; font-weight: 600; font-size: 11px;',
  dim: 'color: #9CA3AF; font-size: 10px;',
};

function sendToTerminal(level: string, module: string, message: string) {
  if (typeof window === 'undefined') return;

  const payload = {
    level,
    module,
    message: typeof message === 'string' ? message : JSON.stringify(message),
  };

  try {
    if ((import.meta as any).hot) {
      (import.meta as any).hot.send('apexmind:client-log', payload);
      return;
    }
  } catch {
    // fallback to fetch
  }

  try {
    fetch('/__apex_client_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export const consoleLogger = {
  info(module: string, message: string, detail?: unknown) {
    sendToTerminal('INFO', module, message);
    const badge = BADGE_STYLES[module] || BADGE_STYLES.default;
    const time = new Date().toLocaleTimeString();
    if (detail !== undefined) {
      console.log(`%c${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.info, detail);
    } else {
      console.log(`%c${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.info);
    }
  },

  action(module: string, message: string, detail?: unknown) {
    sendToTerminal('ACTION', module, message);
    const badge = BADGE_STYLES[module] || BADGE_STYLES.default;
    const time = new Date().toLocaleTimeString();
    if (detail !== undefined) {
      console.log(`%c⚡ ${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.action, detail);
    } else {
      console.log(`%c⚡ ${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.action);
    }
  },

  nav(fromRoute: string, toRoute: string) {
    sendToTerminal('INFO', 'Router', `Navigated: ${fromRoute} ➔ ${toRoute}`);
    const badge = BADGE_STYLES.Router;
    const time = new Date().toLocaleTimeString();
    console.log(
      `%cRouter%c %c[${time}]%c Navigated: %c${fromRoute}%c ➔ %c${toRoute}`,
      badge,
      '',
      TEXT_STYLES.dim,
      'color: #9CA3AF; font-size: 11px;',
      'color: #F59E0B; font-weight: 700; font-size: 11px;',
      'color: #9CA3AF;',
      'color: #60A5FA; font-weight: 700; font-size: 11px;'
    );
  },

  success(module: string, message: string, detail?: unknown) {
    sendToTerminal('SUCCESS', module, message);
    const badge = BADGE_STYLES[module] || BADGE_STYLES.Success;
    const time = new Date().toLocaleTimeString();
    if (detail !== undefined) {
      console.log(`%c${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.success, detail);
    } else {
      console.log(`%c${module}%c %c[${time}]%c ${message}`, badge, '', TEXT_STYLES.dim, TEXT_STYLES.success);
    }
  },

  warn(module: string, message: string, detail?: unknown) {
    sendToTerminal('WARN', module, message);
    const time = new Date().toLocaleTimeString();
    if (detail !== undefined) {
      console.warn(`%cWARN: ${module}%c %c[${time}]%c ${message}`, BADGE_STYLES.Warn, '', TEXT_STYLES.dim, TEXT_STYLES.warn, detail);
    } else {
      console.warn(`%cWARN: ${module}%c %c[${time}]%c ${message}`, BADGE_STYLES.Warn, '', TEXT_STYLES.dim, TEXT_STYLES.warn);
    }
  },

  error(module: string, message: string, detail?: unknown) {
    sendToTerminal('ERROR', module, message);
    const time = new Date().toLocaleTimeString();
    if (detail !== undefined) {
      console.error(`%cERR: ${module}%c %c[${time}]%c ${message}`, BADGE_STYLES.Error, '', TEXT_STYLES.dim, TEXT_STYLES.error, detail);
    } else {
      console.error(`%cERR: ${module}%c %c[${time}]%c ${message}`, BADGE_STYLES.Error, '', TEXT_STYLES.dim, TEXT_STYLES.error);
    }
  },

  api(method: string, endpoint: string, status: number, durationMs: number, detail?: unknown) {
    const statusColor = status < 300 ? '#16A34A' : status < 400 ? '#0284C7' : '#DC2626';
    const badgeStyle = `background: ${statusColor}; color: #FFFFFF; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;`;
    const latencyStyle = durationMs < 100 ? 'color: #4ADE80;' : durationMs < 400 ? 'color: #FACC15;' : 'color: #F87171;';
    const time = new Date().toLocaleTimeString();

    console.log(
      `%c${method} ${status}%c %c[${time}]%c ${endpoint} %c(${durationMs.toFixed(1)}ms)`,
      badgeStyle,
      '',
      TEXT_STYLES.dim,
      'color: #E5E5E5; font-weight: 600;',
      latencyStyle,
      detail ?? ''
    );
  },

  printDevBanner() {
    sendToTerminal('INFO', 'App', 'Client runtime active in browser: React 19 + TailwindCSS v4');
    const titleStyle = 'background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%); color: #FFFFFF; font-weight: 900; font-size: 14px; padding: 6px 12px; border-radius: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.4);';
    const subStyle = 'color: #60A5FA; font-weight: 600; font-size: 11px; margin-top: 4px;';
    console.log('%c⚡ ApexMind AI Studio — Client Initialized%c\nFastAPI Backend: http://localhost:8000 | Gemini TTS & Shorts Automation Active', titleStyle, subStyle);
  },
};
