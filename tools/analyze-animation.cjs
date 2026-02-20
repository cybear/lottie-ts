#!/usr/bin/env node
/**
 * tools/analyze-animation.cjs
 *
 * Scans a Lottie animation JSON and reports:
 *   - Every feature the animation uses
 *   - Which lottie source modules those features require
 *   - Which modules are unused (candidates for removal in a custom build)
 *   - Estimated bundle size savings
 *
 * Usage:
 *   node tools/analyze-animation.cjs <animation.json> [options]
 *   node tools/analyze-animation.cjs demo/happy2016/data.json --renderer svg
 *
 * Options:
 *   --renderer svg|canvas|html|all   Renderer(s) to include (default: all)
 *   --json                           Output raw JSON manifest
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 1.  FEATURE DEFINITIONS
// ─────────────────────────────────────────────

const LAYER_TYPES = {
  0:  'precomp',
  1:  'solid',
  2:  'image',
  3:  'null',
  4:  'shape',
  5:  'text',
  6:  'audio',
  8:  'footageComp',
  9:  'footageImage',
  10: 'footageVideo',
  13: 'camera',
  15: 'data',
  99: 'hidden',
};

const SHAPE_TYPES = {
  rc: 'rect',
  el: 'ellipse',
  sr: 'star/polygon',
  sh: 'path',
  fl: 'fill',
  st: 'stroke',
  gf: 'gradientFill',
  gs: 'gradientStroke',
  gr: 'group',
  tr: 'transform',
  tm: 'trim',
  rp: 'repeater',
  pb: 'puckerBloat',
  zz: 'zigZag',
  mm: 'merge',
  rd: 'roundCorners',
  of: 'offsetPath',
};

const EFFECT_TYPES = {
  5:  'dropShadow',
  20: 'fillColor',
  21: 'stroke',
  22: 'tritone',
  23: 'proLevels',
  24: 'dropShadow',
  25: 'displacementMap',
  26: 'matte3',
  27: 'gaussianBlur',
  28: 'twist',
  29: 'meshWarp',
  30: 'wavy',
  31: 'spherize',
  32: 'noise',
  33: 'solid',
  34: 'gradient',
  35: 'stroke2',
};

const MATTE_TYPES = {
  1: 'alpha', 2: 'alphaInverted', 3: 'luma', 4: 'lumaInverted',
};

// ─────────────────────────────────────────────
// 2.  MODULE → FEATURE MAP  (source lines, estimated)
// ─────────────────────────────────────────────
//
// Each entry: { lines, features: [...featureKeys] }
// "lines" is approximate source lines; we use it to weight the savings estimate.
// featureKeys come from the manifest collected below.
//
// Convention for featureKeys:
//   renderer.svg / renderer.canvas / renderer.html
//   layer.<type>
//   shape.<type>
//   effect.<type>
//   feature.expressions  feature.masks  feature.3d  feature.gradients
//   feature.text         feature.audio  feature.images
//   feature.trim         feature.repeater  feature.zigzag
//   feature.roundCorners feature.puckerBloat  feature.offsetPath
//   feature.merge        feature.star

const MODULES = [
  // ── Renderers ────────────────────────────────────────────
  {
    name: 'SVGRenderer',
    path: 'src/renderers/SVGRenderer.ts + SVGRendererBase.ts',
    lines: 630,
    requiredBy: ['renderer.svg'],
  },
  {
    name: 'CanvasRenderer',
    path: 'src/renderers/CanvasRenderer.ts + CanvasRendererBase.ts',
    lines: 700,
    requiredBy: ['renderer.canvas'],
  },
  {
    name: 'HybridRenderer (HTML)',
    path: 'src/renderers/HybridRenderer.ts + HybridRendererBase.ts',
    lines: 680,
    requiredBy: ['renderer.html'],
  },

  // ── Layer elements (SVG) ─────────────────────────────────
  {
    name: 'SVGShapeElement',
    path: 'src/elements/svgElements/SVGShapeElement.ts + SVGElementsRenderer.ts',
    lines: 634,
    requiredBy: ['renderer.svg', 'layer.shape'],
  },
  {
    name: 'SVGTextElement',
    path: 'src/elements/svgElements/SVGTextElement.ts',
    lines: 324,
    requiredBy: ['renderer.svg', 'layer.text'],
  },
  {
    name: 'SVGCompElement',
    path: 'src/elements/svgElements/SVGCompElement.ts',
    lines: 150,
    requiredBy: ['renderer.svg', 'layer.precomp'],
  },

  // ── Layer elements (Canvas) ──────────────────────────────
  {
    name: 'CVShapeElement',
    path: 'src/elements/canvasElements/CVShapeElement.ts',
    lines: 553,
    requiredBy: ['renderer.canvas', 'layer.shape'],
  },
  {
    name: 'CVTextElement',
    path: 'src/elements/canvasElements/CVTextElement.ts',
    lines: 278,
    requiredBy: ['renderer.canvas', 'layer.text'],
  },
  {
    name: 'CVImageElement',
    path: 'src/elements/canvasElements/CVImageElement.ts',
    lines: 60,
    requiredBy: ['renderer.canvas', 'layer.image'],
  },
  {
    name: 'CVSolidElement',
    path: 'src/elements/canvasElements/CVSolidElement.ts',
    lines: 40,
    requiredBy: ['renderer.canvas', 'layer.solid'],
  },

  // ── Layer elements (HTML) ────────────────────────────────
  {
    name: 'HCompElement',
    path: 'src/elements/htmlElements/HCompElement.ts',
    lines: 58,
    requiredBy: ['renderer.html', 'layer.precomp'],
  },
  {
    name: 'HShapeElement',
    path: 'src/elements/htmlElements/HShapeElement.ts',
    lines: 275,
    requiredBy: ['renderer.html', 'layer.shape'],
  },
  {
    name: 'HTextElement',
    path: 'src/elements/htmlElements/HTextElement.ts',
    lines: 316,
    requiredBy: ['renderer.html', 'layer.text'],
  },
  {
    name: 'HImageElement',
    path: 'src/elements/htmlElements/HImageElement.ts',
    lines: 44,
    requiredBy: ['renderer.html', 'layer.image'],
  },
  {
    name: 'HCameraElement',
    path: 'src/elements/htmlElements/HCameraElement.ts',
    lines: 176,
    requiredBy: ['renderer.html', 'layer.camera'],
  },
  {
    name: 'HSolidElement',
    path: 'src/elements/htmlElements/HSolidElement.ts',
    lines: 38,
    requiredBy: ['renderer.html', 'layer.solid'],
  },

  // ── Text subsystem ───────────────────────────────────────
  {
    name: 'TextProperty + TextAnimatorProperty',
    path: 'src/utils/text/*.ts',
    lines: 1396,
    requiredBy: ['layer.text'],
  },
  {
    name: 'FontManager',
    path: 'src/utils/FontManager.ts',
    lines: 460,
    requiredBy: ['layer.text'],
  },

  // ── Audio ────────────────────────────────────────────────
  {
    name: 'AudioController + AudioElement',
    path: 'src/utils/audio/*.ts + src/elements/AudioElement.ts',
    lines: 230,
    requiredBy: ['layer.audio'],
  },

  // ── Image preloader ──────────────────────────────────────
  {
    name: 'ImagePreloader',
    path: 'src/utils/imagePreloader.ts',
    lines: 248,
    requiredBy: ['layer.image'],
  },
  {
    name: 'FootageElement',
    path: 'src/elements/FootageElement.ts',
    lines: 40,
    requiredBy: ['layer.footageComp', 'layer.footageImage', 'layer.footageVideo'],
  },

  // ── Shape modifiers ──────────────────────────────────────
  {
    name: 'GradientProperty',
    path: 'src/utils/shapes/GradientProperty.ts',
    lines: 120,
    requiredBy: ['feature.gradients'],
  },
  {
    name: 'TrimModifier',
    path: 'src/utils/shapes/TrimModifier.ts',
    lines: 397,
    requiredBy: ['feature.trim'],
  },
  {
    name: 'RepeaterModifier',
    path: 'src/utils/shapes/RepeaterModifier.ts',
    lines: 294,
    requiredBy: ['feature.repeater'],
  },
  {
    name: 'ZigZagModifier',
    path: 'src/utils/shapes/ZigZagModifier.ts',
    lines: 80,
    requiredBy: ['feature.zigzag'],
  },
  {
    name: 'RoundCornersModifier',
    path: 'src/utils/shapes/RoundCornersModifier.ts',
    lines: 70,
    requiredBy: ['feature.roundCorners'],
  },
  {
    name: 'PuckerAndBloatModifier',
    path: 'src/utils/shapes/PuckerAndBloatModifier.ts',
    lines: 80,
    requiredBy: ['feature.puckerBloat'],
  },
  {
    name: 'OffsetPathModifier',
    path: 'src/utils/shapes/OffsetPathModifier.ts',
    lines: 287,
    requiredBy: ['feature.offsetPath'],
  },
  {
    name: 'MouseModifier',
    path: 'src/utils/shapes/MouseModifier.ts',
    lines: 209,
    requiredBy: ['feature.mouseModifier'],
  },

  // ── Expressions engine ───────────────────────────────────
  {
    name: 'ExpressionManager',
    path: 'src/utils/expressions/ExpressionManager.ts',
    lines: 839,
    requiredBy: ['feature.expressions'],
  },
  {
    name: 'Expression Interfaces (Layer/Shape/Text/Mask/etc.)',
    path: 'src/utils/expressions/*.ts (interfaces)',
    lines: 1800,
    requiredBy: ['feature.expressions'],
  },
  {
    name: 'ExpressionPropertyDecorator',
    path: 'src/utils/expressions/ExpressionPropertyDecorator.ts + ExpressionTextPropertyDecorator.ts',
    lines: 660,
    requiredBy: ['feature.expressions'],
  },

  // ── Masking ──────────────────────────────────────────────
  {
    name: 'MaskElement (SVGMask)',
    path: 'src/mask.ts',
    lines: 267,
    requiredBy: ['feature.masks'],
  },

  // ── Effects ──────────────────────────────────────────────
  {
    name: 'SVGEffects',
    path: 'src/elements/svgElements/SVGEffects.ts + effects/',
    lines: 600,
    requiredBy: ['feature.effects'],
  },
  {
    name: 'CVEffects',
    path: 'src/elements/canvasElements/CVEffects.ts + effects/',
    lines: 200,
    requiredBy: ['feature.effects'],
  },
  {
    name: 'HEffects',
    path: 'src/elements/htmlElements/HEffects.ts',
    lines: 80,
    requiredBy: ['feature.effects'],
  },

  // ── 3D ───────────────────────────────────────────────────
  {
    name: 'HCameraElement (3D / perspective)',
    path: 'src/elements/htmlElements/HCameraElement.ts',
    lines: 176,
    requiredBy: ['feature.3d'],
  },
];

// ─────────────────────────────────────────────
// 3.  SCANNER — walk the animation JSON
// ─────────────────────────────────────────────

function scan(data) {
  const manifest = {
    version: data.v || 'unknown',
    dimensions: `${data.w}×${data.h}`,
    frameRate: data.fr,
    duration: data.op ? `${Math.round(data.op / data.fr * 100) / 100}s (${data.op} frames)` : 'unknown',

    renderers: new Set(),   // filled by caller / --renderer flag
    layerTypes: new Set(),
    shapeTypes: new Set(),
    shapeModifiers: new Set(),
    effectTypes: new Set(),
    matteTypes: new Set(),
    features: new Set(),

    hasExpressions: false,
    hasMasks: false,
    has3d: false,
    hasImages: false,
    hasAudio: false,
    hasText: false,
    hasTimeRemap: false,
    hasMarkers: false,
    assetCount: { precomp: 0, image: 0, audio: 0, footage: 0 },
    expressionCount: 0,
  };

  if (data.markers && data.markers.length) {
    manifest.hasMarkers = true;
    manifest.features.add('feature.markers');
  }

  // Classify assets
  for (const asset of (data.assets || [])) {
    if (asset.layers) {
      manifest.assetCount.precomp++;
    } else if (asset.e === 1) {
      manifest.assetCount.audio++;
    } else if (asset.u !== undefined || asset.p) {
      manifest.assetCount.image++;
    } else {
      manifest.assetCount.footage++;
    }
  }

  // Walk all layer arrays (top-level + precomp assets)
  const layerArrays = [data.layers || []];
  for (const asset of (data.assets || [])) {
    if (asset.layers) layerArrays.push(asset.layers);
  }

  for (const layers of layerArrays) {
    for (const layer of layers) {
      walkLayer(layer, manifest);
    }
  }

  // Convert Sets to sorted arrays for output
  manifest.renderers    = [...manifest.renderers].sort();
  manifest.layerTypes   = [...manifest.layerTypes].sort();
  manifest.shapeTypes   = [...manifest.shapeTypes].sort();
  manifest.shapeModifiers = [...manifest.shapeModifiers].sort();
  manifest.effectTypes  = [...manifest.effectTypes].sort();
  manifest.matteTypes   = [...manifest.matteTypes].sort();
  manifest.features     = [...manifest.features].sort();

  return manifest;
}

function walkLayer(layer, manifest) {
  const typeName = LAYER_TYPES[layer.ty] ?? `unknown(${layer.ty})`;
  manifest.layerTypes.add(`layer.${typeName}`);

  if (layer.ty === 5) manifest.hasText = true;
  if (layer.ty === 2 || layer.ty === 9) manifest.hasImages = true;
  if (layer.ty === 6) manifest.hasAudio = true;
  if (layer.ty === 13) {
    manifest.has3d = true;
    manifest.features.add('feature.3d');
  }

  if (layer.ddd) {
    manifest.has3d = true;
    manifest.features.add('feature.3d');
  }

  if (layer.masksProperties && layer.masksProperties.length) {
    manifest.hasMasks = true;
    manifest.features.add('feature.masks');
    for (const mask of layer.masksProperties) {
      if (mask.mode && mask.mode !== 'n') manifest.matteTypes.add(mask.mode);
    }
  }

  if (layer.tt) {
    manifest.matteTypes.add(MATTE_TYPES[layer.tt] ?? `type${layer.tt}`);
  }

  if (layer.tm) {
    manifest.hasTimeRemap = true;
    manifest.features.add('feature.timeRemap');
  }

  // Effects
  for (const ef of (layer.ef || [])) {
    manifest.features.add('feature.effects');
    const efName = EFFECT_TYPES[ef.ty] ?? `effect${ef.ty}`;
    manifest.effectTypes.add(efName);
  }

  // Expressions — any property with an `x` field
  manifest.expressionCount += countExpressions(layer);
  if (manifest.expressionCount > 0) {
    manifest.hasExpressions = true;
    manifest.features.add('feature.expressions');
  }

  // Shapes
  for (const shape of (layer.shapes || [])) {
    walkShape(shape, manifest);
  }
}

function walkShape(shape, manifest) {
  const ty = shape.ty;
  if (ty === 'gr') {
    // recurse into group
    for (const item of (shape.it || [])) {
      walkShape(item, manifest);
    }
    return;
  }

  if (!ty) return;

  const typeName = SHAPE_TYPES[ty] ?? ty;

  if (['tm', 'rp', 'pb', 'zz', 'mm', 'rd', 'of'].includes(ty)) {
    const featureMap = {
      tm: 'feature.trim',
      rp: 'feature.repeater',
      pb: 'feature.puckerBloat',
      zz: 'feature.zigzag',
      mm: 'feature.merge',
      rd: 'feature.roundCorners',
      of: 'feature.offsetPath',
    };
    manifest.shapeModifiers.add(typeName);
    manifest.features.add(featureMap[ty]);
  } else {
    manifest.shapeTypes.add(typeName);
  }

  if (ty === 'gf' || ty === 'gs') {
    manifest.features.add('feature.gradients');
  }
  if (ty === 'st' || ty === 'gs') {
    // stroke — may have dashes (the dashOb bug we fixed!)
    if (shape.d && shape.d.length) {
      manifest.features.add('feature.strokeDash');
    }
  }
  if (ty === 'sr') {
    manifest.features.add('feature.star');
  }
}

function countExpressions(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) count += countExpressions(item);
    return count;
  }
  if ('x' in obj && typeof obj.x === 'string') count++;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') count += countExpressions(v);
  }
  return count;
}

// ─────────────────────────────────────────────
// 4.  MODULE ANALYSIS — what's needed / unused
// ─────────────────────────────────────────────

function analyzeModules(manifest, renderers) {
  // Build the set of active feature keys
  const active = new Set([
    ...manifest.layerTypes,
    ...manifest.features,
    ...renderers.map(r => `renderer.${r}`),
  ]);

  const needed  = [];
  const unused  = [];

  for (const mod of MODULES) {
    // A module is needed if ALL of its requiredBy keys are active.
    // (i.e. both the renderer AND the layer type must be present)
    // Exception: modules with a single key just need that one key.
    let required;
    if (mod.requiredBy.length === 1) {
      required = active.has(mod.requiredBy[0]);
    } else {
      // Need at least one renderer key AND at least one feature key
      const rendererKeys = mod.requiredBy.filter(k => k.startsWith('renderer.'));
      const featureKeys  = mod.requiredBy.filter(k => !k.startsWith('renderer.'));

      if (rendererKeys.length === 0) {
        required = featureKeys.some(k => active.has(k));
      } else if (featureKeys.length === 0) {
        required = rendererKeys.some(k => active.has(k));
      } else {
        required = rendererKeys.some(k => active.has(k)) && featureKeys.some(k => active.has(k));
      }
    }

    (required ? needed : unused).push(mod);
  }

  return { needed, unused };
}

// ─────────────────────────────────────────────
// 5.  REPORTING
// ─────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RED    = '\x1b[31m';
const BLUE   = '\x1b[34m';

function fmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function printReport(filePath, manifest, renderers, needed, unused, outputJson) {
  if (outputJson) {
    console.log(JSON.stringify({ manifest, needed: needed.map(m => m.name), unused: unused.map(m => m.name) }, null, 2));
    return;
  }

  const totalLines   = MODULES.reduce((s, m) => s + m.lines, 0);
  const neededLines  = needed.reduce((s, m) => s + m.lines, 0);
  const unusedLines  = unused.reduce((s, m) => s + m.lines, 0);
  const savingsPct   = Math.round(unusedLines / totalLines * 100);

  // Reference file sizes (unminified, from build/)
  const BUILD_SIZES = {
    svg:    619891,
    canvas: 669985,
    html:   672930,
    all:    750350,
  };
  const refFile = renderers.length === 1 ? BUILD_SIZES[renderers[0]] ?? BUILD_SIZES.all : BUILD_SIZES.all;
  const estSavings = Math.round(refFile * savingsPct / 100);

  console.log('');
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Lottie Animation Feature Analyser                 ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`  ${BOLD}File:${RESET}      ${filePath}`);
  console.log(`  ${BOLD}Version:${RESET}   ${manifest.version}`);
  console.log(`  ${BOLD}Size:${RESET}      ${manifest.dimensions}  ${manifest.frameRate}fps  ${manifest.duration}`);
  console.log(`  ${BOLD}Renderers:${RESET} ${renderers.join(', ')}`);
  console.log('');

  // ── Layer types ──────────────────────────────────────
  section('Layer types detected');
  printList(manifest.layerTypes.map(t => t.replace('layer.','')), GREEN);

  // ── Shape types ──────────────────────────────────────
  section('Shape types detected');
  printList(manifest.shapeTypes, GREEN);
  if (manifest.shapeModifiers.length) {
    console.log(`  ${YELLOW}Modifiers:${RESET} ${manifest.shapeModifiers.join(', ')}`);
  }

  // ── Features ─────────────────────────────────────────
  section('Features detected');
  const featDisplay = [
    manifest.hasExpressions  && `expressions (${fmt(manifest.expressionCount)} expr.)`,
    manifest.hasMasks        && `masks (modes: ${manifest.matteTypes.join(', ') || 'none'})`,
    manifest.has3d           && '3D layers/camera',
    manifest.hasText         && 'text layers',
    manifest.hasImages       && 'image assets',
    manifest.hasAudio        && 'audio',
    manifest.hasTimeRemap    && 'time-remap',
    manifest.hasMarkers      && 'markers',
  ].filter(Boolean);

  manifest.features
    .filter(f => f.startsWith('feature.') && !['feature.expressions','feature.masks','feature.3d','feature.effects','feature.markers','feature.timeRemap'].includes(f))
    .forEach(f => featDisplay.push(f.replace('feature.','')));

  if (manifest.effectTypes.length) {
    featDisplay.push(`effects: ${manifest.effectTypes.join(', ')}`);
  }

  if (featDisplay.length) {
    printList(featDisplay, YELLOW);
  } else {
    console.log(`  ${DIM}none beyond core animation${RESET}`);
  }

  // ── Assets ────────────────────────────────────────────
  const ac = manifest.assetCount;
  if (ac.precomp + ac.image + ac.audio + ac.footage > 0) {
    section('Assets');
    if (ac.precomp) console.log(`  ${GREEN}✓${RESET} ${ac.precomp} precomp(s)`);
    if (ac.image)   console.log(`  ${GREEN}✓${RESET} ${ac.image} image(s)`);
    if (ac.audio)   console.log(`  ${GREEN}✓${RESET} ${ac.audio} audio track(s)`);
    if (ac.footage) console.log(`  ${GREEN}✓${RESET} ${ac.footage} footage/other`);
  }

  // ── Required modules ──────────────────────────────────
  section('Required modules  ✅');
  for (const mod of needed) {
    console.log(`  ${GREEN}✓${RESET} ${BOLD}${mod.name}${RESET}  ${DIM}(~${fmt(mod.lines)} lines)${RESET}`);
    console.log(`    ${DIM}${mod.path}${RESET}`);
  }

  // ── Unused modules ────────────────────────────────────
  section('Unused modules — could be excluded  🔴');
  if (unused.length === 0) {
    console.log(`  ${DIM}none — this animation uses all modelled modules${RESET}`);
  } else {
    for (const mod of unused) {
      console.log(`  ${RED}✗${RESET} ${BOLD}${mod.name}${RESET}  ${DIM}(~${fmt(mod.lines)} lines)${RESET}`);
      console.log(`    ${DIM}${mod.path}${RESET}`);
    }
  }

  // ── Summary / savings ─────────────────────────────────
  section('Bundle size estimate');
  const refLabel = renderers.length === 1 ? `lottie_${renderers[0]}.js` : 'lottie.js';
  console.log(`  Reference build (${refLabel}):          ${BOLD}${fmt(refFile)} bytes${RESET}`);
  console.log(`  Estimated strippable code (${ savingsPct}% of modelled):`);
  console.log(`    ${RED}−${fmt(estSavings)} bytes${RESET}  (rough estimate based on source line counts)`);
  console.log(`  ${BOLD}${GREEN}Potential custom bundle:  ~${fmt(refFile - estSavings)} bytes${RESET}  (~${Math.round((refFile-estSavings)/1024)}KB)`);
  console.log('');
  console.log(`  ${DIM}Note: Actual savings depend on architectural refactoring to enable`);
  console.log(`  tree-shaking. See PLAN.md Phase 7 for the implementation roadmap.${RESET}`);
  console.log('');

  // ── Bug detection hints ───────────────────────────────
  const hints = buildHints(manifest);
  if (hints.length) {
    section('⚠️  Compatibility notes');
    for (const h of hints) console.log(`  ${YELLOW}⚠${RESET}  ${h}`);
    console.log('');
  }
}

function section(title) {
  console.log('');
  console.log(`  ${BOLD}${BLUE}── ${title} ${'─'.repeat(Math.max(0, 48 - title.length))}${RESET}`);
}

function printList(items, color) {
  if (!items.length) { console.log(`  ${DIM}none${RESET}`); return; }
  for (const item of items) {
    console.log(`  ${color}✓${RESET} ${item}`);
  }
}

function buildHints(manifest) {
  const hints = [];
  if (manifest.has3d && !manifest.renderers.includes('html')) {
    hints.push('3D layers detected — the HTML renderer is required for full 3D support.');
  }
  if (manifest.hasText) {
    hints.push('Text layers require font loading; consider embedding glyphs for offline use.');
  }
  if (manifest.hasExpressions && manifest.expressionCount > 100) {
    hints.push(`High expression count (${fmt(manifest.expressionCount)}) — the expression engine adds ~3200 lines. Consider baking expressions via Body Movin export.`);
  }
  if (manifest.features.includes('feature.strokeDash')) {
    hints.push('Stroke dash expressions found — see the fix in ShapeInterface.ts (dashOb TDZ).');
  }
  return hints;
}

// ─────────────────────────────────────────────
// 6.  MULTI-FILE HELPERS
// ─────────────────────────────────────────────

/**
 * Merge an array of manifests (from multiple animation files) by unioning all
 * feature sets.  Non-Set fields are summed / OR'd as appropriate.
 */
function mergeManifests(manifests, renderers) {
  if (manifests.length === 0) throw new Error('No manifests to merge');
  if (manifests.length === 1) {
    const m = { ...manifests[0] };
    m.renderers = renderers;
    return m;
  }

  const merged = {
    version: manifests.map(m => m.version).join(', '),
    dimensions: manifests.map(m => m.dimensions).join(' / '),
    frameRate: manifests[0].frameRate,
    duration: manifests.map(m => m.duration).join(' / '),
    renderers,
    hasExpressions: false, hasMasks: false, has3d: false,
    hasImages: false, hasAudio: false, hasText: false,
    hasTimeRemap: false, hasMarkers: false,
    assetCount: { precomp: 0, image: 0, audio: 0, footage: 0 },
    expressionCount: 0,
  };

  const ltSet = new Set(), stSet = new Set(), smSet = new Set(),
        etSet = new Set(), mtSet = new Set(), featSet = new Set();

  for (const m of manifests) {
    const arr = (v) => Array.isArray(v) ? v : [...v];
    arr(m.layerTypes).forEach(x => ltSet.add(x));
    arr(m.shapeTypes).forEach(x => stSet.add(x));
    arr(m.shapeModifiers).forEach(x => smSet.add(x));
    arr(m.effectTypes).forEach(x => etSet.add(x));
    arr(m.matteTypes).forEach(x => mtSet.add(x));
    arr(m.features).forEach(x => featSet.add(x));

    merged.expressionCount += m.expressionCount;
    for (const k of Object.keys(merged.assetCount)) merged.assetCount[k] += (m.assetCount[k] || 0);
    merged.hasExpressions = merged.hasExpressions || m.hasExpressions;
    merged.hasMasks       = merged.hasMasks       || m.hasMasks;
    merged.has3d          = merged.has3d          || m.has3d;
    merged.hasImages      = merged.hasImages      || m.hasImages;
    merged.hasAudio       = merged.hasAudio       || m.hasAudio;
    merged.hasText        = merged.hasText        || m.hasText;
    merged.hasTimeRemap   = merged.hasTimeRemap   || m.hasTimeRemap;
    merged.hasMarkers     = merged.hasMarkers     || m.hasMarkers;
  }

  merged.layerTypes     = [...ltSet].sort();
  merged.shapeTypes     = [...stSet].sort();
  merged.shapeModifiers = [...smSet].sort();
  merged.effectTypes    = [...etSet].sort();
  merged.matteTypes     = [...mtSet].sort();
  merged.features       = [...featSet].sort();
  return merged;
}

/**
 * Build the machine-readable flags object consumed by the custom build system.
 * Flag names map directly to @rollup/plugin-replace constants.
 */
function buildFlagsJson(manifest, renderers, sourceFiles) {
  const hasFeat = (f) => manifest.features.includes(f);
  const hasMod  = (name) => manifest.shapeModifiers.includes(name);
  return {
    LOTTIE_INCLUDE_SVG:           renderers.includes('svg'),
    LOTTIE_INCLUDE_CANVAS:        renderers.includes('canvas'),
    LOTTIE_INCLUDE_HTML:          renderers.includes('html'),
    LOTTIE_INCLUDE_EXPRESSIONS:   manifest.hasExpressions,
    LOTTIE_INCLUDE_TEXT:          manifest.hasText,
    LOTTIE_INCLUDE_AUDIO:         manifest.hasAudio,
    LOTTIE_INCLUDE_IMAGES:        manifest.hasImages,
    LOTTIE_INCLUDE_GRADIENTS:     hasFeat('feature.gradients'),
    LOTTIE_INCLUDE_EFFECTS:       hasFeat('feature.effects'),
    LOTTIE_INCLUDE_3D:            manifest.has3d,
    LOTTIE_INCLUDE_TRIM:          hasMod('trim'),
    LOTTIE_INCLUDE_REPEATER:      hasMod('repeater'),
    LOTTIE_INCLUDE_ZIGZAG:        hasMod('zigZag'),
    LOTTIE_INCLUDE_ROUND_CORNERS: hasMod('roundCorners'),
    LOTTIE_INCLUDE_PUCKER_BLOAT:  hasMod('puckerBloat'),
    LOTTIE_INCLUDE_OFFSET_PATH:   hasMod('offsetPath'),
    LOTTIE_INCLUDE_MERGE:         hasMod('merge'),
    LOTTIE_INCLUDE_STAR:          hasFeat('feature.star'),
    _sources:     sourceFiles,
    _renderers:   renderers,
    _generatedAt: new Date().toISOString(),
  };
}

/**
 * Short combined report for multi-file mode.
 */
function printBatchReport(files, manifest, renderers, needed, unused) {
  const totalLines  = MODULES.reduce((s, m) => s + m.lines, 0);
  const unusedLines = unused.reduce((s, m) => s + m.lines, 0);
  const savingsPct  = Math.round(unusedLines / totalLines * 100);
  const BUILD_SIZES = { svg: 619891, canvas: 669985, html: 672930, all: 750350 };
  const refFile = renderers.length === 1 ? (BUILD_SIZES[renderers[0]] ?? BUILD_SIZES.all) : BUILD_SIZES.all;

  console.log('');
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Lottie Feature Analyser — batch (${files.length} file${files.length > 1 ? 's' : ''})          ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`  ${BOLD}Files:${RESET}`);
  files.forEach(f => console.log(`    ${DIM}${f}${RESET}`));
  console.log(`  ${BOLD}Renderers:${RESET} ${renderers.join(', ')}`);
  console.log('');

  section('Combined features (union of all files)');
  const flags = buildFlagsJson(manifest, renderers, files);
  const trueFlags = Object.entries(flags)
    .filter(([k, v]) => !k.startsWith('_') && v === true)
    .map(([k]) => k.replace('LOTTIE_INCLUDE_', ''));
  printList(trueFlags, GREEN);

  section('Required modules  ✅');
  needed.forEach(m => console.log(`  ${GREEN}✓${RESET} ${BOLD}${m.name}${RESET}  ${DIM}(~${fmt(m.lines)} lines)${RESET}`));

  section('Strippable modules  🔴');
  if (unused.length === 0) {
    console.log(`  ${DIM}none${RESET}`);
  } else {
    unused.forEach(m => console.log(`  ${RED}✗${RESET} ${BOLD}${m.name}${RESET}  ${DIM}(~${fmt(m.lines)} lines)${RESET}`));
  }

  section('Bundle size estimate');
  const estSavings = Math.round(refFile * savingsPct / 100);
  const refLabel = renderers.length === 1 ? `lottie_${renderers[0]}.js` : 'lottie.js';
  console.log(`  Reference (${refLabel}):  ${BOLD}${fmt(refFile)} bytes${RESET}`);
  console.log(`  ${RED}−${fmt(estSavings)} bytes${RESET}  strippable (~${savingsPct}% of modelled)`);
  console.log(`  ${BOLD}${GREEN}Potential custom bundle:  ~${Math.round((refFile - estSavings) / 1024)} KB${RESET}`);
  console.log('');
}

/**
 * --strict: list any features that are detected but not yet covered by a
 * source-level LOTTIE_INCLUDE_* guard.  Once Steps 8.2-8.4 are complete
 * this set should always be empty.
 */
const SOURCE_GUARDED = new Set([
  'LOTTIE_INCLUDE_SVG', 'LOTTIE_INCLUDE_CANVAS', 'LOTTIE_INCLUDE_HTML',
  'LOTTIE_INCLUDE_EXPRESSIONS', 'LOTTIE_INCLUDE_EFFECTS',
  'LOTTIE_INCLUDE_TRIM', 'LOTTIE_INCLUDE_REPEATER', 'LOTTIE_INCLUDE_ZIGZAG',
  'LOTTIE_INCLUDE_ROUND_CORNERS', 'LOTTIE_INCLUDE_PUCKER_BLOAT',
  'LOTTIE_INCLUDE_OFFSET_PATH', 'LOTTIE_INCLUDE_AUDIO',
]);

function checkStrict(flags) {
  return Object.entries(flags)
    .filter(([k, v]) => !k.startsWith('_') && v === true && !SOURCE_GUARDED.has(k))
    .map(([k]) => k);
}

// ─────────────────────────────────────────────
// 7.  ENTRY POINT
// ─────────────────────────────────────────────

function main() {
  const rawArgs = process.argv.slice(2);
  if (!rawArgs.length || rawArgs[0] === '--help' || rawArgs[0] === '-h') {
    console.log([
      'Usage: node tools/analyze-animation.cjs <file1.json> [file2.json ...] [options]',
      '',
      'Options:',
      '  --renderer svg|canvas|html|all   Renderer(s) to target (default: all)',
      '  --output <path>                  Write machine-readable flags JSON to path',
      '  --json                           Print raw JSON manifest to stdout',
      '  --strict                         Exit 1 if any detected features lack a',
      '                                   source-level build guard',
    ].join('\n'));
    process.exit(0);
  }

  const files = [];
  let rendererArg = 'all';
  let outputJson  = false;
  let outputPath  = null;
  let strictMode  = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if      (a === '--renderer') { rendererArg = rawArgs[++i]; }
    else if (a === '--output')   { outputPath  = rawArgs[++i]; }
    else if (a === '--json')     { outputJson  = true; }
    else if (a === '--strict')   { strictMode  = true; }
    else if (!a.startsWith('--')) { files.push(a); }
    else { console.error(`Unknown flag: ${a}`); process.exit(1); }
  }

  if (!files.length) { console.error('No animation files specified.'); process.exit(1); }

  const renderers = rendererArg === 'all'
    ? ['svg', 'canvas', 'html']
    : rendererArg.split(',').map(s => s.trim());

  const manifests = files.map(f => {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { console.error('Could not read/parse', f, ':', e.message); process.exit(1); }
    const m = scan(data);
    m.renderers = renderers;
    return m;
  });

  const merged = mergeManifests(manifests, renderers);
  const { needed, unused } = analyzeModules(merged, renderers);
  const flags = buildFlagsJson(merged, renderers, files);

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(flags, null, 2) + '\n');
    if (!outputJson) console.log(`${GREEN}✓${RESET} Wrote flags → ${BOLD}${outputPath}${RESET}`);
  }

  if (outputJson) {
    console.log(JSON.stringify({ flags, manifest: merged, needed: needed.map(m => m.name), unused: unused.map(m => m.name) }, null, 2));
  } else if (files.length === 1) {
    printReport(files[0], merged, renderers, needed, unused, false);
  } else {
    printBatchReport(files, merged, renderers, needed, unused);
  }

  if (strictMode) {
    const unguarded = checkStrict(flags);
    if (unguarded.length) {
      console.error(`\n${RED}[strict]${RESET} Features detected but not source-guarded:`);
      unguarded.forEach(f => console.error(`  ${RED}✗${RESET} ${f}`));
      console.error('  See PLAN.md Steps 8.3-8.4.\n');
      process.exit(1);
    }
    console.log(`\n${GREEN}[strict]${RESET} All detected features are covered by build flags. ✓\n`);
  }
}

main();

