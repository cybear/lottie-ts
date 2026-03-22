/* eslint-disable camelcase, @typescript-eslint/no-explicit-any -- expression VM: polymorphic math and eval sandbox */

import { degToRads, BMMath } from '../common';
import { createTypedArray } from '../helpers/arrays';
import BezierFactory from '../../3rd_party/BezierEaser';
import shapePool from '../pooling/shape_pool';
import seedrandom from 'seedrandom';
import propTypes from '../helpers/propTypes';

const ExpressionManager = (function () {
  'use strict';

  const ob: Record<string, any> = {};
  const Math = BMMath;
  const window = null;
  const document = null;
  const XMLHttpRequest = null;
  const fetch = null;
  const frames = null;
  let _lottieGlobal: Record<string, any> = {};
  // Patch BMMath with a seedable PRNG so that expression randomness can be made
  // deterministic.  Uses the npm `seedrandom` package (MIT) instead of the
  // previously vendored copy, which had a custom `initialize(mathObj)` wrapper.
  BMMath.random = seedrandom();
  BMMath.seedrandom = function (seed: string | number) {
    BMMath.random = seedrandom(String(seed));
  };

  function resetFrame() {
    _lottieGlobal = {};
  }

  function $bm_isInstanceOfArray(arr: any) {
    return arr.constructor === Array || arr.constructor === Float32Array;
  }

  function isNumerable(tOfV: any, v: any) {
    return tOfV === 'number' || v instanceof Number || tOfV === 'boolean' || tOfV === 'string';
  }

  function $bm_neg(a: any) {
    const tOfA = typeof a;
    if (tOfA === 'number' || a instanceof Number || tOfA === 'boolean') {
      return -a;
    }
    if ($bm_isInstanceOfArray(a)) {
      let i;
      const lenA = a.length;
      const retArr = [];
      for (i = 0; i < lenA; i += 1) {
        retArr[i] = -a[i];
      }
      return retArr;
    }
    if (a.propType) {
      return a.v;
    }
    return -a;
  }

  const easeInBez = BezierFactory.getBezierEasing(0.333, 0, 0.833, 0.833, 'easeIn').get;
  const easeOutBez = BezierFactory.getBezierEasing(0.167, 0.167, 0.667, 1, 'easeOut').get;
  const easeInOutBez = BezierFactory.getBezierEasing(0.33, 0, 0.667, 1, 'easeInOut').get;

  function sum(a: any, b: any) {
    const tOfA = typeof a;
    const tOfB = typeof b;
    if ((isNumerable(tOfA, a) && isNumerable(tOfB, b)) || tOfA === 'string' || tOfB === 'string') {
      return a + b;
    }
    if ($bm_isInstanceOfArray(a) && isNumerable(tOfB, b)) {
      a = a.slice(0);
      a[0] += b;
      return a;
    }
    if (isNumerable(tOfA, a) && $bm_isInstanceOfArray(b)) {
      b = b.slice(0);
      b[0] = a + b[0];
      return b;
    }
    if ($bm_isInstanceOfArray(a) && $bm_isInstanceOfArray(b)) {
      let i = 0;
      const lenA = a.length;
      const lenB = b.length;
      const retArr = [];
      while (i < lenA || i < lenB) {
        if (
          (typeof a[i] === 'number' || a[i] instanceof Number) &&
          (typeof b[i] === 'number' || b[i] instanceof Number)
        ) {
          retArr[i] = a[i] + b[i];
        } else {
          retArr[i] = b[i] === undefined ? a[i] : a[i] || b[i];
        }
        i += 1;
      }
      return retArr;
    }
    return 0;
  }
  const add = sum;

  function sub(a: any, b: any) {
    const tOfA = typeof a;
    const tOfB = typeof b;
    if (isNumerable(tOfA, a) && isNumerable(tOfB, b)) {
      if (tOfA === 'string') {
        a = parseInt(a, 10);
      }
      if (tOfB === 'string') {
        b = parseInt(b, 10);
      }
      return a - b;
    }
    if ($bm_isInstanceOfArray(a) && isNumerable(tOfB, b)) {
      a = a.slice(0);
      a[0] -= b;
      return a;
    }
    if (isNumerable(tOfA, a) && $bm_isInstanceOfArray(b)) {
      b = b.slice(0);
      b[0] = a - b[0];
      return b;
    }
    if ($bm_isInstanceOfArray(a) && $bm_isInstanceOfArray(b)) {
      let i = 0;
      const lenA = a.length;
      const lenB = b.length;
      const retArr = [];
      while (i < lenA || i < lenB) {
        if (
          (typeof a[i] === 'number' || a[i] instanceof Number) &&
          (typeof b[i] === 'number' || b[i] instanceof Number)
        ) {
          retArr[i] = a[i] - b[i];
        } else {
          retArr[i] = b[i] === undefined ? a[i] : a[i] || b[i];
        }
        i += 1;
      }
      return retArr;
    }
    return 0;
  }

  function mul(a: any, b: any) {
    const tOfA = typeof a;
    const tOfB = typeof b;
    let arr;
    if (isNumerable(tOfA, a) && isNumerable(tOfB, b)) {
      return a * b;
    }

    let i;
    let len;
    if ($bm_isInstanceOfArray(a) && isNumerable(tOfB, b)) {
      len = a.length;
      arr = createTypedArray('float32', len);
      for (i = 0; i < len; i += 1) {
        arr[i] = a[i] * b;
      }
      return arr;
    }
    if (isNumerable(tOfA, a) && $bm_isInstanceOfArray(b)) {
      len = b.length;
      arr = createTypedArray('float32', len);
      for (i = 0; i < len; i += 1) {
        arr[i] = a * b[i];
      }
      return arr;
    }
    return 0;
  }

  function div(a: any, b: any) {
    const tOfA = typeof a;
    const tOfB = typeof b;
    let arr;
    if (isNumerable(tOfA, a) && isNumerable(tOfB, b)) {
      return a / b;
    }
    let i;
    let len;
    if ($bm_isInstanceOfArray(a) && isNumerable(tOfB, b)) {
      len = a.length;
      arr = createTypedArray('float32', len);
      for (i = 0; i < len; i += 1) {
        arr[i] = a[i] / b;
      }
      return arr;
    }
    if (isNumerable(tOfA, a) && $bm_isInstanceOfArray(b)) {
      len = b.length;
      arr = createTypedArray('float32', len);
      for (i = 0; i < len; i += 1) {
        arr[i] = a / b[i];
      }
      return arr;
    }
    return 0;
  }
  function mod(a: any, b: any) {
    if (typeof a === 'string') {
      a = parseInt(a, 10);
    }
    if (typeof b === 'string') {
      b = parseInt(b, 10);
    }
    return a % b;
  }
  const $bm_sum = sum;
  const $bm_sub = sub;
  const $bm_mul = mul;
  const $bm_div = div;
  const $bm_mod = mod;

  function clamp(num: any, min: any, max: any) {
    if (min > max) {
      const mm = max;
      max = min;
      min = mm;
    }
    return Math.min(Math.max(num, min), max);
  }

  function radiansToDegrees(val: any) {
    return val / degToRads;
  }
  const radians_to_degrees = radiansToDegrees;

  function degreesToRadians(val: any) {
    return val * degToRads;
  }
  const degrees_to_radians = radiansToDegrees;

  const helperLengthArray = [0, 0, 0, 0, 0, 0];

  function length(arr1: any, arr2?: any) {
    if (typeof arr1 === 'number' || arr1 instanceof Number) {
      arr2 = arr2 || 0;
      return Math.abs(Number(arr1) - Number(arr2));
    }
    if (!arr2) {
      arr2 = helperLengthArray;
    }
    let i;
    const len = Math.min(arr1.length, arr2.length);
    let addedLength = 0;
    for (i = 0; i < len; i += 1) {
      addedLength += Math.pow(arr2[i] - arr1[i], 2);
    }
    return Math.sqrt(addedLength);
  }

  function normalize(vec: any) {
    return div(vec, length(vec));
  }

  function rgbToHsl(val: any) {
    const r = val[0];
    const g = val[1];
    const b = val[2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0; // achromatic
      s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          break;
      }
      h /= 6;
    }

    return [h, s, l, val[3]];
  }

  function hue2rgb(p: any, q: any, t: any) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToRgb(val: any) {
    const h = val[0];
    const s = val[1];
    const l = val[2];

    let r;
    let g;
    let b;

    if (s === 0) {
      r = l; // achromatic
      b = l; // achromatic
      g = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b, val[3]];
  }

  function linear(t: any, tMin: any, tMax: any, value1: any, value2: any) {
    if (value1 === undefined || value2 === undefined) {
      value1 = tMin;
      value2 = tMax;
      tMin = 0;
      tMax = 1;
    }
    if (tMax < tMin) {
      const _tMin = tMax;
      tMax = tMin;
      tMin = _tMin;
    }
    if (t <= tMin) {
      return value1;
    }
    if (t >= tMax) {
      return value2;
    }
    const perc = tMax === tMin ? 0 : (t - tMin) / (tMax - tMin);
    if (!value1.length) {
      return value1 + (value2 - value1) * perc;
    }
    let i;
    const len = value1.length;
    const arr = createTypedArray('float32', len);
    for (i = 0; i < len; i += 1) {
      arr[i] = value1[i] + (value2[i] - value1[i]) * perc;
    }
    return arr;
  }
  function random(min: any, max: any) {
    if (max === undefined) {
      if (min === undefined) {
        min = 0;
        max = 1;
      } else {
        max = min;
        min = undefined;
      }
    }
    if (max.length) {
      let i;
      const len = max.length;
      if (!min) {
        min = createTypedArray('float32', len);
      }
      const arr = createTypedArray('float32', len);
      const rnd = BMMath.random();
      for (i = 0; i < len; i += 1) {
        arr[i] = min[i] + rnd * (max[i] - min[i]);
      }
      return arr;
    }
    if (min === undefined) {
      min = 0;
    }
    const rndm = BMMath.random();
    return min + rndm * (max - min);
  }

  function createPath(points: any, inTangents: any, outTangents: any, closed: any) {
    let i;
    const len = points.length;
    const path = shapePool.newElement();
    path.setPathData(!!closed, len);
    const arrPlaceholder = [0, 0];
    let inVertexPoint;
    let outVertexPoint;
    for (i = 0; i < len; i += 1) {
      inVertexPoint = inTangents && inTangents[i] ? inTangents[i] : arrPlaceholder;
      outVertexPoint = outTangents && outTangents[i] ? outTangents[i] : arrPlaceholder;
      path.setTripleAt(
        points[i][0],
        points[i][1],
        outVertexPoint[0] + points[i][0],
        outVertexPoint[1] + points[i][1],
        inVertexPoint[0] + points[i][0],
        inVertexPoint[1] + points[i][1],
        i,
        true,
      );
    }
    return path;
  }

  function initiateExpression(this: any, elem: any, data: any, property: any) {
    // Bail out if we don't want expressions
    function noOp(_value: any) {
      return _value;
    }
    if (!elem.globalData.renderConfig.runExpressions) {
      return noOp;
    }

    const val = data.x;
    const needsVelocity = /velocity(?![\w\d])/.test(val);
    const _needsRandom = val.indexOf('random') !== -1;
    const elemType = elem.data.ty;
    let transform: any;
    let $bm_transform: any;
    let content: any;
    let effect: any;
    const thisProperty = property;
    thisProperty._name = elem.data.nm;
    thisProperty.valueAtTime = thisProperty.getValueAtTime;
    Object.defineProperty(thisProperty, 'value', {
      get: function () {
        return thisProperty.v;
      },
    });
    elem.comp.frameDuration = 1 / elem.comp.globalData.frameRate;
    elem.comp.displayStartTime = 0;
    const inPoint = elem.data.ip / elem.comp.globalData.frameRate;
    const outPoint = elem.data.op / elem.comp.globalData.frameRate;
    const width = elem.data.sw ? elem.data.sw : 0;
    const height = elem.data.sh ? elem.data.sh : 0;
    const name = elem.data.nm;
    let loopIn: any;
    let loop_in: any;
    let loopOut: any;
    let loop_out: any;
    let smooth: any;
    let toWorld: any;
    let fromWorld: any;
    let fromComp: any;
    let toComp: any;
    let fromCompToSurface: any;
    let position: any;
    let rotation: any;
    let anchorPoint: any;
    let scale: any;
    let thisLayer: any;
    let thisComp: any;
    let mask: any;
    let valueAtTime: any;
    let velocityAtTime: any;

    let scoped_bm_rt: any;
    // val = val.replace(/(\\?"|')((http)(s)?(:\/))?\/.*?(\\?"|')/g, "\"\""); // deter potential network calls
    const expression_function = eval('[function _expression_function(){' + val + ';scoped_bm_rt=$bm_rt}]')[0]; // eslint-disable-line no-eval
    const numKeys = property.kf ? data.k.length : 0;

    const active = !this.data || this.data.hd !== true;

    const wiggle = function wiggle(this: any, freq: any, amp: any) {
      let iWiggle;
      let j;
      const lenWiggle = this.pv.length ? this.pv.length : 1;
      const addedAmps = createTypedArray('float32', lenWiggle);
      freq = 5;
      const iterations = Math.floor(time * freq);
      iWiggle = 0;
      j = 0;
      while (iWiggle < iterations) {
        // var rnd = BMMath.random();
        for (j = 0; j < lenWiggle; j += 1) {
          addedAmps[j] += -amp + amp * 2 * BMMath.random();
          // addedAmps[j] += -amp + amp*2*rnd;
        }
        iWiggle += 1;
      }
      // var rnd2 = BMMath.random();
      const periods = time * freq;
      const perc = periods - Math.floor(periods);
      const arr = createTypedArray('float32', lenWiggle);
      if (lenWiggle > 1) {
        for (j = 0; j < lenWiggle; j += 1) {
          arr[j] = this.pv[j] + addedAmps[j] + (-amp + amp * 2 * BMMath.random()) * perc;
          // arr[j] = this.pv[j] + addedAmps[j] + (-amp + amp*2*rnd)*perc;
          // arr[i] = this.pv[i] + addedAmp + amp1*perc + amp2*(1-perc);
        }
        return arr;
      }
      return this.pv + addedAmps[0] + (-amp + amp * 2 * BMMath.random()) * perc;
    }.bind(this);

    if (thisProperty.loopIn) {
      loopIn = thisProperty.loopIn.bind(thisProperty);
      loop_in = loopIn;
    }

    if (thisProperty.loopOut) {
      loopOut = thisProperty.loopOut.bind(thisProperty);
      loop_out = loopOut;
    }

    if (thisProperty.smooth) {
      smooth = thisProperty.smooth.bind(thisProperty);
    }

    function loopInDuration(type: any, duration: any) {
      return loopIn(type, duration, true);
    }

    function loopOutDuration(type: any, duration: any) {
      return loopOut(type, duration, true);
    }

    if (this.getValueAtTime) {
      valueAtTime = this.getValueAtTime.bind(this);
    }

    if (this.getVelocityAtTime) {
      velocityAtTime = this.getVelocityAtTime.bind(this);
    }

    const comp = elem.comp.globalData.projectInterface.bind(elem.comp.globalData.projectInterface);

    function lookAt(elem1: any, elem2: any) {
      const fVec = [elem2[0] - elem1[0], elem2[1] - elem1[1], elem2[2] - elem1[2]];
      const pitch = Math.atan2(fVec[0], Math.sqrt(fVec[1] * fVec[1] + fVec[2] * fVec[2])) / degToRads;
      const yaw = -Math.atan2(fVec[1], fVec[2]) / degToRads;
      return [yaw, pitch, 0];
    }

    function easeOut(t: any, tMin: any, tMax: any, val1: any, val2: any) {
      return applyEase(easeOutBez, t, tMin, tMax, val1, val2);
    }

    function easeIn(t: any, tMin: any, tMax: any, val1: any, val2: any) {
      return applyEase(easeInBez, t, tMin, tMax, val1, val2);
    }

    function ease(t: any, tMin: any, tMax: any, val1: any, val2: any) {
      return applyEase(easeInOutBez, t, tMin, tMax, val1, val2);
    }

    function applyEase(fn: any, t: any, tMin: any, tMax: any, val1: any, val2: any) {
      if (val1 === undefined) {
        val1 = tMin;
        val2 = tMax;
      } else {
        t = (t - tMin) / (tMax - tMin);
      }
      if (t > 1) {
        t = 1;
      } else if (t < 0) {
        t = 0;
      }
      const mult = fn(t);
      if ($bm_isInstanceOfArray(val1)) {
        let iKey;
        const lenKey = val1.length;
        const arr = createTypedArray('float32', lenKey);
        for (iKey = 0; iKey < lenKey; iKey += 1) {
          arr[iKey] = (val2[iKey] - val1[iKey]) * mult + val1[iKey];
        }
        return arr;
      }
      return (val2 - val1) * mult + val1;
    }

    function nearestKey(time: any) {
      let iKey;
      const lenKey = data.k.length;
      let index;
      let keyTime;
      if (!data.k.length || typeof data.k[0] === 'number') {
        index = 0;
        keyTime = 0;
      } else {
        index = -1;
        time *= elem.comp.globalData.frameRate;
        if (time < data.k[0].t) {
          index = 1;
          keyTime = data.k[0].t;
        } else {
          for (iKey = 0; iKey < lenKey - 1; iKey += 1) {
            if (time === data.k[iKey].t) {
              index = iKey + 1;
              keyTime = data.k[iKey].t;
              break;
            } else if (time > data.k[iKey].t && time < data.k[iKey + 1].t) {
              if (time - data.k[iKey].t > data.k[iKey + 1].t - time) {
                index = iKey + 2;
                keyTime = data.k[iKey + 1].t;
              } else {
                index = iKey + 1;
                keyTime = data.k[iKey].t;
              }
              break;
            }
          }
          if (index === -1) {
            index = iKey + 1;
            keyTime = data.k[iKey].t;
          }
        }
      }
      const obKey: any = {};
      obKey.index = index;
      obKey.time = keyTime / elem.comp.globalData.frameRate;
      return obKey;
    }

    function key(ind: any) {
      let iKey;
      if (!data.k.length || typeof data.k[0] === 'number') {
        throw new Error('The property has no keyframe at index ' + ind);
      }
      ind -= 1;
      const obKey: any = {
        time: data.k[ind].t / elem.comp.globalData.frameRate,
        value: [] as any[],
      };
      const arr = Object.prototype.hasOwnProperty.call(data.k[ind], 's') ? data.k[ind].s : data.k[ind - 1].e;

      const lenKey = arr.length;
      for (iKey = 0; iKey < lenKey; iKey += 1) {
        obKey[iKey] = arr[iKey];
        obKey.value[iKey] = arr[iKey];
      }
      return obKey;
    }

    function framesToTime(fr: any, fps: any) {
      if (!fps) {
        fps = elem.comp.globalData.frameRate;
      }
      return fr / fps;
    }

    function timeToFrames(t: any, fps: any) {
      if (!t && t !== 0) {
        t = time;
      }
      if (!fps) {
        fps = elem.comp.globalData.frameRate;
      }
      return t * fps;
    }

    function seedRandom(seed: any) {
      BMMath.seedrandom(randSeed + seed);
    }

    function sourceRectAtTime() {
      return elem.sourceRectAtTime();
    }

    function substring(init: any, end: any) {
      if (typeof value === 'string') {
        if (end === undefined) {
          return value.substring(init);
        }
        return value.substring(init, end);
      }
      return '';
    }

    function substr(init: any, end: any) {
      if (typeof value === 'string') {
        if (end === undefined) {
          return value.substr(init);
        }
        return value.substr(init, end);
      }
      return '';
    }

    function posterizeTime(framesPerSecond: any) {
      time = framesPerSecond === 0 ? 0 : Math.floor(time * framesPerSecond) / framesPerSecond;
      value = valueAtTime(time);
    }

    let time: any;
    let velocity: any;
    let value: any;
    let text: any;
    let textIndex: any;
    let textTotal: any;
    let selectorValue: any;
    const index = elem.data.ind;
    let hasParent = !!(elem.hierarchy && elem.hierarchy.length);
    let parent: any;
    const randSeed = Math.floor(Math.random() * 1000000);
    const globalData = elem.globalData;

    function executeExpression(this: any, _value: any) {
      // globalData.pushExpression();
      value = _value;
      if (this.frameExpressionId === elem.globalData.frameId && this.propType !== 'textSelector') {
        return value;
      }
      if (this.propType === 'textSelector') {
        textIndex = this.textIndex;
        textTotal = this.textTotal;
        selectorValue = this.selectorValue;
      }
      if (!thisLayer) {
        text = elem.layerInterface.text;
        thisLayer = elem.layerInterface;
        thisComp = elem.comp.compInterface;
        toWorld = thisLayer.toWorld.bind(thisLayer);
        fromWorld = thisLayer.fromWorld.bind(thisLayer);
        fromComp = thisLayer.fromComp.bind(thisLayer);
        toComp = thisLayer.toComp.bind(thisLayer);
        mask = thisLayer.mask ? thisLayer.mask.bind(thisLayer) : null;
        fromCompToSurface = fromComp;
      }
      if (!transform) {
        transform = elem.layerInterface('ADBE Transform Group');
        $bm_transform = transform;
        if (transform) {
          anchorPoint = transform.anchorPoint;
          /* position = transform.position;
                    rotation = transform.rotation;
                    scale = transform.scale; */
        }
      }

      if (elemType === 4 && !content) {
        content = thisLayer('ADBE Root Vectors Group');
      }
      if (!effect) {
        effect = thisLayer(4);
      }
      hasParent = !!(elem.hierarchy && elem.hierarchy.length);
      if (hasParent && !parent) {
        parent = elem.hierarchy[0].layerInterface;
      }
      time = this.comp.renderedFrame / this.comp.globalData.frameRate;
      if (_needsRandom) {
        seedRandom(randSeed + time);
      }
      if (needsVelocity) {
        velocity = velocityAtTime(time);
      }
      expression_function();
      this.frameExpressionId = elem.globalData.frameId;

      // TODO: Check if it's possible to return on ShapeInterface the .v value
      // Changed this to a ternary operation because Rollup failed compiling it correctly
      scoped_bm_rt = scoped_bm_rt.propType === propTypes.SHAPE ? scoped_bm_rt.v : scoped_bm_rt;
      return scoped_bm_rt;
    }
    // Bundlers will see these as dead code and unless we reference them
    executeExpression.__preventDeadCodeRemoval = [
      $bm_transform,
      anchorPoint,
      time,
      velocity,
      inPoint,
      outPoint,
      width,
      height,
      name,
      loop_in,
      loop_out,
      smooth,
      toComp,
      fromCompToSurface,
      toWorld,
      fromWorld,
      mask,
      position,
      rotation,
      scale,
      thisComp,
      numKeys,
      active,
      wiggle,
      loopInDuration,
      loopOutDuration,
      comp,
      lookAt,
      easeOut,
      easeIn,
      ease,
      nearestKey,
      key,
      text,
      textIndex,
      textTotal,
      selectorValue,
      framesToTime,
      timeToFrames,
      sourceRectAtTime,
      substring,
      substr,
      posterizeTime,
      index,
      globalData,
    ];
    return executeExpression;
  }

  ob.initiateExpression = initiateExpression;
  ob.__preventDeadCodeRemoval = [
    window,
    document,
    XMLHttpRequest,
    fetch,
    frames,
    $bm_neg,
    add,
    $bm_sum,
    $bm_sub,
    $bm_mul,
    $bm_div,
    $bm_mod,
    clamp,
    radians_to_degrees,
    degreesToRadians,
    degrees_to_radians,
    normalize,
    rgbToHsl,
    hslToRgb,
    linear,
    random,
    createPath,
    _lottieGlobal,
  ];
  ob.resetFrame = resetFrame;
  return ob;
})();

export default ExpressionManager;
