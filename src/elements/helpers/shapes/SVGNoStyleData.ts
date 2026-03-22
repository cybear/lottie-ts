// @ts-nocheck
import DynamicPropertyContainer from '../../../utils/helpers/dynamicProperties';

class SVGNoStyleData extends DynamicPropertyContainer {
  constructor(elem, data, styleOb) {
    super();
    this.initDynamicPropertyContainer(elem);
    this.getValue = this.iterateDynamicProperties;
    this.style = styleOb;
  }
}

export default SVGNoStyleData;
