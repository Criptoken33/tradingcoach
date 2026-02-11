/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // MD3 Surface Colors
                'md-surface': 'rgb(var(--md-sys-color-surface))',
                'md-surface-container': 'rgb(var(--md-sys-color-surface-container))',
                'md-surface-container-low': 'rgb(var(--md-sys-color-surface-container-low))',
                'md-surface-container-high': 'rgb(var(--md-sys-color-surface-container-high))',
                'md-surface-container-highest': 'rgb(var(--md-sys-color-surface-container-highest))',

                // MD3 Primary Colors
                'md-primary': 'rgb(var(--md-sys-color-primary))',
                'md-on-primary': 'rgb(var(--md-sys-color-on-primary))',
                'md-primary-container': 'rgb(var(--md-sys-color-primary-container))',
                'md-on-primary-container': 'rgb(var(--md-sys-color-on-primary-container))',

                // MD3 Secondary Colors
                'md-secondary': 'rgb(var(--md-sys-color-secondary))',
                'md-on-secondary': 'rgb(var(--md-sys-color-on-secondary))',
                'md-secondary-container': 'rgb(var(--md-sys-color-secondary-container))',

                // MD3 Text Colors
                'md-on-surface': 'rgb(var(--md-sys-color-on-surface))',
                'md-on-surface-variant': 'rgb(var(--md-sys-color-on-surface-variant))',

                // MD3 Error Colors
                'md-error': 'rgb(var(--md-sys-color-error))',
                'md-on-error': 'rgb(var(--md-sys-color-on-error))',
                'md-error-container': 'rgb(var(--md-sys-color-error-container))',

                // MD3 Success Colors (Custom)
                'md-success': 'rgb(var(--md-sys-color-success))',
                'md-on-success': 'rgb(var(--md-sys-color-on-success))',
                'md-success-container': 'rgb(var(--md-sys-color-success-container))',

                // MD3 Warning Colors (Custom)
                'md-warning': 'rgb(var(--md-sys-color-warning))',
                'md-warning-high': 'rgb(var(--md-sys-color-warning-high))',
                'md-on-warning': 'rgb(var(--md-sys-color-on-warning))',

                // MD3 Outline
                'md-outline': 'rgb(var(--md-sys-color-outline))',
                'md-outline-variant': 'rgb(var(--md-sys-color-outline-variant))',

                // Legacy aliases for backward compatibility
                'brand-dark': 'rgb(var(--md-sys-color-surface))',
                'brand-light': 'rgb(var(--md-sys-color-surface-container-low))',
                'brand-tertiary': 'rgb(var(--md-sys-color-surface-container-high))',
                'brand-accent': 'rgb(var(--md-sys-color-primary))',
                'brand-accent-container': 'rgb(var(--md-sys-color-primary-container))',
                'brand-text': 'rgb(var(--md-sys-color-on-surface))',
                'brand-text-secondary': 'rgb(var(--md-sys-color-on-surface-variant))',
                'brand-success': 'rgb(var(--md-sys-color-success))',
                'brand-danger': 'rgb(var(--md-sys-color-error))',
                'brand-warning-medium': 'rgb(var(--md-sys-color-warning))',
                'brand-warning-high': 'rgb(var(--md-sys-color-warning-high))',
                'brand-border': 'rgb(var(--md-sys-color-outline))',
                'brand-border-secondary': 'rgb(var(--md-sys-color-outline-variant))',

                // Premium / Gold Colors
                'brand-gold': '#FFD700',
                'brand-gold-light': '#FDB931',
                'brand-gold-dark': '#D4AF37',
            },
            boxShadow: {
                'md-elevation-0': 'var(--md-sys-elevation-0)',
                'md-elevation-1': 'var(--md-sys-elevation-1)',
                'md-elevation-2': 'var(--md-sys-elevation-2)',
                'md-elevation-3': 'var(--md-sys-elevation-3)',
                'md-elevation-4': 'var(--md-sys-elevation-4)',
                'md-elevation-5': 'var(--md-sys-elevation-5)',
            },
            borderRadius: {
                'md-none': 'var(--md-sys-shape-corner-none)',
                'md-xs': 'var(--md-sys-shape-corner-extra-small)',
                'md-sm': 'var(--md-sys-shape-corner-small)',
                'md-md': 'var(--md-sys-shape-corner-medium)',
                'md-lg': 'var(--md-sys-shape-corner-large)',
                'md-xl': 'var(--md-sys-shape-corner-extra-large)',
                'md-full': 'var(--md-sys-shape-corner-full)',
                // Legacy
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            spacing: {
                'md-0': 'var(--md-sys-spacing-0)',
                'md-1': 'var(--md-sys-spacing-1)',
                'md-2': 'var(--md-sys-spacing-2)',
                'md-3': 'var(--md-sys-spacing-3)',
                'md-4': 'var(--md-sys-spacing-4)',
                'md-5': 'var(--md-sys-spacing-5)',
                'md-6': 'var(--md-sys-spacing-6)',
                'md-8': 'var(--md-sys-spacing-8)',
                'md-12': 'var(--md-sys-spacing-12)',
            },
            transitionDuration: {
                'md-short1': 'var(--md-sys-motion-duration-short1)',
                'md-short2': 'var(--md-sys-motion-duration-short2)',
                'md-short3': 'var(--md-sys-motion-duration-short3)',
                'md-short4': 'var(--md-sys-motion-duration-short4)',
                'md-medium1': 'var(--md-sys-motion-duration-medium1)',
                'md-medium2': 'var(--md-sys-motion-duration-medium2)',
                'md-medium3': 'var(--md-sys-motion-duration-medium3)',
                'md-medium4': 'var(--md-sys-motion-duration-medium4)',
            },
            transitionTimingFunction: {
                'md-standard': 'var(--md-sys-motion-easing-standard)',
                'md-emphasized': 'var(--md-sys-motion-easing-emphasized)',
                'md-decelerate': 'var(--md-sys-motion-easing-standard-decelerate)',
                'md-accelerate': 'var(--md-sys-motion-easing-standard-accelerate)',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-out-down': {
                    'from': { opacity: '1', transform: 'translateY(0)' },
                    'to': { opacity: '0', transform: 'translateY(20px)' },
                }
            },
            animation: {
                'fade-in-up': 'fade-in-up var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized) forwards',
                'fade-in': 'fade-in var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized) forwards',
                'fade-out-down': 'fade-out-down var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized) forwards',
            },
            screens: {
                'md-compact': '0px',
                'md-medium': '600px',
                'md-expanded': '840px',
                'md-large': '1240px',
                'md-xl': '1600px',
            }
        }
    },
    plugins: [],
}
