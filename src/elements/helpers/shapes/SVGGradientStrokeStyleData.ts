// @ts-nocheck
import PropertyFactory from '../../../utils/PropertyFactory';
import DashProperty from '../../../utils/shapes/DashProperty';
import SVGGradientFillStyleData from './SVGGradientFillStyleData';

class SVGGradientStrokeStyleData extends SVGGradientFillStyleData {
  constructor(elem, data, styleOb) {
    super(elem, data, styleOb, true);
    this.w = PropertyFactory.getProp(elem, data.w, 0, null, this);
    this.d = new DashProperty(elem, data.d || {}, 'svg', this);
    this.initGradientData(elem, data, styleOb);
    this._isAnimated = !!this._isAnimated;
  }
}

export default SVGGradientStrokeStyleData;
