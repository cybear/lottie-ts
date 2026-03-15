/**
 * rollup.custom.config.mjs
 *
 * Rollup config for custom / tree-shaken animation builds.
 * Invoked by tools/build-custom.cjs via the Rollup CLI:
 *
 *   rollup --config rollup.custom.config.mjs
 *
 * Build parameters come in via environment variables set by build-custom.cjs:
 *   LOTTIE_CUSTOM_ENTRY     - absolute path to generated .ts entry file
 *   LOTTIE_CUSTOM_OUTPUT    - absolute path for output .js bundle
 *   LOTTIE_CUSTOM_MINIFY    - "true" | "false"
 *   LOTTIE_CUSTOM_SOURCEMAP - "true" | "false"
 *
 * Key difference from rollup.config.js:
 *   treeshake: true  ← enables dead-code elimination for unused features
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'node:module';

const { version } = createRequire(import.meta.url)('./package.json');

// ─── Inline plugins (replicated from rollup.config.js) ───────────────────────

const injectVersion = () => ({
  name: 'inject-version',
  renderChunk: (code) => code.replace('[[BM_VERSION]]', version),
});

const addNavigatorValidation = () => ({
  name: 'add-navigator-validation',
  renderChunk: (code) => '(typeof navigator !== "undefined") && ' + code,
});

const addDocumentValidation = () => ({
  name: 'add-document-validation',
  renderChunk: (code) => '(typeof document !== "undefined") && ' + code,
});

// ─── Read build parameters from environment ───────────────────────────────────

const input     = process.env.LOTTIE_CUSTOM_ENTRY    || 'src/modules/_custom_entry.ts';
const output    = process.env.LOTTIE_CUSTOM_OUTPUT   || 'build/player/lottie.custom.js';
const minify    = (process.env.LOTTIE_CUSTOM_MINIFY    ?? 'true') === 'true';
const sourcemap = (process.env.LOTTIE_CUSTOM_SOURCEMAP ?? 'false') === 'true';

// ─── Plugin stack ─────────────────────────────────────────────────────────────

const plugins = [
  commonjs(),
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.json',
    include: ['src/**/*.{js,ts}', '**/*.ts'],
    declaration: false,
    sourceMap: sourcemap,
    outDir: '.',
    importHelpers: true,
  }),
  injectVersion(),
  addNavigatorValidation(),
  addDocumentValidation(),
];

if (minify) {
  plugins.push(
    terser({
      module: false,
      compress: { passes: 3, pure_getters: true },
      mangle: { toplevel: false },
    }),
  );
}

// ─── Config export ────────────────────────────────────────────────────────────

export default {
  input,
  treeshake: true,
  output: {
    file: output,
    format: 'umd',
    name: 'lottie',
    exports: 'default',
    sourcemap,
  },
  plugins,
};
