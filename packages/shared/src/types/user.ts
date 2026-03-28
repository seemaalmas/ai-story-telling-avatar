export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'APPLE';
export type ConsentType =
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY'
  | 'MARKETING_EMAIL'
  | 'DATA_PROCESSING'
  | 'ANALYTICS'
  | 'PUSH_NOTIFICATIONS';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  authProvider: AuthProvider;
  preferredLanguage: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage: string;
  role: UserRole;
  authProvider: AuthProvider;
  emailVerified: boolean;
  lastLoginAt?: string;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceOS?: string;
  deviceOSVersion?: string;
  appVersion?: string;
  ipAddress?: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface UserPreference {
  key: string;
  value: string;
}

export interface Consent {
  id: string;
  type: ConsentType;
  granted: boolean;
  version: string;
  grantedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceOS?: string;
  deviceOSVersion?: string;
  appVersion?: string;
}
