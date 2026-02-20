#!/usr/bin/env node
/**
 * Serves the lottie-web repo root as a static site on port 3000.
 * Usage: npm run serve
 *        npm run serve -- --port 8080
 */
'use strict';

const express = require('express');
const path    = require('path');

const ROOT = path.resolve(__dirname, '..');
const portArg = process.argv.indexOf('--port');
const PORT = portArg !== -1 ? parseInt(process.argv[portArg + 1], 10) : 3000;

const app = express();
app.use(express.static(ROOT));

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  lottie-web demo server running at:');
  console.log('  \u27a4  http://localhost:' + PORT + '/demo/bodymovin/');
  console.log('  \u27a4  http://localhost:' + PORT + '/demo/adrock/');
  console.log('  \u27a4  http://localhost:' + PORT + '/demo/gatin/');
  console.log('  \u27a4  http://localhost:' + PORT + '/demo/happy2016/');
  console.log('  \u27a4  http://localhost:' + PORT + '/demo/navidad/');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
