/**
 * This traverses all json files located on the examples folder, then iterates
 * over each file and opens a puppeteer page to a screenshot of all frames
 * combined in a single page.
 */

const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const { promises: { readFile } } = require('fs');
const { parseArgs } = require('node:util');
const PNG = require('pngjs').PNG;

/** Set in takeImageStrip via dynamic import (pixelmatch v7+ is ESM-only). */
let pixelmatch;

/** Lottie JSON under repo root (served as /demo/.../data.json) */
const examplesDirectory = '/demo/';
const createDirectory = 'screenshots/create';
const compareDirectory = 'screenshots/compare';

function createDirectoryPath(path) {
    const directories = path.split('/');
    directories.reduce((acc, current) => {
        let dir = acc + '/' + current
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        return dir
    }, '.')
}

const animations = [
  { directory: 'adrock', fileName: 'data.json', renderer: 'svg' },
  { directory: 'adrock', fileName: 'data.json', renderer: 'canvas' },
  { directory: 'bodymovin', fileName: 'data.json', renderer: 'svg' },
  { directory: 'bodymovin', fileName: 'data.json', renderer: 'canvas' },
  { directory: 'gatin', fileName: 'data.json', renderer: 'svg' },
  { directory: 'happy2016', fileName: 'data.json', renderer: 'svg' },
  { directory: 'navidad', fileName: 'data.json', renderer: 'svg' },
];

const getSettings = async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      step: { type: 'string', short: 's', default: 'create' },
    },
  });
  const step = values.step === 'compare' ? 'compare' : 'create';
  return { step };
};

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

const filesData = [
  {
    path: '/test/index.html',
    filePath: './test/index.html',
    type: 'html',
  },
  {
    path: '/lottie.min.js',
    filePath: './build/player/lottie.min.js',
    type: 'js',
  },
];

const getEncoding = (() => {
  const encodingMap = {
    js: 'utf8',
    json: 'utf8',
    html: 'utf8',
  };
  return (fileType) => encodingMap[fileType];
})();

const getContentTypeHeader = (() => {
  const contentTypeMap = {
    js: { 'Content-Type': 'application/javascript' },
    json: { 'Content-Type': 'application/json' },
    html: { 'Content-Type': 'text/html; charset=utf-8' },
    wasm: { 'Content-Type': 'application/wasm' },
  };
  return (fileType) => contentTypeMap[fileType];
})();

const startServer = async () => {
  const app = express();
  await Promise.all(filesData.map(async (file) => {
    const fileData = await readFile(file.filePath, getEncoding(file.type));
    app.get(file.path, async (req, res) => {
      res.writeHead(200, getContentTypeHeader(file.type));
      // TODO: comment line. Only for live updates.
      const fileData = await readFile(file.filePath, getEncoding(file.type));
      res.end(fileData);
    });
    return file;
  }));

  app.get('/*splat', async (req, res) => {
    try {
      if (req.originalUrl.indexOf('.json') !== -1) {
        const file = await readFile(`.${req.originalUrl}`, 'utf8');
        res.send(file);
      } else {
        const data = await readFile(`.${req.originalUrl}`);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      }
    } catch (err) {
      res.send('');
    }
  });
  await new Promise((resolve) => {
    app.listen(9999, '127.0.0.1', resolve);
  });
};

const getBrowser = async () => puppeteer.launch({
  defaultViewport: null,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const startPage = async (browser, path, renderer) => {
  const targetURL = `http://localhost:9999/test/index.html\
?path=${encodeURIComponent(path)}&renderer=${renderer}`;
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text())); // eslint-disable-line no-console
  await page.setViewport({
    width: 1024,
    height: 768,
  });
  await page.goto(targetURL);
  return page;
};

const createBridgeHelper = async (page) => {
  let resolveScoped;
  let animationLoadedPromise;
  const messageHandler = (event) => {
    resolveScoped(event);
  };
  const onAnimationLoaded = () => {
    if (animationLoadedPromise) {
        animationLoadedPromise()
    }
  }
  await page.exposeFunction('onAnimationLoaded', onAnimationLoaded);
  await page.exposeFunction('onMessageReceivedEvent', messageHandler);
  const waitForMessage = () => new Promise((resolve) => {
    resolveScoped = resolve;
  });
  const waitForAnimationLoaded = () => new Promise((resolve) => {
    animationLoadedPromise = resolve;
  });
  const continueExecution = async () => {
    page.evaluate(() => {
      window.continueExecution();
    });
  };
  return {
    waitForAnimationLoaded,
    waitForMessage,
    continueExecution,
  };
};

const compareFiles = (folderName, fileName) => {
    const createPath = `${createDirectory}/${folderName}/${fileName}`;
    const comparePath = `${compareDirectory}/${folderName}/${fileName}`;
    const img1 = PNG.sync.read(fs.readFileSync(createPath));
    const img2 = PNG.sync.read(fs.readFileSync(comparePath));
    const {width, height} = img1;
    const diff = new PNG({width, height});

    const result = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
    // Using 50 as threshold because it should be an acceptable difference
    // that doesn't raise false positives
    if (result > 200) {
        console.log('RESULT NOT ZERO: ', result);
        throw new Error(`Animation failed: ${folderName} at frame: ${fileName}`)
    }
}

const createIndividualAssets = async (page, folderName, settings) => {
  const filePath = `${settings.step === 'create' ? createDirectory : compareDirectory}/${folderName}`;
  createDirectoryPath(filePath);
  let isLastFrame = false;
  const bridgeHelper = await (createBridgeHelper(page));
  page.evaluate(() => {
    window.startProcess();
  });
  await bridgeHelper.waitForAnimationLoaded();
  while (!isLastFrame) {
    // Disabling rule because execution can't be parallelized
    /* eslint-disable no-await-in-loop */
    await wait(1);
    page.evaluate(() => {
        window.continueExecution();
    });
    const message = await bridgeHelper.waitForMessage();
    const fileNumber = message.currentFrame.toString().padStart(5, '0');
    const fileName = `image_${fileNumber}.png`;
    const localDestinationPath = `${filePath}/${fileName}`;
    await page.screenshot({
      path: localDestinationPath,
      fullPage: false,
    });
    if (settings.step === 'compare') {
      try {
        compareFiles(folderName, fileName);
      } catch (err) {
        console.log('FAILED AT FRAME: ', message.currentFrame);
        throw err;
      }
    }
    isLastFrame = message.isLast;
  }
};

const getDirFiles = async (directory) => (
  new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  })
);

async function processPage(browser, settings, directory, animation) {
  let fullDirectory = `${directory}`;
  if (animation.directory) {
    fullDirectory += `${animation.directory}/`;
  }
  const fileName = animation.fileName;
  const page = await startPage(browser, fullDirectory + fileName, animation.renderer);
  const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
  let fullName = `${fileNameWithoutExtension}_${animation.renderer}`
  if (animation.directory) {
    fullName = `${animation.directory}_` + fullName;
  }
  await createIndividualAssets(page, fullName, settings);
}

const iteratePages = async (browser, settings) => {
  const failedAnimations = [];
  for (let i = 0; i < animations.length; i += 1) {
    const animation = animations[i];
    let fileName =  `${animation.renderer}_${animation.fileName}`;
    if (animation.directory) {
      fileName = `${animation.directory}_` + fileName;
    }
    try {
        // eslint-disable-next-line no-await-in-loop
        await processPage(browser, settings, examplesDirectory, animation);
        if (settings.step === 'create') {
          console.log(`Creating animation: ${fileName}`);
        }
        if (settings.step === 'compare') {
            console.log(`Animation passed: ${fileName}`);
        }
    } catch (error) {
        if (settings.step === 'compare') {
            failedAnimations.push({
              fileName: fileName
            })
        }
    }
  }
  if (failedAnimations.length) {
    failedAnimations.forEach(animation => {
        console.log(`Animation failed: ${animation.fileName}`);
    })
    throw new Error('Animations failed');
  }
};


const takeImageStrip = async () => {
  let browser;
  let exitCode = 0;
  try {
    const pm = await import('pixelmatch');
    pixelmatch = pm.default;
    await startServer();
    const settings = await getSettings();
    browser = await getBrowser();
    await iteratePages(browser, settings);
  } catch (error) {
    console.log(error); // eslint-disable-line no-console
    exitCode = 1;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        /* ignore */
      }
    }
  }
  process.exit(exitCode);
};

takeImageStrip();