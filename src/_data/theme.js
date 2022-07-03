// Package modules.
const resolveConfig = require('tailwindcss/resolveConfig');

// Local modules.
const fullConfig = require('../../tailwind.config');

// Exports.
module.exports = resolveConfig(fullConfig).theme;
