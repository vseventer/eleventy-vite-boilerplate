// Package modules.
const tailwindTypographyPlugin = require('@tailwindcss/typography');

// Exports.
module.exports = {
  content: [
    'eleventy.config.js',
    './src/**/*.{html,js,jsx,md,njk}',
  ],
  plugins: [tailwindTypographyPlugin],
};
