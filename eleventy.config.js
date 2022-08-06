// Allow function expressions as arrow functions do not have access to `this`.
// https://www.11ty.dev/docs/languages/javascript/#warning-about-arrow-functions
/* eslint-disable prefer-arrow-callback */

// Standard lib.
const { readFileSync } = require('fs');
const path = require('path');

// Package modules.
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const { AssetCache } = require('@11ty/eleventy-fetch');
const Image = require('@11ty/eleventy-img');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const lodashGet = require('lodash.get');
const sharp = require('sharp');
const slinkity = require('slinkity');
const react = require('@slinkity/renderer-react');

// Helpers.
function filenameFormat(id, src, width, format) {
  const name = path.basename(src, path.extname(src));
  return `${name}-${width}w.${format}`;
}

function generatePlaceholder(uri, children, { caption, classes = '' }) {
  const innerClasses = 'block bg-center bg-cover bg-no-repeat';

  // Return HTML without leading whitespace.
  // (https://www.11ty.dev/docs/languages/markdown/#there-are-extra-and-in-my-output)
  return `
<figure class="${classes}">
  ${children.replace(
    '<picture',
    `<picture class="${innerClasses}" style="background-image: url(${uri})"`,
  )}
  ${caption ? `<figcaption>${caption}</figcaption>` : ''}
</figure>
`;
}

/**
 * The image shortcode is synchronous and relies on running stats synchronously. However, for large
 * images this takes a long time, so cache the stat results for faster retrieval.
 *
 * https://www.11ty.dev/docs/plugins/fetch/#manually-store-your-own-data-in-the-cache
 */
function getCachedImageStats(src, options) {
  const asset = new AssetCache(`images.${JSON.stringify([src, options])}`);
  if (asset.isCacheValid('1w')) {
    // HACK: Read file synchronously since asset.getCachedValue() returns a promise.
    const contents = readFileSync(asset.getCachedContentsPath('json'));
    return JSON.parse(contents);
  }

  // Add two-pass support for HEIC (https://github.com/image-size/image-size/issues/125).
  const extname = path.extname(src).toLowerCase();
  if (extname === '.heic') {
    const result = Image.statsByDimensionsSync(src, 4032, 3024, options);
    console.warn('%s: Estimated HEIF image dimensions - re-run for accurate results', src);
    sharp(src).metadata().then(({ width, height }) => {
      const cachedResult = Image.statsByDimensionsSync(src, width, height, options);
      asset.save(cachedResult, 'json');
    });
    return result;
  }

  const result = Image.statsSync(src, options);
  asset.save(result, 'json'); // Don't await since this function needs to be synchronous.
  return result;
}

function resolve(resource, from) {
  // Join absolute resources with __dirname to avoid unsafe file access.
  const to = path.isAbsolute(resource) ? __dirname : path.dirname(from);
  return path.join(to, resource);
}

// Exports.
module.exports = (eleventyConfig) => {
  // Provide a JS slice to templates (https://github.com/mozilla/nunjucks/issues/1026).
  eleventyConfig.addFilter('arraySlice', function arraySliceFilter(value, ...args) {
    return value.slice(...args);
  });

  // Finder filters to find items by (nested) key / value.
  eleventyConfig.addFilter('find', function findFilter(collection, key, value) {
    return collection.find((entry) => lodashGet(entry, key) === value);
  });
  eleventyConfig.addFilter('findAll', function findAllFilter(list, collection, key, valueKey) {
    const find = eleventyConfig.getFilter('find');
    return list.map((entry) => {
      const value = valueKey ? entry[valueKey] : entry;
      return find(collection, key, value);
    });
  });

  // Provide date formatter
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  eleventyConfig.addFilter('dateFormat', dateFormatter.format);

  // Set default layout.
  eleventyConfig.addGlobalData('layout', 'default');

  /**
   * Add synchronous responsive image shortcode to allow for usage inside macros.
   * https://www.11ty.dev/docs/plugins/image/#synchronous-shortcode
   *
   * - Should be updated once https://github.com/slinkity/slinkity/pull/206/ lands.
   */
  eleventyConfig.addShortcode(
    'respImage',
    function responsiveImageShortcode(input, {
      caption,
      class: classes,
      context,
      sizes = '100vw',
      __keywords, // Exclude prop added by 11ty.
      ...attrs
    }) {
      const src = resolve(input, context?.inputPath ?? this.page.inputPath);

      // Ignore pagination by saving images relative to the first page URL to avoid duplicates.
      const url = context?.url ?? this.ctx.pagination?.firstPageHref ?? this.page.url;
      const options = {
        filenameFormat,
        formats: ['avif', 'jpeg'],
        outputDir: path.join('dist', url),
        urlPath: path.join('/', url),
        widths: [640, 1280, 1920],
      };
      const placeholderOptions = {
        ...options,
        formats: ['jpeg'],
        widths: [24],
      };

      // Generate images asynchronously in the background.
      Image(src, options);
      Image(src, placeholderOptions);

      // Generate HTML.
      const metadata = getCachedImageStats(src, options);
      const { jpeg: [placeholder] } = getCachedImageStats(src, placeholderOptions);

      return generatePlaceholder(
        placeholder.url, // Placeholder will be inlined by build process due to its small size.
        Image.generateHTML(
          metadata,
          {
            class: 'w-full h-full object-cover',
            decoding: 'async',
            loading: 'lazy',
            sizes,
            ...attrs,
          },
          { whitespaceMode: 'inline' }, // Strip whitespace from the output.
        ),
        { caption, classes },
      );
    },
  );

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
