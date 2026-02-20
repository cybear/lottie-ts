'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const origLottie = fs.readFileSync('/tmp/lottie_orig.js', 'utf8');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/build/player/lottie.js')) {
      req.respond({ status: 200, contentType: 'application/javascript', body: origLottie });
    } else {
      req.continue();
    }
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3000/demo/happy2016/', { waitUntil: 'networkidle0', timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/happy2016-orig.png' });
  const info = await page.evaluate(() => {
    const el = document.querySelector('#bodymovin');
    if (!el) return { found: false };
    return {
      found: true,
      childCount: el.childElementCount,
      totalDOMElements: el.querySelectorAll('*').length,
      svgElements: el.querySelectorAll('svg').length,
      innerHTML: el.innerHTML.substring(0, 2000),
      totalLength: el.innerHTML.length,
    };
  });
  console.log('ORIGINAL BUILD result:', JSON.stringify(info, null, 2));
  console.log('errors:', errors);
  await browser.close();
})().catch(e => { console.error(e.stack); process.exit(1); });
