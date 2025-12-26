export const theme = {
    colors: {
        primary: '#FF3B30', // Vibrant Red for "Rev"
        secondary: '#5856D6', // Deep Purple/Blue for "Sync"
        background: '#000000', // True Black for OLED
        surface: '#1C1C1E', // Dark Gray for cards
        surfaceHighlight: '#2C2C2E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#38383A',
        success: '#30D158',
        error: '#FF453A',
        warning: '#FFD60A',
        info: '#64D2FF',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
        round: 9999,
    },
    typography: {
        h1: {
            fontSize: 34,
            fontWeight: '700',
            lineHeight: 41,
            letterSpacing: 0.37,
        },
        h2: {
            fontSize: 28,
            fontWeight: '700',
            lineHeight: 34,
            letterSpacing: 0.36,
        },
        h3: {
            fontSize: 22,
            fontWeight: '600',
            lineHeight: 28,
            letterSpacing: 0.35,
        },
        body: {
            fontSize: 17,
            fontWeight: '400',
            lineHeight: 22,
            letterSpacing: -0.41,
        },
        caption: {
            fontSize: 13,
            fontWeight: '400',
            lineHeight: 18,
            letterSpacing: -0.08,
        },
        button: {
            fontSize: 17,
            fontWeight: '600',
            lineHeight: 22,
            letterSpacing: -0.41,
        },
    },
    shadows: {
        default: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        glow: {
            shadowColor: '#FF3B30',
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 10,
        },
    },
} as const;

export type Theme = typeof theme;
