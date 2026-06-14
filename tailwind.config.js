import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    theme: {
        extend: {
            aspectRatio: {
                product: '3 / 2',
            },
            colors: {
                joordak: {
                    DEFAULT: '#a9bac9',
                    dark: '#8fa3b5',
                    accent: '#c95742',
                    foreground: '#c95742',
                    border: '#c5d0db',
                    soft: '#eef2f6',
                    gradient: '#dce4ec',
                    coral: '#c95742',
                    'coral-dark': '#a84735',
                },
            },
            fontFamily: {
                sans: ['Iranian Sans', 'Tahoma', 'Arial', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'cart-quantity-up': {
                    '0%': { opacity: '0', transform: 'translateY(80%) scale(0.6)' },
                    '60%': { opacity: '1', transform: 'translateY(-15%) scale(1.12)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                'cart-quantity-down': {
                    '0%': { opacity: '0', transform: 'translateY(-80%) scale(0.6)' },
                    '60%': { opacity: '1', transform: 'translateY(15%) scale(1.12)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                'cart-quantity-pop': {
                    '0%': { opacity: '0.4', transform: 'scale(0.75)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'cart-quantity-up': 'cart-quantity-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'cart-quantity-down': 'cart-quantity-down 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'cart-quantity-pop': 'cart-quantity-pop 0.2s ease-out',
            },
        },
    },

    plugins: [forms],
};
