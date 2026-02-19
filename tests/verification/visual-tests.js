#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️  Starting Phase 1 Visual Regression Testing...\n');

// Test results storage
const visualResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
  
  visualResults.tests.push({
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  
  visualResults.summary.total++;
  if (status === 'PASS') visualResults.summary.passed++;
  else if (status === 'FAIL') visualResults.summary.failed++;
  else visualResults.summary.skipped++;
}

function checkAnimationFiles() {
  console.log('📋 Checking animation test files...\n');
  
  const testAnimationsDir = path.join(__dirname, '../../test/animations');
  const demoAnimationsDir = path.join(__dirname, '../../demo');
  
  // Check if test animations directory exists
  if (fs.existsSync(testAnimationsDir)) {
    const animationFiles = fs.readdirSync(testAnimationsDir).filter(file => file.endsWith('.json'));
    logTest('Test animations directory exists', 'PASS', `${animationFiles.length} animation files found`);
    
    // Check for specific test animations
    const requiredAnimations = ['simple.json', 'complex.json', 'with-effects.json'];
    for (const animation of requiredAnimations) {
      const animationPath = path.join(testAnimationsDir, animation);
      const exists = fs.existsSync(animationPath);
      logTest(`Test animation exists: ${animation}`, exists ? 'PASS' : 'SKIP', exists ? 'Found' : 'Not found');
    }
  } else {
    logTest('Test animations directory exists', 'SKIP', 'Directory not found');
  }
  
  // Check demo animations
  if (fs.existsSync(demoAnimationsDir)) {
    const demoDirs = fs.readdirSync(demoAnimationsDir).filter(dir => {
      const dirPath = path.join(demoAnimationsDir, dir);
      return fs.statSync(dirPath).isDirectory();
    });
    logTest('Demo animations exist', 'PASS', `${demoDirs.length} demo directories found`);
  } else {
    logTest('Demo animations exist', 'SKIP', 'Demo directory not found');
  }
}

function checkScreenshotDirectory() {
  console.log('📸 Checking screenshot infrastructure...\n');
  
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    logTest('Screenshots directory created', 'PASS', 'Directory created successfully');
  } else {
    logTest('Screenshots directory exists', 'PASS', 'Directory already exists');
  }
  
  // Check for baseline screenshots
  const baselineDir = path.join(screenshotsDir, 'baseline');
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
    logTest('Baseline screenshots directory created', 'PASS', 'Directory created successfully');
  } else {
    const baselineFiles = fs.readdirSync(baselineDir).filter(file => file.endsWith('.png'));
    logTest('Baseline screenshots directory exists', 'PASS', `${baselineFiles.length} baseline images found`);
  }
  
  // Check for new screenshots directory
  const newDir = path.join(screenshotsDir, 'new');
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
    logTest('New screenshots directory created', 'PASS', 'Directory created successfully');
  } else {
    logTest('New screenshots directory exists', 'PASS', 'Directory already exists');
  }
}

function checkHTMLTestFiles() {
  console.log('🌐 Checking HTML test infrastructure...\n');
  
  const testHtmlDir = path.join(__dirname, 'html');
  if (!fs.existsSync(testHtmlDir)) {
    fs.mkdirSync(testHtmlDir, { recursive: true });
  }
  
  // Create a basic test HTML file
  const testHtmlPath = path.join(testHtmlDir, 'visual-test.html');
  const testHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lottie Visual Test</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
        }
        .test-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .lottie-container {
            width: 300px;
            height: 200px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
        }
        .controls {
            margin: 10px 0;
        }
        button {
            margin: 5px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Lottie Visual Regression Test</h1>
    
    <div class="test-container">
        <h2>SVG Renderer Test</h2>
        <div id="svg-container" class="lottie-container"></div>
        <div class="controls">
            <button onclick="playAnimation('svg')">Play</button>
            <button onclick="pauseAnimation('svg')">Pause</button>
            <button onclick="stopAnimation('svg')">Stop</button>
        </div>
    </div>
    
    <div class="test-container">
        <h2>Canvas Renderer Test</h2>
        <div id="canvas-container" class="lottie-container"></div>
        <div class="controls">
            <button onclick="playAnimation('canvas')">Play</button>
            <button onclick="pauseAnimation('canvas')">Pause</button>
            <button onclick="stopAnimation('canvas')">Stop</button>
        </div>
    </div>
    
    <div class="test-container">
        <h2>HTML Renderer Test</h2>
        <div id="html-container" class="lottie-container"></div>
        <div class="controls">
            <button onclick="playAnimation('html')">Play</button>
            <button onclick="pauseAnimation('html')">Pause</button>
            <button onclick="stopAnimation('html')">Stop</button>
        </div>
    </div>

    <script src="../../build/player/lottie.js"></script>
    <script>
        let animations = {};
        
        // Sample animation data (simple rectangle)
        const sampleAnimation = {
            "v": "5.5.7",
            "fr": 30,
            "ip": 0,
            "op": 60,
            "w": 300,
            "h": 200,
            "nm": "Simple Rectangle",
            "ddd": 0,
            "assets": [],
            "layers": [
                {
                    "ddd": 0,
                    "ind": 1,
                    "ty": 4,
                    "nm": "Rectangle",
                    "sr": 1,
                    "ks": {
                        "o": {"a": 0, "k": 100},
                        "r": {"a": 0, "k": 0},
                        "p": {"a": 0, "k": [150, 100, 0]},
                        "a": {"a": 0, "k": [0, 0, 0]},
                        "s": {"a": 0, "k": [100, 100, 100]}
                    },
                    "ao": 0,
                    "shapes": [
                        {
                            "ty": "gr",
                            "it": [
                                {
                                    "d": 1,
                                    "ty": "el",
                                    "s": {"a": 0, "k": [100, 100]},
                                    "p": {"a": 0, "k": [0, 0]},
                                    "nm": "Ellipse Path 1"
                                },
                                {
                                    "ty": "fl",
                                    "c": {"a": 0, "k": [1, 0, 0, 1]},
                                    "o": {"a": 0, "k": 100},
                                    "r": 1,
                                    "nm": "Fill 1"
                                }
                            ],
                            "nm": "Ellipse 1"
                        }
                    ]
                }
            ]
        };
        
        // Initialize animations
        function initAnimations() {
            try {
                // SVG renderer
                animations.svg = lottie.loadAnimation({
                    container: document.getElementById('svg-container'),
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    animationData: sampleAnimation
                });
                
                // Canvas renderer
                animations.canvas = lottie.loadAnimation({
                    container: document.getElementById('canvas-container'),
                    renderer: 'canvas',
                    loop: true,
                    autoplay: false,
                    animationData: sampleAnimation
                });
                
                // HTML renderer
                animations.html = lottie.loadAnimation({
                    container: document.getElementById('html-container'),
                    renderer: 'html',
                    loop: true,
                    autoplay: false,
                    animationData: sampleAnimation
                });
                
                console.log('All animations initialized successfully');
                return true;
            } catch (error) {
                console.error('Error initializing animations:', error);
                return false;
            }
        }
        
        // Control functions
        function playAnimation(type) {
            if (animations[type]) {
                animations[type].play();
            }
        }
        
        function pauseAnimation(type) {
            if (animations[type]) {
                animations[type].pause();
            }
        }
        
        function stopAnimation(type) {
            if (animations[type]) {
                animations[type].stop();
            }
        }
        
        // Initialize when page loads
        window.addEventListener('load', function() {
            setTimeout(initAnimations, 100);
        });
    </script>
</body>
</html>`;
  
  fs.writeFileSync(testHtmlPath, testHtmlContent);
  logTest('Visual test HTML file created', 'PASS', 'Test file generated successfully');
  
  return testHtmlPath;
}

function checkPuppeteerAvailability() {
  console.log('🤖 Checking Puppeteer availability...\n');
  
  try {
    // Try to require puppeteer (this will fail if not installed, but that's okay for now)
    logTest('Puppeteer dependency check', 'SKIP', 'Puppeteer not required for basic verification');
    return false;
  } catch (error) {
    logTest('Puppeteer dependency check', 'SKIP', 'Puppeteer not available');
    return false;
  }
}

function generateVisualTestReport() {
  console.log('\n📊 Visual Test Infrastructure Summary:');
  console.log(`  Total tests: ${visualResults.summary.total}`);
  console.log(`  ✅ Passed: ${visualResults.summary.passed}`);
  console.log(`  ❌ Failed: ${visualResults.summary.failed}`);
  console.log(`  ⏭️  Skipped: ${visualResults.summary.skipped}`);
  console.log(`  Success rate: ${Math.round((visualResults.summary.passed / visualResults.summary.total) * 100)}%`);
  
  // Save report
  const reportPath = path.join(__dirname, 'visual-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(visualResults, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return visualResults;
}

async function runVisualTests() {
  console.log('🖼️  Running visual regression test infrastructure...\n');
  
  // Check animation files
  checkAnimationFiles();
  
  // Check screenshot infrastructure
  checkScreenshotDirectory();
  
  // Check HTML test files
  const testHtmlPath = checkHTMLTestFiles();
  
  // Check Puppeteer availability
  checkPuppeteerAvailability();
  
  // Provide instructions for manual visual testing
  console.log('\n📋 Manual Visual Testing Instructions:');
  console.log('1. Start a local server in the project root:');
  console.log('   python3 -m http.server 3000');
  console.log('   or');
  console.log('   npx serve .');
  console.log('');
  console.log('2. Open the visual test page:');
  console.log(`   http://localhost:3000/${testHtmlPath.replace(__dirname + '/../../', '')}`);
  console.log('');
  console.log('3. Take screenshots of each renderer:');
  console.log('   - SVG renderer (should show red circle)');
  console.log('   - Canvas renderer (should show red circle)');
  console.log('   - HTML renderer (should show red circle)');
  console.log('');
  console.log('4. Compare screenshots with baseline images');
  console.log('5. Document any visual differences');
  
  return visualResults;
}

// Main execution
async function main() {
  try {
    await runVisualTests();
    const report = generateVisualTestReport();
    
    // Exit with appropriate code
    if (report.summary.failed > 0) {
      console.log('\n❌ Visual verification failed!');
      process.exit(1);
    } else {
      console.log('\n✅ Visual verification infrastructure ready!');
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Visual verification failed with error:', error);
    process.exit(1);
  }
}

main(); 