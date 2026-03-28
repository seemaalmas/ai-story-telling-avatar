export const theme = {
  colors: {
    primary: '#FF6B35',
    primaryLight: '#FF8F65',
    primaryDark: '#E55A25',
    secondary: '#4A90D9',
    accent: '#F7C948',

    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',

    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',

    border: '#E5E7EB',
    divider: '#F3F4F6',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '700' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  },
} as const;

export type Theme = typeof theme;
