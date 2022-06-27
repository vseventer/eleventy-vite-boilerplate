// @see https://github.com/postcss/postcss-loader#configuration

// Package modules.
const atImport = require('postcss-import');
const presetEnv = require('postcss-preset-env');
const reporter = require('postcss-reporter');
const url = require('postcss-url');
const stylelint = require('stylelint');
const tailwind = require('tailwindcss');

// Exports.
module.exports = ({ cwd }) => {
  // Build list of plugins.
  const plugins = [
    stylelint(),

    atImport({
      plugins: [
        // @see https://stylelint.io/user-guide/usage/postcss-plugin
        stylelint(),

        // Rebase asset URLs to work after inlining imported file.
        // @see https://github.com/postcss/postcss-import/blob/master/README.md
        url({ assetsPath: cwd }),
      ],
    }),

    // Resolve nested rules before Tailwind.
    // @see https://github.com/tailwindlabs/tailwindcss/issues/2192
    presetEnv({
      // Use stage 3 features + CSS nesting rules.
      features: {
        'custom-properties': { preserve: true },
        'nesting-rules': true,
      },
      preserve: process.env.NODE_ENV === 'development',
      stage: 3,
    }),
    tailwind(),

    reporter({ clearReportedMessages: true }),
  ];

  // Return configuration.
  return { plugins };
};
