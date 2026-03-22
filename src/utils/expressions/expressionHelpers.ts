import { createTypedArray } from '../helpers/arrays';
import ExpressionManagerImport from './ExpressionManager';

type ExpressionManagerApi = {
  initiateExpression: (elem: unknown, data: unknown, prop: unknown) => () => void;
};

const ExpressionManager = ExpressionManagerImport as ExpressionManagerApi;

interface ExpressionCapableProp {
  k?: boolean;
  x?: boolean;
  initiateExpression?: ExpressionManagerApi['initiateExpression'];
  effectsSequence: Array<() => void>;
}

interface CachingAtTime {
  lastFrame: number;
  lastIndex: number;
  value: unknown;
  _lastKeyframeIndex?: number;
  _lastPoint?: number;
  _lastAddedLength?: number;
}

interface ValueAtTimeHost {
  elem: { globalData: { frameRate?: number } };
  offsetTime: number;
  _cachingAtTime: CachingAtTime;
  interpolateValue(frameNum: number, caching: CachingAtTime): unknown;
  getValueAtTime(frameNum: number): unknown;
  pv: unknown;
  vel?: unknown;
  propertyGroup?: unknown;
}

const expressionHelpers = (function () {
  function searchExpressions(elem: unknown, data: { x?: unknown }, prop: ExpressionCapableProp) {
    if (data.x) {
      prop.k = true;
      prop.x = true;
      prop.initiateExpression = ExpressionManager.initiateExpression;
      prop.effectsSequence.push(prop.initiateExpression!(elem, data, prop).bind(prop));
    }
  }

  function getValueAtTime(this: ValueAtTimeHost, frameNum: number) {
    frameNum *= this.elem.globalData.frameRate ?? 1;
    frameNum -= this.offsetTime;
    if (frameNum !== this._cachingAtTime.lastFrame) {
      this._cachingAtTime.lastIndex = this._cachingAtTime.lastFrame < frameNum ? this._cachingAtTime.lastIndex : 0;
      this._cachingAtTime.value = this.interpolateValue(frameNum, this._cachingAtTime);
      this._cachingAtTime.lastFrame = frameNum;
    }
    return this._cachingAtTime.value;
  }

  function getSpeedAtTime(this: ValueAtTimeHost, frameNum: number) {
    const delta = -0.01;
    const v1 = this.getValueAtTime(frameNum) as number | number[];
    const v2 = this.getValueAtTime(frameNum + delta) as number | number[];
    let speed = 0;
    if ((v1 as number[]).length) {
      let i: number;
      const arr1 = v1 as number[];
      const arr2 = v2 as number[];
      for (i = 0; i < arr1.length; i += 1) {
        speed += Math.pow(arr2[i] - arr1[i], 2);
      }
      speed = Math.sqrt(speed) * 100;
    } else {
      speed = 0;
    }
    return speed;
  }

  function getVelocityAtTime(this: ValueAtTimeHost, frameNum: number) {
    if (this.vel !== undefined) {
      return this.vel;
    }
    const delta = -0.001;
    const v1 = this.getValueAtTime(frameNum) as number | number[];
    const v2 = this.getValueAtTime(frameNum + delta) as number | number[];
    let velocity: Float32Array | number;
    if ((v1 as number[]).length) {
      velocity = createTypedArray('float32', (v1 as number[]).length) as Float32Array;
      let i: number;
      const arr1 = v1 as number[];
      const arr2 = v2 as number[];
      for (i = 0; i < arr1.length; i += 1) {
        velocity[i] = (arr2[i] - arr1[i]) / delta;
      }
    } else {
      velocity = ((v2 as number) - (v1 as number)) / delta;
    }
    return velocity;
  }

  function getStaticValueAtTime(this: { pv: unknown }) {
    return this.pv;
  }

  function setGroupProperty(this: { propertyGroup?: unknown }, propertyGroup: unknown) {
    this.propertyGroup = propertyGroup;
  }

  return {
    searchExpressions: searchExpressions,
    getSpeedAtTime: getSpeedAtTime,
    getVelocityAtTime: getVelocityAtTime,
    getValueAtTime: getValueAtTime,
    getStaticValueAtTime: getStaticValueAtTime,
    setGroupProperty: setGroupProperty,
  };
})();

export default expressionHelpers;
