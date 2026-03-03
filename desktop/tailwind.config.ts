import type { Config } from 'tailwindcss'

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#ea103c',
                'bg-dark': '#0c0c0f',
                'panel-dark': '#18181c',
                'surface-dark': '#22181a',
                'border-dark': '#2a2a30',
                'text-muted': '#8a8a93',
                'map-low': '#3b82f6',
                'map-mid': '#22c55e',
                'map-high': '#ea103c',
                accent: {
                    green: '#0bda92',
                    orange: '#fa7c38',
                    blue: '#3b82f6',
                },
            },
            fontFamily: {
                display: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            animation: {
                'pulse-border': 'pulse-border 2s infinite',
                'fade-in': 'fade-in 0.3s ease-out',
                'fade-up': 'fade-up 0.4s ease-out',
                'slide-in': 'slide-in 0.25s ease-out',
            },
            keyframes: {
                'pulse-border': {
                    '0%': { boxShadow: '0 0 0 0 rgba(234, 16, 60, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(234, 16, 60, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(234, 16, 60, 0)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in': {
                    from: { opacity: '0', transform: 'translateY(-8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
} satisfies Config
