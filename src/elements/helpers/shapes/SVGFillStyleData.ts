import DynamicPropertyContainer, { type DynamicPropertyContainerMixin } from '../../../utils/helpers/dynamicProperties';
import PropertyFactory from '../../../utils/PropertyFactory';
import type { ElementData } from '../../../types/lottieRuntime';

class SVGFillStyleData extends DynamicPropertyContainer {
  declare getValue: () => void;
  o: unknown;
  c: unknown;
  style: unknown;

  constructor(elem: DynamicPropertyContainerMixin['container'], data: ElementData, styleOb: unknown) {
    super();
    this.initDynamicPropertyContainer(elem);
    this.getValue = this.iterateDynamicProperties;
    this.o = PropertyFactory.getProp(elem, data.o, 0, 0.01, this);
    this.c = PropertyFactory.getProp(elem, data.c, 1, 255, this);
    this.style = styleOb;
  }
}

export default SVGFillStyleData;
