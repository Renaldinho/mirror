import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { NotesService } from '../widgets/notes.service';

/**
 * The phone control surface (route `/remote`). Signed out, it shows the shared
 * login; signed in, it's a big touch-friendly editor for the mirror's note.
 * More push-to-mirror tools (image casting, …) slot in beside the note.
 */
@Component({
  selector: 'app-remote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="remote">
      @if (!auth.ready()) {
        <div class="card"><p class="muted">…</p></div>
      } @else if (!auth.authed) {
        <form class="card" (submit)="submit($event)">
          <h1>Mirror</h1>
          <p class="muted">Sign in to update the mirror.</p>
          <input
            placeholder="username"
            autocomplete="username"
            [value]="user()"
            (input)="user.set($any($event.target).value)"
          />
          <input
            type="password"
            placeholder="password"
            autocomplete="current-password"
            [value]="pass()"
            (input)="pass.set($any($event.target).value)"
          />
          <button type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
          @if (error()) { <p class="error">{{ error() }}</p> }
        </form>
      } @else {
        <div class="card">
          <header>
            <span class="muted">Signed in as {{ auth.username() }}</span>
            <button class="link" (click)="auth.logout()">Sign out</button>
          </header>
          <label>Shared note</label>
          <textarea
            [value]="notes.text()"
            (input)="notes.edit($any($event.target).value)"
            placeholder="Type a note for the mirror…"
          ></textarea>
          <p class="muted">Saved &amp; synced to the mirror automatically.</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #14110d;
        color: #f0e7d8;
        font-family: system-ui, sans-serif;
      }
      .remote {
        max-width: 560px;
        margin: 0 auto;
        padding: 24px 16px;
        min-height: 100vh;
        display: flex;
        align-items: center;
      }
      .card {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 22px;
        border: 1px solid rgba(240, 231, 216, 0.14);
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.35);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
      }
      h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      label {
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #c99b58;
      }
      input,
      textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 14px;
        font-size: 16px; /* 16px avoids iOS zoom-on-focus */
        color: inherit;
        background: rgba(240, 231, 216, 0.06);
        border: 1px solid rgba(240, 231, 216, 0.16);
        border-radius: 10px;
        outline: none;
      }
      input:focus,
      textarea:focus {
        border-color: #c99b58;
      }
      textarea {
        min-height: 42vh;
        resize: vertical;
        line-height: 1.5;
      }
      button {
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        color: #14110d;
        background: #c99b58;
        border: none;
        border-radius: 10px;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
      }
      .link {
        padding: 0;
        color: #c99b58;
        background: none;
        font-weight: 400;
        text-decoration: underline;
        font-size: 13px;
      }
      .muted {
        margin: 0;
        color: rgba(240, 231, 216, 0.6);
        font-size: 13px;
      }
      .error {
        margin: 0;
        color: #e0736b;
        font-size: 13px;
      }
    `,
  ],
})
export class RemotePage {
  readonly auth = inject(AuthService);
  readonly notes = inject(NotesService);
  readonly user = signal('');
  readonly pass = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    const ok = await this.auth.login(this.user(), this.pass());
    if (!ok) this.error.set('Wrong username or password.');
    this.busy.set(false);
  }
}
