// Standard lib.
import {
  dirname,
  join as joinPath,
  relative as relativePath,
} from 'path';

// Package modules.
import eslint from 'vite-plugin-eslint';
import htmlMinimize from '@sergeymakinen/vite-plugin-html-minimize';
import imagemin from 'vite-plugin-imagemin';

// Constants.
const INTERMEDIATE_DIR = joinPath(__dirname, '.eleventy-temp-build');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Exports.
export default {
  build: {
    rollupOptions: {
      output: {
        // https://github.com/vitejs/vite/discussions/3278
        // https://rollupjs.org/guide/en/#outputassetfilenames
        assetFileNames: ({ name }) => {
          // Preserve directory tree for intermediate files, fallback to assets/.
          const path = relativePath(INTERMEDIATE_DIR, dirname(name));
          const outputDir = path.startsWith('..') ? 'assets' : path;
          return joinPath(outputDir, '[name].[hash][extname]');
        },
      },
    },
  },
  plugins: [
    eslint({ failOnError: IS_PRODUCTION }),
    htmlMinimize({
      // https://github.com/terser/html-minifier-terser#options-quick-reference
      minifierOptions: {
        collapseWhitespace: true,
        html5: true,
        keepClosingSlash: true,
        minifyCSS: true,
        minifyJS: true,
        preserveLineBreaks: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),

    imagemin({
      // Global options.
      disable: !IS_PRODUCTION,

      // AVIF minification uses the same pipeline as eleventy-img so no need to apply here.
      filter: /\.(gif|jpe?g|png|svg)$/i,

      // Plugin options.
      gifsicle: { optimizationLevel: 3 }, // https://github.com/imagemin/imagemin-gifsicle
      jpegTran: false,
      mozjpeg: { quality: 75 }, // https://github.com/imagemin/imagemin-mozjpeg
      optipng: false,
      pngquant: { // https://github.com/imagemin/imagemin-pngquant
        quality: [0.7, 0.8],
        speed: 1,
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
      webp: false, // See plugin below.
    }),

    // Add separate pipeline for WebP as plugin is too eager and will convert JPEG to WebP also.
    imagemin({
      // Global options.
      disable: !IS_PRODUCTION,
      filter: /\.webp$/i,
      webp: true, // https://github.com/imagemin/imagemin-webp
    }),
  ],
};
