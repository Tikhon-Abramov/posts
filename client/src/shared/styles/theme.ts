export const theme = {
  colors: {
    bg: '#080A12',
    bgSoft: '#101322',
    bgCard: '#15192B',
    bgElevated: '#1B2036',

    text: '#F5F7FB',
    textMuted: '#9CA3B7',

    primary: '#7C3AED',
    primaryHover: '#8B5CF6',

    blue: '#2563EB',
    red: '#EF4444',
    pink: '#EC4899',

    border: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.35)',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },

  radius: {
    sm: '8px',
    md: '14px',
    lg: '22px',
    full: '999px',
  },

  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};

export type AppTheme = typeof theme;
