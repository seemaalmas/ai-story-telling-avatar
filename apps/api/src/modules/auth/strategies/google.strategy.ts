import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

/**
 * Google Sign-In strategy placeholder.
 *
 * In production, integrate with passport-google-oauth20 or verify the
 * Google ID token server-side using Google's tokeninfo endpoint or
 * the google-auth-library npm package.
 *
 * Mobile flow:
 *   1. Client uses expo-auth-session / Google Sign-In SDK to get idToken
 *   2. Client sends idToken to POST /auth/google
 *   3. Server verifies idToken with Google and extracts profile
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(private readonly config: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    const clientId = this.config.get<string>('auth.google.clientId');

    if (!clientId) {
      throw new Error(
        'Google Sign-In not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    // TODO: Replace with actual Google token verification:
    //
    // import { OAuth2Client } from 'google-auth-library';
    // const client = new OAuth2Client(clientId);
    // const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    // const payload = ticket.getPayload();
    // return {
    //   id: payload.sub,
    //   email: payload.email,
    //   displayName: payload.name,
    //   photoUrl: payload.picture,
    // };

    this.logger.warn(
      'Google ID token verification is not yet implemented. ' +
        'Using placeholder that rejects all tokens.',
    );

    throw new Error(
      'Google Sign-In verification not yet implemented. ' +
        'See google.strategy.ts for integration instructions.',
    );
  }
}
