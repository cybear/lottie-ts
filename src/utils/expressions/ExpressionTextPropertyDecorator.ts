/* eslint-disable @typescript-eslint/no-explicit-any -- patches TextProperty prototype */
import TextProperty from '../text/TextProperty';
import ExpressionManager from './ExpressionManager';

function addDecorator() {
  function searchExpressions(this: any) {
    if (this.data.d.x) {
      this.calculateExpression = (ExpressionManager as any).initiateExpression.bind(this)(this.elem, this.data.d, this);
      this.addEffect(this.getExpressionValue.bind(this));
      return true;
    }
    return null;
  }

  (TextProperty.prototype as any).getExpressionValue = function (this: any, currentValue: any, text: any) {
    const newValue = this.calculateExpression(text);
    if (currentValue.t !== newValue) {
      const newData: Record<string, unknown> = {};
      this.copyData(newData, currentValue);
      newData.t = newValue.toString();
      newData.__complete = false;
      return newData;
    }
    return currentValue;
  };

  (TextProperty.prototype as any).searchProperty = function (this: any) {
    const isKeyframed = this.searchKeyframes();
    const hasExpressions = this.searchExpressions();
    this.kf = isKeyframed || hasExpressions;
    return this.kf;
  };

  (TextProperty.prototype as any).searchExpressions = searchExpressions;
}

function initialize() {
  addDecorator();
}

export default initialize;
