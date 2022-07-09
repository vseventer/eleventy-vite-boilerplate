// @see https://github.com/postcss/postcss-loader#configuration

// Package modules.
const atImport = require('postcss-import');
const reporter = require('postcss-reporter');
const url = require('postcss-url');
const stylelint = require('stylelint');
const tailwind = require('tailwindcss');
const tailwindNesting = require('@tailwindcss/nesting');

// Exports.
module.exports = ({ cwd }) => {
  // Build list of plugins.
  const plugins = [
    stylelint(),

    atImport({
      plugins: [
        // https://stylelint.io/user-guide/usage/postcss-plugin
        stylelint(),

        // Rebase asset URLs to work after inlining imported file.
        // https://github.com/postcss/postcss-import/blob/master/README.md
        url({ assetsPath: cwd }),
      ],
    }),

    // https://tailwindcss.com/docs/using-with-preprocessors#nesting
    tailwindNesting(),
    tailwind(),

    reporter({ clearReportedMessages: true }),
  ];

  // Return configuration.
  return { plugins };
};
