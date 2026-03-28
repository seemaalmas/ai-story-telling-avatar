import { create } from 'zustand';
import { api } from '@/services/api';

type PlanId = 'free' | 'premium_monthly' | 'premium_yearly' | 'family';
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'paused';
type Feature = string;

interface Entitlements {
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

interface SubscriptionState {
  entitlements: Entitlements;
  isLoading: boolean;
  error: string | null;

  fetchEntitlements: () => Promise<void>;
  purchase: (platform: string, receipt: string, productId: string) => Promise<boolean>;
  restore: (platform: string, receipts: Array<{ receipt: string; productId: string }>) => Promise<boolean>;
  cancel: (subscriptionId: string) => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isPremium: () => boolean;
}

const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  status: 'active',
  features: ['stories_basic', 'voice_default', 'languages_basic', 'templates_basic'],
  storiesPerDay: 3,
  languageCount: 3,
  customVoice: false,
  familySharing: false,
  adsFree: false,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  entitlements: FREE_ENTITLEMENTS,
  isLoading: false,
  error: null,

  fetchEntitlements: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/api/v1/subscription/entitlements');
      set({ entitlements: data, isLoading: false });
    } catch {
      set({ isLoading: false });
      // Keep current entitlements on error (offline-safe)
    }
  },

  purchase: async (platform, receipt, productId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/v1/subscription/purchase', {
        platform,
        receipt,
        productId,
      });
      set({ entitlements: data.entitlements, isLoading: false });
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Purchase failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  restore: async (platform, receipts) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/v1/subscription/restore', {
        platform,
        receipts,
      });
      set({ entitlements: data.entitlements, isLoading: false });
      return true;
    } catch {
      set({ error: 'Restore failed', isLoading: false });
      return false;
    }
  },

  cancel: async (subscriptionId) => {
    try {
      await api.post('/api/v1/subscription/cancel', { subscriptionId });
      await get().fetchEntitlements();
    } catch {
      set({ error: 'Cancellation failed' });
    }
  },

  hasFeature: (feature) => {
    return get().entitlements.features.includes(feature);
  },

  isPremium: () => {
    return get().entitlements.plan !== 'free';
  },
}));
