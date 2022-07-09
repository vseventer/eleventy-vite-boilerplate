// Standard lib.
const path = require('path');

// Package modules.
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const Image = require('@11ty/eleventy-img');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const slinkity = require('slinkity');
const react = require('@slinkity/renderer-react');

// Exports.
module.exports = (eleventyConfig) => {
  // Provide a JS slice to templates (https://github.com/mozilla/nunjucks/issues/1026).
  eleventyConfig.addFilter('arraySlice', (value, ...args) => value.slice(...args));

  // Provide date formatter
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  eleventyConfig.addFilter('dateFormat', dateFormatter.format);

  // Add image shortcode (https://www.11ty.dev/docs/plugins/image/#asynchronous-shortcode).
  // Should be updated once https://github.com/slinkity/slinkity/pull/206/ lands.
  eleventyConfig.addAsyncShortcode('image', async (src, { alt, outputDir = 'img', sizes = '100vw', ...attrs }) => {
    const metadata = await Image(src, {
      formats: [null],
      filenameFormat(id, _, width, format) {
        const name = path.basename(src, path.extname(src));
        return `${name}-${width}w.${format}`;
      },
      outputDir: path.join('dist', outputDir),
      urlPath: path.join('/', outputDir),
      widths: [null],
    });

    return Image.generateHTML(metadata, {
      alt,
      decoding: 'async',
      loading: 'lazy',
      sizes,
      ...attrs,
    });
  });

  // Add navigation plugin (https://www.11ty.dev/docs/plugins/navigation/).
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Add render plugin (https://www.11ty.dev/docs/plugins/render/).
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Add slinkity as middleware (https://slinkity.dev/).
  eleventyConfig.addPlugin(slinkity.plugin, slinkity.defineConfig({
    renderers: [react],
  }));

  /**
   * Why copy the /public directory?
   *
   * Slinkity uses Vite (https://vitejs.dev) under the hood for processing styles and JS resources
   * This tool encourages a /public directory for your static assets like social images
   * To ensure this directory is discoverable by Vite, we copy it to our 11ty build output like so:
   */
  eleventyConfig.addPassthroughCopy('public');

  // Enable excerpts (https://www.11ty.dev/docs/data-frontmatter-customize/).
  eleventyConfig.setFrontMatterParsingOptions({ excerpt: true });

  return {
    dir: {
      /**
       * Why set an input directory?
       *
       * By default, 11ty will treat the base of your project as the input.
       * This can have some nasty consequences, like accidentally copying your README.md as a route!
       * You can manually ignore certain files from the build output. But to keep things simple,
       * We recommend setting an input directory like so:
       */
      input: 'src',
      output: 'dist',

      // Separate includes from layouts.
      layouts: '_layouts',
    },

    /**
     * Why use Nunjucks?
     *
     * We recommend using Nunjucks over Liquid for nicer component shortcode syntax in your markdown
     * See our docs on passing props to components here: https://slinkity.dev/docs/component-shortcodes/#passing-props-to-shortcodes
     * Prefer liquid, or don't mind liquid's shortcode syntax? No problem!
     * Just delete this line to switch back to liquid:
     */
    markdownTemplateEngine: 'njk',
  };
};
