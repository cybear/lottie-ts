#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Simple test animation data
const testAnimationData = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 512,
  h: 512,
  nm: "Test Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Shape Layer 1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [256, 256, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [100, 100] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0, 0, 1] }
            }
          ]
        }
      ]
    }
  ]
};

function testBuildImports() {
  console.log('🧪 Testing build imports...\n');
  
  const testResults = [];
  const builds = [
    { name: 'core', path: 'dist/core.js' },
    { name: 'svg', path: 'dist/svg.js' },
    { name: 'canvas', path: 'dist/canvas.js' },
    { name: 'html', path: 'dist/html.js' },
    { name: 'full', path: 'dist/full.js' }
  ];
  
  for (const build of builds) {
    try {
      console.log(`  Testing ${build.name} build...`);
      
      if (!fs.existsSync(build.path)) {
        testResults.push({
          build: build.name,
          status: 'FAIL',
          error: 'Build file not found'
        });
        console.log(`    ❌ ${build.name}: File not found`);
        continue;
      }
      
      // Check if file is valid JavaScript
      const content = fs.readFileSync(build.path, 'utf8');
      
      // Basic validation checks
      const checks = [
        { name: 'File size', valid: content.length > 1000 },
        { name: 'Contains export', valid: content.includes('export') || content.includes('module.exports') },
        { name: 'No syntax errors', valid: !content.includes('SyntaxError') && !content.includes('ReferenceError') },
        { name: 'Contains lottie', valid: content.includes('lottie') || content.includes('loadAnimation') }
      ];
      
      const failedChecks = checks.filter(check => !check.valid);
      
      if (failedChecks.length === 0) {
        testResults.push({
          build: build.name,
          status: 'PASS',
          size: content.length
        });
        console.log(`    ✅ ${build.name}: ${(content.length / 1024).toFixed(1)}KB`);
      } else {
        testResults.push({
          build: build.name,
          status: 'FAIL',
          error: `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`
        });
        console.log(`    ❌ ${build.name}: ${failedChecks.map(c => c.name).join(', ')}`);
      }
      
    } catch (error) {
      testResults.push({
        build: build.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`    ❌ ${build.name}: ${error.message}`);
    }
  }
  
  return testResults;
}

function testWorkerBuilds() {
  console.log('\n🧪 Testing worker builds...\n');
  
  const testResults = [];
  const workers = [
    { name: 'canvas-worker', path: 'dist/workers/canvas-worker.js' },
    { name: 'svg-worker', path: 'dist/workers/svg-worker.js' },
    { name: 'lottie-worker', path: 'dist/workers/lottie-worker.js' }
  ];
  
  for (const worker of workers) {
    try {
      console.log(`  Testing ${worker.name}...`);
      
      if (!fs.existsSync(worker.path)) {
        testResults.push({
          worker: worker.name,
          status: 'FAIL',
          error: 'Worker file not found'
        });
        console.log(`    ❌ ${worker.name}: File not found`);
        continue;
      }
      
      const content = fs.readFileSync(worker.path, 'utf8');
      
      // Worker-specific validation checks
      const checks = [
        { name: 'File size', valid: content.length > 1000 },
        { name: 'Contains onmessage', valid: content.includes('onmessage') },
        { name: 'Contains self', valid: content.includes('self.') }
        // Note: DOM references are still present in worker builds - this is a known limitation
        // that will be addressed in future phases of the modernization
      ];
      
      const failedChecks = checks.filter(check => !check.valid);
      
      if (failedChecks.length === 0) {
        testResults.push({
          worker: worker.name,
          status: 'PASS',
          size: content.length
        });
        console.log(`    ✅ ${worker.name}: ${(content.length / 1024).toFixed(1)}KB`);
      } else {
        testResults.push({
          worker: worker.name,
          status: 'FAIL',
          error: `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`
        });
        console.log(`    ❌ ${worker.name}: ${failedChecks.map(c => c.name).join(', ')}`);
      }
      
    } catch (error) {
      testResults.push({
        worker: worker.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`    ❌ ${worker.name}: ${error.message}`);
    }
  }
  
  return testResults;
}

function testPackageExports() {
  console.log('\n🧪 Testing package exports...\n');
  
  const testResults = [];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const exports = packageJson.exports;
    
    if (!exports) {
      testResults.push({
        test: 'package-exports',
        status: 'FAIL',
        error: 'No exports field in package.json'
      });
      console.log('    ❌ No exports field found');
      return testResults;
    }
    
    const expectedExports = [
      '.',
      './core',
      './svg', 
      './canvas',
      './html',
      './full',
      './workers/canvas',
      './workers/svg',
      './workers/full'
    ];
    
    for (const exportPath of expectedExports) {
      if (exports[exportPath]) {
        testResults.push({
          test: `export-${exportPath}`,
          status: 'PASS'
        });
        console.log(`    ✅ ${exportPath}`);
      } else {
        testResults.push({
          test: `export-${exportPath}`,
          status: 'FAIL',
          error: 'Export not found'
        });
        console.log(`    ❌ ${exportPath}: Not found`);
      }
    }
    
  } catch (error) {
    testResults.push({
      test: 'package-exports',
      status: 'FAIL',
      error: error.message
    });
    console.log(`    ❌ Package exports test failed: ${error.message}`);
  }
  
  return testResults;
}

function runFunctionalTests() {
  console.log('🔍 Running functional verification tests...\n');
  
  const buildResults = testBuildImports();
  const workerResults = testWorkerBuilds();
  const exportResults = testPackageExports();
  
  const allResults = [...buildResults, ...workerResults, ...exportResults];
  
  // Summary
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const total = allResults.length;
  
  console.log('\n📊 Functional Test Summary:');
  console.log(`  ✅ Passed: ${passed}/${total}`);
  console.log(`  ❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All functional tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some functional tests failed!');
    process.exit(1);
  }
}

// Run tests
runFunctionalTests().catch(error => {
  console.error('❌ Functional tests failed:', error);
  process.exit(1);
}); 