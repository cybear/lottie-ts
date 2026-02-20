import { createSizedArray } from './helpers/arrays';

let subframeEnabled = true;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let expressionsPlugin: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let expressionsInterfaces: any = null;
let idPrefix = '';
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let _shouldRoundValues = false;
const bmPow = Math.pow;
const bmSqrt = Math.sqrt;
const bmFloor = Math.floor;
const bmMax = Math.max;
const bmMin = Math.min;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BMMath: Record<string, any> = {};
(function () {
  const propertyNames: string[] = [
    'abs',
    'acos',
    'acosh',
    'asin',
    'asinh',
    'atan',
    'atanh',
    'atan2',
    'ceil',
    'cbrt',
    'expm1',
    'clz32',
    'cos',
    'cosh',
    'exp',
    'floor',
    'fround',
    'hypot',
    'imul',
    'log',
    'log1p',
    'log2',
    'log10',
    'max',
    'min',
    'pow',
    'random',
    'round',
    'sign',
    'sin',
    'sinh',
    'sqrt',
    'tan',
    'tanh',
    'trunc',
    'E',
    'LN10',
    'LN2',
    'LOG10E',
    'LOG2E',
    'PI',
    'SQRT1_2',
    'SQRT2',
  ];
  let i: number;
  const len = propertyNames.length;
  for (i = 0; i < len; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BMMath[propertyNames[i]] = (Math as any)[propertyNames[i]];
  }
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectInterface(): Record<string, any> {
  return {};
}

BMMath.random = Math.random;
BMMath.abs = function (val: number | number[]): number | number[] {
  const tOfVal = typeof val;
  if (tOfVal === 'object' && (val as number[]).length) {
    const arr = val as number[];
    const absArr = createSizedArray(arr.length) as number[];
    let i: number;
    const len = arr.length;
    for (i = 0; i < len; i += 1) {
      absArr[i] = Math.abs(arr[i]);
    }
    return absArr;
  }
  return Math.abs(val as number);
};

let defaultCurveSegments = 150;
const degToRads = Math.PI / 180;
const roundCorner = 0.5519;

function roundValues(flag: boolean): void {
  _shouldRoundValues = !!flag;
}

function bmRnd(value: number): number {
  if (_shouldRoundValues) {
    return Math.round(value);
  }
  return value;
}

function styleDiv(element: HTMLElement): void {
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.display = 'block';
  element.style.transformOrigin = '0 0';
  (element.style as CSSStyleDeclaration & { webkitTransformOrigin: string }).webkitTransformOrigin = '0 0';
  element.style.backfaceVisibility = 'visible';
  (element.style as CSSStyleDeclaration & { webkitBackfaceVisibility: string }).webkitBackfaceVisibility = 'visible';
  element.style.transformStyle = 'preserve-3d';
  (
    element.style as CSSStyleDeclaration & { webkitTransformStyle: string; mozTransformStyle: string }
  ).webkitTransformStyle = 'preserve-3d';
  (
    element.style as CSSStyleDeclaration & { webkitTransformStyle: string; mozTransformStyle: string }
  ).mozTransformStyle = 'preserve-3d';
}

interface BMEnterFrameEventThis {
  type: string;
  currentTime: number;
  totalTime: number;
  direction: number;
}
function BMEnterFrameEvent(
  this: BMEnterFrameEventThis,
  type: string,
  currentTime: number,
  totalTime: number,
  frameMultiplier: number,
) {
  this.type = type;
  this.currentTime = currentTime;
  this.totalTime = totalTime;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

interface BMCompleteEventThis {
  type: string;
  direction: number;
}
function BMCompleteEvent(this: BMCompleteEventThis, type: string, frameMultiplier: number) {
  this.type = type;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

interface BMCompleteLoopEventThis {
  type: string;
  currentLoop: number;
  totalLoops: number;
  direction: number;
}
function BMCompleteLoopEvent(
  this: BMCompleteLoopEventThis,
  type: string,
  totalLoops: number,
  currentLoop: number,
  frameMultiplier: number,
) {
  this.type = type;
  this.currentLoop = currentLoop;
  this.totalLoops = totalLoops;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

interface BMSegmentStartEventThis {
  type: string;
  firstFrame: number;
  totalFrames: number;
}
function BMSegmentStartEvent(this: BMSegmentStartEventThis, type: string, firstFrame: number, totalFrames: number) {
  this.type = type;
  this.firstFrame = firstFrame;
  this.totalFrames = totalFrames;
}

interface BMDestroyEventThis {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BMDestroyEvent(this: BMDestroyEventThis, type: string, target: any) {
  this.type = type;
  this.target = target;
}

interface BMRenderFrameErrorEventThis {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nativeError: any;
  currentTime: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BMRenderFrameErrorEvent(this: BMRenderFrameErrorEventThis, nativeError: any, currentTime: number) {
  this.type = 'renderFrameError';
  this.nativeError = nativeError;
  this.currentTime = currentTime;
}

interface BMConfigErrorEventThis {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nativeError: any;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BMConfigErrorEvent(this: BMConfigErrorEventThis, nativeError: any) {
  this.type = 'configError';
  this.nativeError = nativeError;
}

interface BMAnimationConfigErrorEventThis {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nativeError: any;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BMAnimationConfigErrorEvent(this: BMAnimationConfigErrorEventThis, type: string, nativeError: any) {
  this.type = type;
  this.nativeError = nativeError;
}

const createElementID = (function () {
  let _count = 0;
  return function createID(): string {
    _count += 1;
    return idPrefix + '__lottie_element_' + _count;
  };
})();

function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
  let r: number;
  let g: number;
  let b: number;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  r = 0;
  g = 0;
  b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      break;
  }
  return [r, g, b];
}

function RGBtoHSV(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
    default:
      break;
  }

  return [h, s, v];
}

function addSaturationToRGB(color: number[], offset: number): [number, number, number] {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[1] += offset;
  if (hsv[1] > 1) {
    hsv[1] = 1;
  } else if (hsv[1] <= 0) {
    hsv[1] = 0;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

function addBrightnessToRGB(color: number[], offset: number): [number, number, number] {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[2] += offset;
  if (hsv[2] > 1) {
    hsv[2] = 1;
  } else if (hsv[2] < 0) {
    hsv[2] = 0;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

function addHueToRGB(color: number[], offset: number): [number, number, number] {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[0] += offset / 360;
  if (hsv[0] > 1) {
    hsv[0] -= 1;
  } else if (hsv[0] < 0) {
    hsv[0] += 1;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

const rgbToHex = (function () {
  const colorMap: string[] = [];
  let i: number;
  let hex: string;
  for (i = 0; i < 256; i += 1) {
    hex = i.toString(16);
    colorMap[i] = hex.length === 1 ? '0' + hex : hex;
  }

  return function (r: number, g: number, b: number): string {
    if (r < 0) {
      r = 0;
    }
    if (g < 0) {
      g = 0;
    }
    if (b < 0) {
      b = 0;
    }
    return '#' + colorMap[r] + colorMap[g] + colorMap[b];
  };
})();

const setSubframeEnabled = (flag: boolean): void => {
  subframeEnabled = !!flag;
};
const getSubframeEnabled = (): boolean => subframeEnabled;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setExpressionsPlugin = (value: any): void => {
  expressionsPlugin = value;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getExpressionsPlugin = (): any => expressionsPlugin;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setExpressionInterfaces = (value: any): void => {
  expressionsInterfaces = value;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getExpressionInterfaces = (): any => expressionsInterfaces;
const setDefaultCurveSegments = (value: number): void => {
  defaultCurveSegments = value;
};
const getDefaultCurveSegments = (): number => defaultCurveSegments;
const setIdPrefix = (value: string): void => {
  idPrefix = value;
};
const getIdPrefix = (): string => idPrefix;

export {
  setSubframeEnabled,
  getSubframeEnabled,
  setExpressionsPlugin,
  getExpressionsPlugin,
  setExpressionInterfaces,
  getExpressionInterfaces,
  setDefaultCurveSegments,
  getDefaultCurveSegments,
  isSafari,
  bmPow,
  bmSqrt,
  bmFloor,
  bmMax,
  bmMin,
  degToRads,
  roundCorner,
  styleDiv,
  bmRnd,
  roundValues,
  BMEnterFrameEvent,
  BMCompleteEvent,
  BMCompleteLoopEvent,
  BMSegmentStartEvent,
  BMDestroyEvent,
  BMRenderFrameErrorEvent,
  BMConfigErrorEvent,
  BMAnimationConfigErrorEvent,
  createElementID,
  addSaturationToRGB,
  addBrightnessToRGB,
  addHueToRGB,
  rgbToHex,
  setIdPrefix,
  getIdPrefix,
  BMMath,
  ProjectInterface,
};
