export const Colors = {
    // Brand
    primary: '#EA103C',
    primaryVariant: '#BE123C',
    accent: '#00D4FF',

    // Surfaces
    background: '#0B0B11',
    surface: '#171824',
    surfaceHighlight: '#202233',
    surfaceMuted: '#12131B',

    // Text
    text: '#F8FAFC',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',

    // Functional
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // UI utilities
    border: 'rgba(255,255,255,0.12)',
    divider: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(7,8,12,0.72)',
    backdrop: 'rgba(0,0,0,0.7)',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 64,
};

export const Typography = {
    h1: { fontSize: 32, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const, color: Colors.text },
    headline: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
    body: { fontSize: 16, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
    small: { fontSize: 12, fontWeight: '500' as const, color: Colors.textTertiary },
    monospace: { fontFamily: 'Courier', fontWeight: '500' as const },
};

export const Shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    lg: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
};

export const Theme = {
    Colors,
    Spacing,
    Typography,
    Shadows,
    Layout: {
        borderRadius: 18,
        buttonRadius: 14,
        cardRadius: 18,
    },
};
