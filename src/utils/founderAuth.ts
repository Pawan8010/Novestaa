const FOUNDER_TOKEN_STORAGE_KEY = 'novesta_founder_token';

export function getFounderToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(FOUNDER_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setFounderToken(token: string | undefined | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.sessionStorage.setItem(FOUNDER_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(FOUNDER_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction errors; HttpOnly cookie still works as fallback
  }
}

export function clearFounderToken(): void {
  setFounderToken(null);
}

export function getFounderHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const token = getFounderToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
