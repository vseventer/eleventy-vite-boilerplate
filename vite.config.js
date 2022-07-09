// Standard lib.
import {
  dirname,
  join as joinPath,
  relative as relativePath,
} from 'path';

// Package modules.
import eslint from 'vite-plugin-eslint';
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
    imagemin({
      gifsicle: { optimizationLevel: 3 }, // https://github.com/imagemin/imagemin-gifsicle
      jpegTran: false,
      mozjpeg: { quality: 75 }, // https://github.com/imagemin/imagemin-mozjpeg
      optipng: { optimizationLevel: 7 }, // https://github.com/imagemin/imagemin-optipng
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
      webp: { quality: 75 }, // https://github.com/imagemin/imagemin-webp
      disable: !IS_PRODUCTION,
    }),
  ],
};
