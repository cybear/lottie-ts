/* eslint-disable @typescript-eslint/no-explicit-any -- bundle entry: template globals + loose lottie object */
import { setLocationHref, setWebWorker } from '../main';
import animationManagerImport from '../animation/AnimationManager';
import {
  setDefaultCurveSegments,
  getDefaultCurveSegments,
  roundValues,
  setIdPrefix,
  setSubframeEnabled,
  setExpressionsPlugin,
} from '../utils/common';
import PropertyFactory from '../utils/PropertyFactory';
import ShapePropertyFactory from '../utils/shapes/ShapeProperty';
import Matrix from '../3rd_party/transformation-matrix';

const animationManager = animationManagerImport as Record<string, any>;

const lottie: Record<string, any> = {};
const standalone = '__[STANDALONE]__';
const animationData = '__[ANIMATIONDATA]__';
let renderer = '';
let queryString = '';

function setLocation(href: string) {
  setLocationHref(href);
}

function searchAnimations() {
  if ((standalone as any) === true) {
    animationManager.searchAnimations(animationData, standalone, renderer);
  } else {
    animationManager.searchAnimations();
  }
}

function setSubframeRendering(flag: boolean) {
  setSubframeEnabled(flag);
}

function setPrefix(prefix: string) {
  setIdPrefix(prefix);
}

function loadAnimation(params: any) {
  if ((standalone as any) === true) {
    params.animationData = JSON.parse(animationData);
  }
  return animationManager.loadAnimation(params);
}

function setQuality(value: any) {
  if (typeof value === 'string') {
    switch (value) {
      case 'high':
        setDefaultCurveSegments(200);
        break;
      default:
      case 'medium':
        setDefaultCurveSegments(50);
        break;
      case 'low':
        setDefaultCurveSegments(10);
        break;
    }
  } else if (!isNaN(value) && value > 1) {
    setDefaultCurveSegments(value);
  }
  if (getDefaultCurveSegments() >= 50) {
    roundValues(false);
  } else {
    roundValues(true);
  }
}

function inBrowser() {
  return typeof navigator !== 'undefined';
}

function installPlugin(type: string, plugin: any) {
  if (type === 'expressions') {
    setExpressionsPlugin(plugin);
  }
}

function getFactory(name: string) {
  switch (name) {
    case 'propertyFactory':
      return PropertyFactory;
    case 'shapePropertyFactory':
      return ShapePropertyFactory;
    case 'matrix':
      return Matrix;
    default:
      return null;
  }
}

lottie.play = animationManager.play;
lottie.pause = animationManager.pause;
lottie.setLocationHref = setLocation;
lottie.togglePause = animationManager.togglePause;
lottie.setSpeed = animationManager.setSpeed;
lottie.setDirection = animationManager.setDirection;
lottie.stop = animationManager.stop;
lottie.searchAnimations = searchAnimations;
lottie.registerAnimation = animationManager.registerAnimation;
lottie.loadAnimation = loadAnimation;
lottie.setSubframeRendering = setSubframeRendering;
lottie.resize = animationManager.resize;
// lottie.start = start;
lottie.goToAndStop = animationManager.goToAndStop;
lottie.destroy = animationManager.destroy;
lottie.setQuality = setQuality;
lottie.inBrowser = inBrowser;
lottie.installPlugin = installPlugin;
lottie.freeze = animationManager.freeze;
lottie.unfreeze = animationManager.unfreeze;
lottie.setVolume = animationManager.setVolume;
lottie.mute = animationManager.mute;
lottie.unmute = animationManager.unmute;
lottie.getRegisteredAnimations = animationManager.getRegisteredAnimations;
lottie.useWebWorker = setWebWorker;
lottie.setIDPrefix = setPrefix;
lottie.__getFactory = getFactory;
lottie.version = '[[BM_VERSION]]';

function checkReady() {
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval);
    searchAnimations();
  }
}

function getQueryVariable(variable: string) {
  const vars = queryString.split('&');
  for (let i = 0; i < vars.length; i += 1) {
    const pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      // eslint-disable-line eqeqeq
      return decodeURIComponent(pair[1]);
    }
  }
  return null;
}
if (standalone) {
  const scripts = document.getElementsByTagName('script');
  const index = scripts.length - 1;
  const myScript = scripts[index] || {
    src: '',
  };
  queryString = myScript.src ? myScript.src.replace(/^[^\?]+\??/, '') : ''; // eslint-disable-line no-useless-escape
  renderer = getQueryVariable('renderer') ?? '';
}
const readyStateCheckInterval = setInterval(checkReady, 100);

// this adds bodymovin to the window object for backwards compatibility
try {
  if (
    !(typeof exports === 'object' && typeof module !== 'undefined') &&
    !(typeof (globalThis as any).define === 'function' && (globalThis as any).define.amd)
  ) {
    (window as any).bodymovin = lottie;
  }
} catch {
  //
}
export default lottie;
