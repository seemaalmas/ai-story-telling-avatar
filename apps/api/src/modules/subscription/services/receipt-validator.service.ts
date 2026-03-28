import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ReceiptValidationResult, StorePlatform } from '@katha/shared';

/**
 * Store-specific receipt validator interface.
 * Implement for each app store.
 */
export interface StoreReceiptValidator {
  readonly platform: StorePlatform;
  validate(receipt: string, productId: string): Promise<ReceiptValidationResult>;
}

// ─── Mock Validator (development) ───────────────────────────

class MockReceiptValidator implements StoreReceiptValidator {
  readonly platform: StorePlatform = 'manual';

  async validate(receipt: string, productId: string): Promise<ReceiptValidationResult> {
    // In development, accept any receipt that starts with "mock_"
    if (!receipt.startsWith('mock_')) {
      return {
        valid: false,
        productId,
        transactionId: '',
        platform: this.platform,
        isRenewal: false,
        error: 'Invalid mock receipt (must start with "mock_")',
      };
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return {
      valid: true,
      productId,
      transactionId: `mock_txn_${Date.now()}`,
      platform: this.platform,
      expiresAt: expiresAt.toISOString(),
      isRenewal: receipt.includes('renewal'),
    };
  }
}

// ─── Apple App Store Validator (placeholder) ────────────────

class AppStoreReceiptValidator implements StoreReceiptValidator {
  readonly platform: StorePlatform = 'app_store';

  constructor(private readonly sharedSecret: string) {}

  async validate(receipt: string, productId: string): Promise<ReceiptValidationResult> {
    // TODO: Implement real App Store Server API v2 validation
    //
    // 1. Call https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
    //    (or use the v2 App Store Server Notifications for server-to-server updates)
    //
    // 2. Verify the signed JWS transaction
    //    - Decode the JWT header to get the x5c certificate chain
    //    - Validate the certificate chain against Apple's root CA
    //    - Verify the JWT signature
    //
    // 3. Extract: productId, expiresDate, originalTransactionId
    //
    // 4. For subscription renewals, check the signed renewal info
    //
    // Libraries: app-store-server-library (npm)
    //
    // import { AppStoreServerAPIClient, Environment } from '@apple/app-store-server-library';
    // const client = new AppStoreServerAPIClient(key, keyId, issuerId, bundleId, Environment.PRODUCTION);
    // const transactions = await client.getTransactionHistory(originalTransactionId, ...);

    void this.sharedSecret;

    return {
      valid: false,
      productId,
      transactionId: '',
      platform: this.platform,
      isRenewal: false,
      error: 'App Store receipt validation not yet implemented. See receipt-validator.service.ts for integration guide.',
    };
  }
}

// ─── Google Play Store Validator (placeholder) ──────────────

class PlayStoreReceiptValidator implements StoreReceiptValidator {
  readonly platform: StorePlatform = 'play_store';

  constructor(private readonly serviceAccountKey: string) {}

  async validate(receipt: string, productId: string): Promise<ReceiptValidationResult> {
    // TODO: Implement real Google Play Developer API validation
    //
    // 1. Authenticate with service account:
    //    const auth = new google.auth.GoogleAuth({
    //      credentials: JSON.parse(this.serviceAccountKey),
    //      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    //    });
    //
    // 2. Call subscriptions.get:
    //    const play = google.androidpublisher({ version: 'v3', auth });
    //    const result = await play.purchases.subscriptions.get({
    //      packageName: 'com.katha.ai',
    //      subscriptionId: productId,
    //      token: receipt, // purchaseToken
    //    });
    //
    // 3. Check result.data:
    //    - paymentState: 1 = received
    //    - expiryTimeMillis
    //    - autoRenewing
    //    - cancelReason (if cancelled)
    //
    // 4. For real-time developer notifications, set up a Pub/Sub webhook
    //
    // Libraries: googleapis (npm)

    void this.serviceAccountKey;

    return {
      valid: false,
      productId,
      transactionId: '',
      platform: this.platform,
      isRenewal: false,
      error: 'Play Store receipt validation not yet implemented. See receipt-validator.service.ts for integration guide.',
    };
  }
}

// ─── Composite Validator Service ────────────────────────────

@Injectable()
export class ReceiptValidatorService {
  private readonly logger = new Logger(ReceiptValidatorService.name);
  private validators: Map<StorePlatform, StoreReceiptValidator>;

  constructor(private readonly config: ConfigService) {
    this.validators = new Map();

    // Always register mock for development
    this.validators.set('manual', new MockReceiptValidator());
    this.validators.set('web', new MockReceiptValidator());

    // Register real store validators when configured
    const appleSecret = this.config.get<string>('subscription.appleSharedSecret');
    if (appleSecret) {
      this.validators.set('app_store', new AppStoreReceiptValidator(appleSecret));
      this.logger.log('App Store receipt validator registered');
    } else {
      // Fallback to mock for development
      this.validators.set('app_store', new MockReceiptValidator());
      this.logger.warn('App Store validator using mock (APPLE_SHARED_SECRET not set)');
    }

    const googleKey = this.config.get<string>('subscription.googleServiceAccountKey');
    if (googleKey) {
      this.validators.set('play_store', new PlayStoreReceiptValidator(googleKey));
      this.logger.log('Play Store receipt validator registered');
    } else {
      this.validators.set('play_store', new MockReceiptValidator());
      this.logger.warn('Play Store validator using mock (GOOGLE_SERVICE_ACCOUNT_KEY not set)');
    }
  }

  async validate(
    platform: StorePlatform,
    receipt: string,
    productId: string,
  ): Promise<ReceiptValidationResult> {
    const validator = this.validators.get(platform);
    if (!validator) {
      return {
        valid: false,
        productId,
        transactionId: '',
        platform,
        isRenewal: false,
        error: `No validator registered for platform: ${platform}`,
      };
    }

    try {
      const result = await validator.validate(receipt, productId);
      this.logger.log(
        `Receipt validation for ${platform}/${productId}: valid=${result.valid}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Receipt validation failed: ${err}`);
      return {
        valid: false,
        productId,
        transactionId: '',
        platform,
        isRenewal: false,
        error: `Validation error: ${err instanceof Error ? err.message : 'unknown'}`,
      };
    }
  }
}
