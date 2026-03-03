import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ea103c',
                'primary-dark': '#b00c2d',
                'primary-light': '#ff4d6d',
                'primary-glow': 'rgba(234, 16, 60, 0.15)',
                accent: '#ff6b35',
                'accent-cyan': '#06d6a0',
                'accent-blue': '#3a86ff',
                'background-light': '#f8f6f6',
                'background-dark': '#0a0a0b',
                'surface-dark': '#111113',
                'surface-card': '#18181b',
                'surface-elevated': '#1e1e22',
                'surface-border': '#27272a',
                'surface-highlight': '#3f3f46',
                'text-muted': '#a1a1aa',
                'text-body': '#d4d4d8',
            },
            fontFamily: {
                display: ['Outfit', 'Space Grotesk', 'sans-serif'],
                body: ['Space Grotesk', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '0.5rem',
                lg: '0.75rem',
                xl: '1rem',
                '2xl': '1.25rem',
                '3xl': '1.5rem',
                full: '9999px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-up': 'fadeUp 0.6s ease-out',
                'slide-in-right': 'slideInRight 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'gradient-shift': 'gradientShift 8s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(234, 16, 60, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(234, 16, 60, 0.6)' },
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
            },
            boxShadow: {
                'glow-sm': '0 0 15px rgba(234, 16, 60, 0.3)',
                'glow': '0 0 25px rgba(234, 16, 60, 0.4)',
                'glow-lg': '0 0 40px rgba(234, 16, 60, 0.5)',
                'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                'card-hover': '0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(234, 16, 60, 0.1)',
                'elevated': '0 4px 20px rgba(0,0,0,0.5)',
            },
        },
    },
    plugins: [],
};

export default config;
