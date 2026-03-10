export const Colors = {
    // Semantic design language
    shell: '#0A0E14',
    shellAlt: '#0D121A',
    surface1: '#121925',
    surface2: '#18202D',
    surface3: '#1E2735',
    elevated: '#243042',
    strokeSoft: 'rgba(143,168,197,0.14)',
    strokeStrong: 'rgba(143,168,197,0.24)',
    textPrimary: '#F4F7FB',
    textSecondary: '#ABB5C5',
    textTertiary: '#6F7F93',
    accent: '#63C7FF',

    // Brand
    primary: '#EA103C',
    primaryVariant: '#BE123C',
    accentSoft: 'rgba(99,199,255,0.14)',

    // Surfaces
    background: '#0A0E14',
    surface: '#121925',
    surfaceHighlight: '#18202D',
    surfaceMuted: '#0F141D',

    // Text
    text: '#F4F7FB',

    // Functional
    success: '#2ED39A',
    warning: '#FFB85C',
    error: '#FF6B79',
    info: '#63C7FF',

    // UI utilities
    border: 'rgba(143,168,197,0.14)',
    divider: 'rgba(143,168,197,0.08)',
    overlay: 'rgba(7,12,18,0.76)',
    backdrop: 'rgba(0,0,0,0.7)',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    hero: 48,
    max: 64,
};

export const Typography = {
    display: { fontSize: 34, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.8 },
    h1: { fontSize: 30, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.6 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const, color: Colors.text },
    headline: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
    body: { fontSize: 16, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
    dataLabel: { fontSize: 11, fontWeight: '700' as const, color: Colors.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' as const },
    small: { fontSize: 12, fontWeight: '500' as const, color: Colors.textTertiary },
    monospace: { fontFamily: 'Courier', fontWeight: '500' as const, color: Colors.textSecondary },
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
        radiusSm: 10,
        radiusMd: 14,
        radiusLg: 18,
        radiusXl: 24,
        buttonRadius: 14,
        cardRadius: 18,
    },
    Motion: {
        fast: 100,
        ui: 160,
        panel: 220,
        hero: 320,
    },
};
