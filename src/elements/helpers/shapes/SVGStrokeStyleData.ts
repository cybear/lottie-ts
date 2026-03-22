import DynamicPropertyContainer, { type DynamicPropertyContainerMixin } from '../../../utils/helpers/dynamicProperties';
import PropertyFactory from '../../../utils/PropertyFactory';
import DashProperty from '../../../utils/shapes/DashProperty';
import type { ElementData } from '../../../types/lottieRuntime';

class SVGStrokeStyleData extends DynamicPropertyContainer {
  declare getValue: () => void;
  o: unknown;
  w: unknown;
  d: DashProperty;
  c: unknown;
  style: unknown;

  constructor(
    elem: DynamicPropertyContainerMixin['container'],
    data: ElementData & { o: unknown; w: unknown; c: unknown; d?: unknown },
    styleOb: unknown,
  ) {
    super();
    this.initDynamicPropertyContainer(elem);
    this.getValue = this.iterateDynamicProperties;
    this.o = PropertyFactory.getProp(elem, data.o, 0, 0.01, this);
    this.w = PropertyFactory.getProp(elem, data.w, 0, null, this);
    this.d = new DashProperty(elem, data.d || {}, 'svg', this);
    this.c = PropertyFactory.getProp(elem, data.c, 1, 255, this);
    this.style = styleOb;
    this._isAnimated = !!this._isAnimated;
  }
}

export default SVGStrokeStyleData;
