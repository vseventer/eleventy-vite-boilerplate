// Package modules.
import eslint from 'vite-plugin-eslint';

// Exports.
export default {
  plugins: [
    eslint({ failOnError: process.env.NODE_ENV === 'production' }),
  ],
};
