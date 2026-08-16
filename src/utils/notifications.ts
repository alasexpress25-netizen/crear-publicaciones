/**
 * Safe notification & confirmation helper that never crashes in sandboxed iframes.
 */

export function safeAlert(message: string): void {
  try {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message);
      return;
    }
  } catch (err) {
    console.warn('window.alert blocked by sandbox environment:', message, err);
  }
  console.log('[Notification]', message);
}

export function safeConfirm(message: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.confirm) {
      return window.confirm(message);
    }
  } catch (err) {
    console.warn('window.confirm blocked by sandbox environment:', message, err);
  }
  return true;
}
