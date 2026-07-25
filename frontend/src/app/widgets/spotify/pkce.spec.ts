import { codeChallenge, randomState, randomVerifier } from './pkce';

describe('Spotify PKCE helpers', () => {
  it('creates verifier and state values with the required safe alphabets', () => {
    expect(randomVerifier()).toMatch(/^[A-Za-z0-9._~-]{96}$/);
    expect(randomState()).toMatch(/^[a-f0-9]{32}$/);
  });

  it('creates the RFC 7636 S256 challenge', async () => {
    await expect(codeChallenge(
      'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    )).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
