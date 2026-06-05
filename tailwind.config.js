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
        },
    },

    plugins: [forms],
};
