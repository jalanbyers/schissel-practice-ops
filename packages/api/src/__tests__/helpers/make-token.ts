/**
 * Test JWT factory.
 *
 * Generates a real RS256 key pair in-process. The returned `verifier` is wired
 * to the in-memory public key — no network, no Auth0 dependency.
 * The returned `sign` function mints tokens with whichever claims you specify.
 *
 * Usage:
 *   const { verifier, sign } = await createTestAuthPair();
 *   const token = await sign({ tenantId: 'tenant-a', roles: ['owner'], mfa: true });
 */

import { SignJWT, generateKeyPair, jwtVerify, type KeyLike } from 'jose';
import { TENANT_CLAIM, ROLES_CLAIM, type Auth0Payload, type JwtVerifier } from '../../plugins/auth.js';

export interface TestSignOptions {
  tenantId?: string;       // omit to produce a token with no tenant claim
  userId?: string;
  roles?: string[];
  mfa?: boolean;
  expiresIn?: string;      // default '1h'
}

export interface TestAuthPair {
  verifier: JwtVerifier;
  sign: (opts?: TestSignOptions) => Promise<string>;
}

export async function createTestAuthPair(): Promise<TestAuthPair> {
  const { privateKey, publicKey } = await generateKeyPair('RS256');

  const verifier: JwtVerifier = async (token) => {
    const { payload } = await jwtVerify(token, publicKey as KeyLike);
    return payload as Auth0Payload;
  };

  const sign = async (opts: TestSignOptions = {}): Promise<string> => {
    const {
      tenantId,
      userId    = 'user-test-001',
      roles     = ['owner'],
      mfa       = true,
      expiresIn = '1h',
    } = opts;

    const claims: Record<string, unknown> = {
      sub:        userId,
      [ROLES_CLAIM]: roles,
      amr:        mfa ? ['pwd', 'mfa'] : ['pwd'],
    };

    // Only add the tenant claim when tenantId is explicitly provided — lets
    // tests exercise the "missing tenant claim" rejection path.
    if (tenantId !== undefined) {
      claims[TENANT_CLAIM] = tenantId;
    }

    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(privateKey as KeyLike);
  };

  return { verifier, sign };
}
