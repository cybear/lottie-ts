import DynamicPropertyContainer, { type DynamicPropertyContainerMixin } from '../../../utils/helpers/dynamicProperties';

class SVGNoStyleData extends DynamicPropertyContainer {
  declare getValue: () => void;
  style: unknown;

  constructor(elem: DynamicPropertyContainerMixin['container'], _data: unknown, styleOb: unknown) {
    super();
    this.initDynamicPropertyContainer(elem);
    this.getValue = this.iterateDynamicProperties;
    this.style = styleOb;
  }
}

export default SVGNoStyleData;
