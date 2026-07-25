const VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** A 96-char PKCE code verifier from the allowed unreserved character set. */
export function randomVerifier(): string {
  const bytes = new Uint8Array(96);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => VERIFIER_CHARS[b % VERIFIER_CHARS.length]).join('');
}

/** S256 code challenge: base64url(SHA-256(verifier)). */
export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(digest);
}

/** Random URL-safe state token for CSRF protection. */
export function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
