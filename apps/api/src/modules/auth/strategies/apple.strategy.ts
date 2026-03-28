import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppleProfile {
  id: string;
  email: string;
  displayName?: string;
}

/**
 * Apple Sign-In strategy placeholder.
 *
 * In production, verify the Apple identity token (JWT) server-side
 * by fetching Apple's public keys from https://appleid.apple.com/auth/keys
 * and verifying the JWT signature.
 *
 * Mobile flow:
 *   1. Client uses expo-apple-authentication or ASAuthorizationController
 *   2. Client receives identityToken + authorizationCode + optional user info
 *   3. Client sends identityToken to POST /auth/apple
 *   4. Server verifies the JWT with Apple's public keys
 *
 * Note: Apple only provides user name on the FIRST sign-in. Store it.
 */
@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);

  constructor(private readonly config: ConfigService) {}

  async verifyIdentityToken(
    identityToken: string,
    userInfo?: { firstName?: string; lastName?: string },
  ): Promise<AppleProfile> {
    const clientId = this.config.get<string>('auth.apple.clientId');

    if (!clientId) {
      throw new Error(
        'Apple Sign-In not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID.',
      );
    }

    // TODO: Replace with actual Apple token verification:
    //
    // 1. Fetch Apple's public keys: GET https://appleid.apple.com/auth/keys
    // 2. Decode the identityToken header to get the 'kid'
    // 3. Find the matching key and verify the JWT
    // 4. Validate: iss === 'https://appleid.apple.com'
    //              aud === clientId
    //              exp > now
    //
    // import * as jwt from 'jsonwebtoken';
    // import jwksClient from 'jwks-rsa';
    //
    // const client = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' });
    // const decoded = jwt.decode(identityToken, { complete: true });
    // const key = await client.getSigningKey(decoded.header.kid);
    // const payload = jwt.verify(identityToken, key.getPublicKey(), {
    //   audience: clientId, issuer: 'https://appleid.apple.com',
    // });
    //
    // const displayName = userInfo
    //   ? [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ')
    //   : undefined;
    //
    // return { id: payload.sub, email: payload.email, displayName };

    this.logger.warn(
      'Apple identity token verification is not yet implemented. ' +
        'Using placeholder that rejects all tokens.',
    );

    throw new Error(
      'Apple Sign-In verification not yet implemented. ' +
        'See apple.strategy.ts for integration instructions.',
    );
  }
}
