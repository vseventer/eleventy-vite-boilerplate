// Package modules.
const tailwindTypographyPlugin = require('@tailwindcss/typography');

// Exports.
module.exports = {
  content: ['./src/**/*.{html,js,jsx,njk}'],
  plugins: [tailwindTypographyPlugin],
};
