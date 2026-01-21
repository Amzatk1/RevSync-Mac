export const Colors = {
    // Brand Colors
    primary: '#E11D48', // Keeping Brand Red but richer
    primaryVariant: '#BE123C',
    accent: '#00E5FF', // Neon Cyan for high-tech accents

    // Backgrounds
    background: '#09090B', // Zinc-950 (Deep, rich black)
    surface: '#18181B', // Zinc-900
    surfaceHighlight: '#27272A', // Zinc-800

    // Text
    text: '#FAFAFA', // Zinc-50
    textSecondary: '#A1A1AA', // Zinc-400
    textTertiary: '#52525B', // Zinc-600

    // Functional
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
    info: '#3B82F6', // Blue-500

    // UI Utilities
    border: '#27272A', // Zinc-800
    divider: '#27272A',
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
        borderRadius: 16,
        buttonRadius: 12,
        cardRadius: 16,
    },
};
