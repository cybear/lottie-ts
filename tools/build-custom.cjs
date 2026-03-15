#!/usr/bin/env node
/**
 * tools/build-custom.cjs
 *
 * Custom Lottie bundle builder with tree-shaking.
 *
 * Usage:
 *   node tools/build-custom.cjs \
 *     --animations demo/happy2016/data.json [demo/banner/data.json ...] \
 *     --renderer svg|canvas|html|all \
 *     --output build/player/lottie.custom.js \
 *     [--no-minify] [--sourcemap] [--no-expressions] [--no-effects]
 *
 * When --animations is supplied the feature analyser determines which shape
 * modifiers, expressions, effects etc. are needed. Without --animations the
 * entry will include all features for the chosen renderer(s).
 *
 * Output: A tree-shaken UMD bundle, fully compatible with the regular lottie.js API.
 */

'use strict';

// ─── Imports ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ─── Paths ───────────────────────────────────────────────────────────────────

const REPO_ROOT     = path.resolve(__dirname, '..');
const ENTRY_FILE    = path.join(REPO_ROOT, 'src', 'modules', '_custom_entry.ts');
const FLAGS_FILE    = path.join(REPO_ROOT, '.lottie-custom-flags.json');
const ANALYSER_PATH = path.join(__dirname, 'analyze-animation.cjs');

// ─── CLI Argument Parser ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    animations:    [],
    renderers:     ['svg'],   // default
    output:        path.join(REPO_ROOT, 'build/player/lottie.custom.js'),
    minify:        true,
    sourcemap:     false,
    expressions:   null,      // null = auto-detect from animations
    effects:       null,      // null = auto-detect
    help:          false,
  };

  let i = 0;
  while (i < args.length) {
    const a = args[i];
    switch (a) {
      case '--animations':
      case '-a':
        i++;
        while (i < args.length && !args[i].startsWith('--')) {
          opts.animations.push(path.resolve(process.cwd(), args[i++]));
        }
        break;
      case '--renderer':
      case '--renderers':
      case '-r':
        i++;
        opts.renderers = args[i++].split(',').map(s => s.trim().toLowerCase());
        break;
      case '--output':
      case '-o':
        opts.output = path.resolve(process.cwd(), args[++i]);
        i++;
        break;
      case '--no-minify':
        opts.minify = false;
        i++;
        break;
      case '--sourcemap':
        opts.sourcemap = true;
        i++;
        break;
      case '--no-expressions':
        opts.expressions = false;
        i++;
        break;
      case '--expressions':
        opts.expressions = true;
        i++;
        break;
      case '--no-effects':
        opts.effects = false;
        i++;
        break;
      case '--effects':
        opts.effects = true;
        i++;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        i++;
        break;
      default:
        console.warn(`[build-custom] Unknown argument: ${a}`);
        i++;
    }
  }

  // Expand 'all' renderer shorthand
  if (opts.renderers.includes('all')) {
    opts.renderers = ['svg', 'canvas', 'html'];
  }

  return opts;
}

// ─── Analyser Integration ────────────────────────────────────────────────────

/**
 * Run the analyser on one or more animation JSON files and return flags.
 */
function analyseAnimations(animationFiles) {
  const tmpFlags = path.join(REPO_ROOT, '.lottie-custom-flags.json');

  const result = spawnSync(
    process.execPath,
    [ANALYSER_PATH, ...animationFiles, '--output', tmpFlags],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error('[build-custom] Analyser failed:\n', result.stderr || result.stdout);
    process.exit(1);
  }

  const flags = JSON.parse(fs.readFileSync(tmpFlags, 'utf8'));
  try { fs.unlinkSync(tmpFlags); } catch (_) { /* ignore */ }
  return flags;
}

/**
 * Build a flags object with all features enabled (no animation analysis).
 */
function allFlags(renderers) {
  return {
    LOTTIE_INCLUDE_SVG:          renderers.includes('svg'),
    LOTTIE_INCLUDE_CANVAS:       renderers.includes('canvas'),
    LOTTIE_INCLUDE_HTML:         renderers.includes('html'),
    LOTTIE_INCLUDE_EXPRESSIONS:  true,
    LOTTIE_INCLUDE_EFFECTS:      true,
    LOTTIE_INCLUDE_AUDIO:        true,
    LOTTIE_INCLUDE_IMAGES:       true,
    LOTTIE_INCLUDE_TEXT:         true,
    LOTTIE_INCLUDE_GRADIENTS:    true,
    LOTTIE_INCLUDE_3D:           true,
    LOTTIE_INCLUDE_TRIM:         true,
    LOTTIE_INCLUDE_REPEATER:     true,
    LOTTIE_INCLUDE_ROUND_CORNERS:true,
    LOTTIE_INCLUDE_ZIGZAG:       true,
    LOTTIE_INCLUDE_PUCKER_BLOAT: true,
    LOTTIE_INCLUDE_OFFSET_PATH:  true,
    LOTTIE_INCLUDE_MERGE:        true,
    LOTTIE_INCLUDE_STAR:         true,
  };
}

// ─── Entry File Generator ────────────────────────────────────────────────────

/** All shape modifier metadata used to build the entry file. */
const SHAPE_MODIFIERS = [
  { flag: 'LOTTIE_INCLUDE_TRIM',          key: 'tm', name: 'TrimModifier',          path: '../utils/shapes/TrimModifier' },
  { flag: 'LOTTIE_INCLUDE_PUCKER_BLOAT',  key: 'pb', name: 'PuckerAndBloatModifier',path: '../utils/shapes/PuckerAndBloatModifier' },
  { flag: 'LOTTIE_INCLUDE_REPEATER',      key: 'rp', name: 'RepeaterModifier',       path: '../utils/shapes/RepeaterModifier' },
  { flag: 'LOTTIE_INCLUDE_ROUND_CORNERS', key: 'rd', name: 'RoundCornersModifier',   path: '../utils/shapes/RoundCornersModifier' },
  { flag: 'LOTTIE_INCLUDE_ZIGZAG',        key: 'zz', name: 'ZigZagModifier',         path: '../utils/shapes/ZigZagModifier' },
  { flag: 'LOTTIE_INCLUDE_OFFSET_PATH',   key: 'op', name: 'OffsetPathModifier',     path: '../utils/shapes/OffsetPathModifier' },
];

/** SVG effects registrations (same for HTML renderer which shares SVGEffects). */
const SVG_EFFECTS = [
  { name: 'SVGTintFilter',         path: '../elements/svgElements/effects/SVGTintEffect',         id: 20, withProp: true  },
  { name: 'SVGFillFilter',         path: '../elements/svgElements/effects/SVGFillFilter',         id: 21, withProp: true  },
  { name: 'SVGStrokeEffect',       path: '../elements/svgElements/effects/SVGStrokeEffect',       id: 22, withProp: false },
  { name: 'SVGTritoneFilter',      path: '../elements/svgElements/effects/SVGTritoneFilter',      id: 23, withProp: true  },
  { name: 'SVGProLevelsFilter',    path: '../elements/svgElements/effects/SVGProLevelsFilter',    id: 24, withProp: true  },
  { name: 'SVGDropShadowEffect',   path: '../elements/svgElements/effects/SVGDropShadowEffect',   id: 25, withProp: true  },
  { name: 'SVGMatte3Effect',       path: '../elements/svgElements/effects/SVGMatte3Effect',       id: 28, withProp: false },
  { name: 'SVGGaussianBlurEffect', path: '../elements/svgElements/effects/SVGGaussianBlurEffect', id: 29, withProp: true  },
  { name: 'SVGTransformEffect',    path: '../elements/svgElements/effects/SVGTransformEffect',    id: 35, withProp: false },
];

/** Canvas effects. */
const CANVAS_EFFECTS = [
  { name: 'CVTransformEffect', path: '../elements/canvasElements/effects/CVTransformEffect', id: 35, withProp: undefined },
];

/**
 * Generate a TypeScript entry file that only imports what the flags require.
 *
 * @param {object} flags     - Feature flags from analyser or allFlags()
 * @param {string[]} renderers - Which renderers to include
 * @param {boolean|null} forceExpressions - Override expression detection
 * @param {boolean|null} forceEffects     - Override effects detection
 * @returns {string} TypeScript source text
 */
function generateEntry(flags, renderers, forceExpressions, forceEffects) {
  const lines = [];
  const useExpressions = forceExpressions !== null ? forceExpressions : flags.LOTTIE_INCLUDE_EXPRESSIONS;
  const useEffects     = forceEffects     !== null ? forceEffects     : flags.LOTTIE_INCLUDE_EFFECTS;

  lines.push('// @ts-nocheck');
  lines.push('// AUTO-GENERATED by tools/build-custom.cjs — do not edit by hand.');
  lines.push('// Delete this file after the build finishes; it is listed in .gitignore.');
  lines.push('');

  // ── Base import ────────────────────────────────────────────────────────────
  lines.push("import lottie from './main';");
  lines.push('');

  // ── Renderer imports ───────────────────────────────────────────────────────
  const rendererMap = {
    svg:    { name: 'SVGRenderer',    path: '../renderers/SVGRenderer',    key: 'svg'    },
    canvas: { name: 'CanvasRenderer', path: '../renderers/CanvasRenderer', key: 'canvas' },
    html:   { name: 'HybridRenderer', path: '../renderers/HybridRenderer', key: 'html'   },
  };

  const activeRenderers = renderers.filter(r => rendererMap[r]);
  if (activeRenderers.length > 0) {
    lines.push("import { registerRenderer } from '../renderers/renderersManager';");
    for (const r of activeRenderers) {
      const { name, path: p } = rendererMap[r];
      lines.push(`import ${name} from '${p}';`);
    }
    lines.push('');
  }

  // ── Shape modifier imports ─────────────────────────────────────────────────
  const activeModifiers = SHAPE_MODIFIERS.filter(m => flags[m.flag]);
  if (activeModifiers.length > 0) {
    lines.push("import { ShapeModifiers } from '../utils/shapes/ShapeModifiers';");
    for (const m of activeModifiers) {
      lines.push(`import ${m.name} from '${m.path}';`);
    }
    lines.push('');
  }

  // ── Expressions imports ────────────────────────────────────────────────────
  if (useExpressions) {
    lines.push("import { setExpressionsPlugin, setExpressionInterfaces } from '../utils/common';");
    lines.push("import Expressions from '../utils/expressions/Expressions';");
    lines.push("import interfacesProvider from '../utils/expressions/InterfacesProvider';");
    lines.push("import expressionPropertyDecorator from '../utils/expressions/ExpressionPropertyDecorator';");
    lines.push("import expressionTextPropertyDecorator from '../utils/expressions/ExpressionTextPropertyDecorator';");
    lines.push('');
  }

  // ── SVG/HTML effects imports ───────────────────────────────────────────────
  const hasSvgRenderer   = activeRenderers.includes('svg');
  const hasHtmlRenderer  = activeRenderers.includes('html');
  const hasCanvasRenderer= activeRenderers.includes('canvas');

  if (useEffects && (hasSvgRenderer || hasHtmlRenderer)) {
    lines.push("import { registerEffect } from '../elements/svgElements/SVGEffects';");
    for (const e of SVG_EFFECTS) {
      lines.push(`import ${e.name} from '${e.path}';`);
    }
    lines.push('');
  }

  if (useEffects && hasCanvasRenderer) {
    lines.push("import { registerEffect as registerCVEffect } from '../elements/canvasElements/CVEffects';");
    for (const e of CANVAS_EFFECTS) {
      lines.push(`import ${e.name} from '${e.path}';`);
    }
    lines.push('');
  }

  // ── Registrations ─────────────────────────────────────────────────────────
  lines.push('// ── Renderer registrations ──────────────────────────────────');
  for (const r of activeRenderers) {
    const { name, key } = rendererMap[r];
    lines.push(`registerRenderer('${key}', ${name});`);
  }
  lines.push('');

  if (activeModifiers.length > 0) {
    lines.push('// ── Shape modifier registrations ────────────────────────────');
    for (const m of activeModifiers) {
      lines.push(`ShapeModifiers.registerModifier('${m.key}', ${m.name});`);
    }
    lines.push('');
  }

  if (useExpressions) {
    lines.push('// ── Expressions registration ────────────────────────────────');
    lines.push('setExpressionsPlugin(Expressions);');
    lines.push('setExpressionInterfaces(interfacesProvider);');
    lines.push('expressionPropertyDecorator();');
    lines.push('expressionTextPropertyDecorator();');
    lines.push('');
  }

  if (useEffects && (hasSvgRenderer || hasHtmlRenderer)) {
    lines.push('// ── SVG/HTML effect registrations ───────────────────────────');
    for (const e of SVG_EFFECTS) {
      if (e.withProp === undefined) {
        lines.push(`registerEffect(${e.id}, ${e.name});`);
      } else {
        lines.push(`registerEffect(${e.id}, ${e.name}, ${e.withProp});`);
      }
    }
    lines.push('');
  }

  if (useEffects && hasCanvasRenderer) {
    lines.push('// ── Canvas effect registrations ─────────────────────────────');
    for (const e of CANVAS_EFFECTS) {
      if (e.withProp === undefined) {
        lines.push(`registerCVEffect(${e.id}, ${e.name});`);
      } else {
        lines.push(`registerCVEffect(${e.id}, ${e.name}, ${e.withProp});`);
      }
    }
    lines.push('');
  }

  lines.push('export default lottie;');
  lines.push('');

  return lines.join('\n');
}

// ─── Rollup Build ────────────────────────────────────────────────────────────

async function runRollup(entryFile, outputFile, minify, sourcemap) {
  // Resolve the rollup binary from the local install
  const rollupBin = path.join(REPO_ROOT, 'node_modules', '.bin', 'rollup');
  if (!fs.existsSync(rollupBin)) {
    throw new Error('rollup binary not found in node_modules/.bin — run npm install');
  }

  // We pass build parameters via environment variables so the config's
  // `makeCustomConfig()` factory can pick them up (it's an ESM config file).
  const env = {
    ...process.env,
    LOTTIE_CUSTOM_ENTRY:    entryFile,
    LOTTIE_CUSTOM_OUTPUT:   outputFile,
    LOTTIE_CUSTOM_MINIFY:   String(minify),
    LOTTIE_CUSTOM_SOURCEMAP:String(sourcemap),
  };

  const configPath = path.join(REPO_ROOT, 'rollup.custom.config.mjs');

  console.log('[build-custom] Starting Rollup build…');
  console.log(`  Entry : ${path.relative(REPO_ROOT, entryFile)}`);
  console.log(`  Output: ${path.relative(REPO_ROOT, outputFile)}`);
  console.log(`  Minify: ${minify}  Sourcemap: ${sourcemap}`);
  console.log('');

  const result = spawnSync(
    rollupBin,
    ['--config', configPath],
    { cwd: REPO_ROOT, env, stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error(`Rollup exited with code ${result.status}`);
  }
}

// ─── Size Reporter ───────────────────────────────────────────────────────────

function reportSize(outputFile, referenceFile) {
  const customSize = fs.statSync(outputFile).size;
  console.log(`\n[build-custom] ✓ Build complete`);
  console.log(`  Output size: ${(customSize / 1024).toFixed(1)} KB  (${outputFile})`);

  if (referenceFile && fs.existsSync(referenceFile)) {
    const refSize = fs.statSync(referenceFile).size;
    const savings = refSize - customSize;
    const pct     = ((savings / refSize) * 100).toFixed(1);
    console.log(`  Reference  : ${(refSize   / 1024).toFixed(1)} KB  (${referenceFile})`);
    console.log(`  Savings    : ${(savings   / 1024).toFixed(1)} KB  (${pct}% smaller)`);
  }
}

// ─── Help Text ───────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Usage: node tools/build-custom.cjs [options]

Options:
  --animations <file> [...]   Lottie JSON files to analyse for feature detection
  --renderer <svg|canvas|html|all>
                              Renderer(s) to include (default: svg)
                              Comma-separated or 'all'
  --output <path>             Output bundle path
                              (default: build/player/lottie.custom.js)
  --no-minify                 Skip terser minification
  --sourcemap                 Emit source map
  --expressions               Force-include expression engine (even if not detected)
  --no-expressions            Force-exclude expression engine
  --effects                   Force-include effects
  --no-effects                Force-exclude effects
  --help                      Show this message

Examples:
  # Auto-detect features from a single animation, SVG renderer:
  node tools/build-custom.cjs --animations demo/happy2016/data.json --renderer svg

  # Multi-animation, all renderers, unminified:
  node tools/build-custom.cjs \\
    --animations demo/happy2016/data.json demo/banner/data.json \\
    --renderer all --no-minify

  # Custom output path:
  node tools/build-custom.cjs --animations my-anim.json --output dist/lottie.min.js
`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    return;
  }

  // ── Determine feature flags ────────────────────────────────────────────────
  let flags;
  if (opts.animations.length > 0) {
    console.log(`[build-custom] Analysing ${opts.animations.length} animation file(s)…`);
    for (const f of opts.animations) {
      console.log(`  ${path.relative(REPO_ROOT, f)}`);
    }
    flags = analyseAnimations(opts.animations);

    // Override renderer flags with what was explicitly requested on the CLI
    flags.LOTTIE_INCLUDE_SVG    = opts.renderers.includes('svg');
    flags.LOTTIE_INCLUDE_CANVAS = opts.renderers.includes('canvas');
    flags.LOTTIE_INCLUDE_HTML   = opts.renderers.includes('html');

    console.log('\n[build-custom] Feature flags:');
    for (const [k, v] of Object.entries(flags)) {
      if (!k.startsWith('_')) {
        console.log(`  ${k.padEnd(36)} ${v ? '✓' : '✗'}`);
      }
    }
    console.log('');
  } else {
    console.log('[build-custom] No --animations specified — including all features for selected renderer(s).');
    flags = allFlags(opts.renderers);
    console.log('');
  }

  // ── Generate entry file ────────────────────────────────────────────────────
  const entrySource = generateEntry(
    flags,
    opts.renderers,
    opts.expressions,
    opts.effects,
  );

  fs.writeFileSync(ENTRY_FILE, entrySource, 'utf8');
  console.log(`[build-custom] Generated entry: ${path.relative(REPO_ROOT, ENTRY_FILE)}`);

  // ── Ensure output directory exists ────────────────────────────────────────
  const outDir = path.dirname(opts.output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // ── Run Rollup ─────────────────────────────────────────────────────────────
  try {
    await runRollup(ENTRY_FILE, opts.output, opts.minify, opts.sourcemap);
  } finally {
    // Always clean up the generated entry file
    try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  }

  // ── Size report ───────────────────────────────────────────────────────────
  const referenceFile = path.join(REPO_ROOT, 'build/player/lottie_svg.min.js');
  reportSize(opts.output, referenceFile);
}

main().catch((err) => {
  console.error('[build-custom] Fatal error:', err.message || err);
  // Clean up generated entry on failure
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  process.exit(1);
});
