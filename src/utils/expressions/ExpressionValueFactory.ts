/* eslint-disable @typescript-eslint/no-explicit-any, no-new-wrappers -- AE-style Number/typed-array wrappers for expressions */
import { createTypedArray } from '../helpers/arrays';

const ExpressionPropertyInterface = (function () {
  const defaultUnidimensionalValue = { pv: 0, v: 0, mult: 1 };
  const defaultMultidimensionalValue = { pv: [0, 0, 0], v: [0, 0, 0], mult: 1 };

  function completeProperty(expressionValue: any, property: any, type: string) {
    Object.defineProperty(expressionValue, 'velocity', {
      get: function () {
        return property.getVelocityAtTime(property.comp.currentFrame);
      },
    });
    expressionValue.numKeys = property.keyframes ? property.keyframes.length : 0;
    expressionValue.key = function (pos: number) {
      if (!expressionValue.numKeys) {
        return 0;
      }
      let value: any = '';
      if ('s' in property.keyframes[pos - 1]) {
        value = property.keyframes[pos - 1].s;
      } else if ('e' in property.keyframes[pos - 2]) {
        value = property.keyframes[pos - 2].e;
      } else {
        value = property.keyframes[pos - 2].s;
      }
      const valueProp: any = type === 'unidimensional' ? new Number(value) : Object.assign({}, value);
      valueProp.time = property.keyframes[pos - 1].t / property.elem.comp.globalData.frameRate;
      valueProp.value = type === 'unidimensional' ? value[0] : value;
      return valueProp;
    };
    expressionValue.valueAtTime = property.getValueAtTime;
    expressionValue.speedAtTime = property.getSpeedAtTime;
    expressionValue.velocityAtTime = property.getVelocityAtTime;
    expressionValue.propertyGroup = property.propertyGroup;
  }

  function UnidimensionalPropertyInterface(property: any) {
    if (!property || !('pv' in property)) {
      property = defaultUnidimensionalValue;
    }
    const mult = 1 / property.mult;
    let val = property.pv * mult;
    let expressionValue: any = new Number(val);
    expressionValue.value = val;
    completeProperty(expressionValue, property, 'unidimensional');

    return function () {
      if (property.k) {
        property.getValue();
      }
      val = property.v * mult;
      if (expressionValue.value !== val) {
        expressionValue = new Number(val);
        expressionValue.value = val;
        expressionValue[0] = val;
        completeProperty(expressionValue, property, 'unidimensional');
      }
      return expressionValue;
    };
  }

  function MultidimensionalPropertyInterface(property: any) {
    if (!property || !('pv' in property)) {
      property = defaultMultidimensionalValue;
    }
    const mult = 1 / property.mult;
    const len = (property.data && property.data.l) || property.pv.length;
    const expressionValue: any = createTypedArray('float32', len);
    const arrValue = createTypedArray('float32', len);
    expressionValue.value = arrValue;
    completeProperty(expressionValue, property, 'multidimensional');

    return function () {
      if (property.k) {
        property.getValue();
      }
      for (let i = 0; i < len; i += 1) {
        arrValue[i] = property.v[i] * mult;
        expressionValue[i] = arrValue[i];
      }
      return expressionValue;
    };
  }

  // TODO: try to avoid using this getter
  function defaultGetter() {
    return defaultUnidimensionalValue;
  }

  return function (property: any) {
    if (!property) {
      return defaultGetter;
    }
    if (property.propType === 'unidimensional') {
      return UnidimensionalPropertyInterface(property);
    }
    return MultidimensionalPropertyInterface(property);
  };
})();

export default ExpressionPropertyInterface;
