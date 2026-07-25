import { Injectable, signal } from '@angular/core';

interface Me {
  username: string;
}

/**
 * Shared-login session state. The backend sets an HttpOnly cookie on sign-in, so
 * there's no token to hold here — we just track who we are for the UI.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly username = signal<string | null>(null);
  /** False until the initial /me check resolves, so the UI can avoid flashing the login form. */
  readonly ready = signal(false);

  constructor() {
    this.refresh();
  }

  get authed(): boolean {
    return this.username() !== null;
  }

  async refresh(): Promise<void> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      this.username.set(res.ok ? (await res.json() as Me).username : null);
    } catch {
      this.username.set(null);
    } finally {
      this.ready.set(true);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      this.username.set((await res.json() as Me).username);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore; clear locally regardless
    }
    this.username.set(null);
  }
}
