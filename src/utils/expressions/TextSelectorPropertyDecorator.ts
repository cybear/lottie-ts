/* eslint-disable @typescript-eslint/no-explicit-any -- text selector expression decorator */
import ExpressionManager from './ExpressionManager';
import expressionHelpers from './expressionHelpers';
import TextSelectorProp from '../text/TextSelectorProperty';

const TextExpressionSelectorPropFactory = (function () {
  function getValueProxy(this: any, index: number, total: number) {
    this.textIndex = index + 1;
    this.textTotal = total;
    this.v = this.getValue() * this.mult;
    return this.v;
  }

  return function (this: any, elem: any, data: any, _arr?: any) {
    this.pv = 1;
    this.comp = elem.comp;
    this.elem = elem;
    this.mult = 0.01;
    this.propType = 'textSelector';
    this.textTotal = data.totalChars;
    this.selectorValue = 100;
    this.lastValue = [1, 1, 1];
    this.k = true;
    this.x = true;
    this.getValue = (ExpressionManager as any).initiateExpression.bind(this)(elem, data, this);
    this.getMult = getValueProxy;
    this.getVelocityAtTime = expressionHelpers.getVelocityAtTime;
    if (this.kf) {
      this.getValueAtTime = expressionHelpers.getValueAtTime.bind(this);
    } else {
      this.getValueAtTime = expressionHelpers.getStaticValueAtTime.bind(this);
    }
    this.setGroupProperty = expressionHelpers.setGroupProperty;
  };
})();

const propertyGetTextProp = TextSelectorProp.getTextSelectorProp;
(TextSelectorProp as any).getTextSelectorProp = function (elem: any, data: any, arr: any) {
  if (data.t === 1) {
    return new (TextExpressionSelectorPropFactory as any)(elem, data, arr);
  }
  return propertyGetTextProp(elem, data, arr);
};

export default TextExpressionSelectorPropFactory;
