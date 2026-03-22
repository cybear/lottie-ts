import PropertyFactory from '../../../utils/PropertyFactory';
import DashProperty from '../../../utils/shapes/DashProperty';
import type { DynamicPropertyContainerMixin } from '../../../utils/helpers/dynamicProperties';
import type SVGStyleData from './SVGStyleData';
import SVGGradientFillStyleData, { type GradientStyleData } from './SVGGradientFillStyleData';

type GradientStrokeStyleData = GradientStyleData & { w: unknown; d?: unknown };

class SVGGradientStrokeStyleData extends SVGGradientFillStyleData {
  w!: unknown;
  d!: DashProperty;

  constructor(elem: DynamicPropertyContainerMixin['container'], data: GradientStrokeStyleData, styleOb: SVGStyleData) {
    super(elem, data, styleOb, true);
    this.w = PropertyFactory.getProp(elem, data.w, 0, null, this);
    this.d = new DashProperty(elem, data.d || {}, 'svg', this);
    this.initGradientData(elem, data, styleOb);
    this._isAnimated = !!this._isAnimated;
  }
}

export default SVGGradientStrokeStyleData;
