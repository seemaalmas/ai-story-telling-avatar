// ─── Subscription & Entitlement Types ───────────────────────

export type PlanId = 'free' | 'premium_monthly' | 'premium_yearly' | 'family';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'paused';

export type StorePlatform = 'app_store' | 'play_store' | 'web' | 'manual';

export type EntitlementAuditAction =
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_paused'
  | 'subscription_resumed'
  | 'receipt_validated'
  | 'receipt_validation_failed'
  | 'entitlement_granted'
  | 'entitlement_revoked'
  | 'restore_completed'
  | 'family_member_added'
  | 'family_member_removed';

// ─── Plan Definition ────────────────────────────────────────

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  priceInr: number;
  /** Billing interval in months (0 = free) */
  intervalMonths: number;
  features: Feature[];
  /** Max family members (only for family plan) */
  maxFamilyMembers?: number;
  /** Store product IDs */
  appStoreProductId?: string;
  playStoreProductId?: string;
}

// ─── Features & Entitlements ────────────────────────────────

export type Feature =
  | 'stories_unlimited'
  | 'stories_basic'
  | 'voice_custom'
  | 'voice_default'
  | 'languages_all'
  | 'languages_basic'
  | 'templates_premium'
  | 'templates_basic'
  | 'family_sharing'
  | 'ads_free'
  | 'offline_stories';

export interface Entitlements {
  plan: PlanId;
  status: SubscriptionStatus;
  features: Feature[];
  storiesPerDay: number;
  languageCount: number;
  customVoice: boolean;
  familySharing: boolean;
  adsFree: boolean;
  expiresAt?: string;
}

// ─── Subscription Record ────────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  platform: StorePlatform;
  storeProductId?: string;
  storeTransactionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
}

// ─── Receipt Validation ─────────────────────────────────────

export interface ReceiptValidationRequest {
  platform: StorePlatform;
  receipt: string;
  productId: string;
  /** Apple: original_transaction_id, Google: purchase token */
  transactionId?: string;
}

export interface ReceiptValidationResult {
  valid: boolean;
  productId: string;
  transactionId: string;
  platform: StorePlatform;
  expiresAt?: string;
  /** Whether this is a renewal vs new purchase */
  isRenewal: boolean;
  /** Raw response from the store for audit logging */
  rawResponse?: Record<string, unknown>;
  error?: string;
}

// ─── API Shapes ─────────────────────────────────────────────

export interface PurchaseRequest {
  platform: StorePlatform;
  receipt: string;
  productId: string;
  transactionId?: string;
}

export interface RestorePurchasesRequest {
  platform: StorePlatform;
  receipts: Array<{
    receipt: string;
    productId: string;
    transactionId?: string;
  }>;
}
